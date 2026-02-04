import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, PaymentSuccessEmail } from "@/lib/email";
import React from "react";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Rupantor Pay Webhook Received:", payload);

    const supabase = await createClient();

    // Get Rupantor Pay settings to verify
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_settings")
      .maybeSingle();

    const rupantorSettings = settingsData?.value?.rupantor_pay;

    if (!rupantorSettings?.api_key) {
      return NextResponse.json({ error: "Rupantor Pay is not configured" }, { status: 500 });
    }

    // Standard Rupantor Pay webhook verification
    const verifyRes = await fetch("https://rupantorpay.com/api/v1/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        api_key: rupantorSettings.api_key,
        payment_id: payload.payment_id
      }),
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status === "success" && verifyData.payment?.status === "completed") {
      const orderId = verifyData.payment.order_id || payload.order_id;

        // 1. Try to find in user_purchases (Test purchase)
        const { data: purchaseData } = await supabase
          .from("user_purchases")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
  
          if (purchaseData) {
            let expiresAt: string | null = null;
            
            // If it's a mock test, we might want to set an expiration
            if (purchaseData.item_type === "mock_test") {
              const date = new Date();
              date.setFullYear(date.getFullYear() + 1); // 1 year access
              expiresAt = date.toISOString();
            }
    
              const { error: updateError } = await supabase
                .from("user_purchases")
                .update({ 
                  status: "completed",
                  payment_id: payload.payment_id,
                  expires_at: expiresAt,
                  updated_at: new Date().toISOString()
                })
                .eq("id", orderId);
      
              if (updateError) throw updateError;

              // Also create a record in mock_registrations if it's a mock test
              if (purchaseData.item_type === "mock_test" || purchaseData.item_type === "mock" || purchaseData.item_type === "mock_single") {
                await supabase
                  .from("mock_registrations")
                  .upsert({
                    user_id: purchaseData.user_id,
                    test_id: purchaseData.item_id,
                    status: "completed",
                    payment_id: payload.payment_id,
                    payment_status: "completed",
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'user_id,test_id' });
              }

            // Fetch user email for notification
            const { data: userData } = await supabase.auth.admin.getUserById(purchaseData.user_id);
            if (userData?.user?.email) {
              try {
                // Call sendEmail directly instead of internal fetch
                await sendEmail({
                  to: userData.user.email,
                  subject: `পেমেন্ট সফল - ${purchaseData.item_type === 'mock_test' ? "Mock Test" : "Practice Module"}`,
                  react: React.createElement(PaymentSuccessEmail, {
                    name: userData.user.user_metadata?.full_name || "User",
                    email: userData.user.email,
                    productName: purchaseData.item_type === 'mock_test' ? "Mock Test" : "Practice Module",
                    productType: purchaseData.item_type,
                    amount: purchaseData.amount,
                    transactionId: payload.payment_id,
                    purchaseDate: new Date().toLocaleDateString('bn-BD'),
                    expiryDate: expiresAt ? new Date(expiresAt).toLocaleDateString('bn-BD') : "আজীবন"
                  })
                });
              } catch (e) {
                console.error("Failed to send payment email directly", e);
              }
            }

            return NextResponse.json({ message: "Purchase updated successfully" });
          }

          // 1.5 Try to find in pre_bookings (Pre-book purchase)
          const { data: prebookData } = await supabase
            .from("pre_bookings")
            .select("*")
            .eq("id", orderId)
            .maybeSingle();

          if (prebookData) {
            const { error: updateError } = await supabase
              .from("pre_bookings")
              .update({ 
                status: "confirmed",
                payment_status: "completed",
                payment_id: payload.payment_id,
                created_at: new Date().toISOString() // Update to actual completion time
              })
              .eq("id", orderId);

            if (updateError) throw updateError;

            // Fetch user email for notification
            const { data: userData } = await supabase.auth.admin.getUserById(prebookData.user_id);
            if (userData?.user?.email) {
              try {
                await sendEmail({
                  to: userData.user.email,
                  subject: "প্রি-বুকিং সফল - IELTS Practice BD",
                  react: React.createElement(PaymentSuccessEmail, {
                    name: userData.user.user_metadata?.full_name || "User",
                    email: userData.user.email,
                    productName: "Mock Test Pre-booking",
                    productType: "prebook",
                    amount: prebookData.amount_paid,
                    transactionId: payload.payment_id,
                    purchaseDate: new Date().toLocaleDateString('bn-BD'),
                    expiryDate: "পরবর্তী মক টেস্ট"
                  })
                });
              } catch (e) {
                console.error("Failed to send prebook email", e);
              }
            }

            return NextResponse.json({ message: "Pre-booking updated successfully" });
          }


        // 2. Try to find in checkout_sessions (Subscription purchase)
      const { data: sessionData } = await supabase
        .from("checkout_sessions")
        .select("*")
        .eq("id", orderId)
        .eq("status", "pending")
        .maybeSingle();

      if (sessionData) {
        // Mark session as completed
        await supabase
          .from("checkout_sessions")
          .update({ status: "completed" })
          .eq("id", orderId);

        const cartData = sessionData.cart_data;
        const now = new Date();
        
        // Fetch existing subscription to check for stacking
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("expires_at")
          .eq("user_id", sessionData.user_id)
          .eq("status", "active")
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let baseDate = now;
        if (existingSub && new Date(existingSub.expires_at) > now) {
          baseDate = new Date(existingSub.expires_at);
        }

        // Calculate max expires_at from items
        let maxExpiresAt = baseDate;
        cartData.items.forEach((item: any) => {
          const itemExpiresAt = new Date(baseDate);
          itemExpiresAt.setDate(itemExpiresAt.getDate() + (item.duration_days || 365));
          if (itemExpiresAt > maxExpiresAt) {
            maxExpiresAt = itemExpiresAt;
          }
        });

        // Create or Update Subscription record
        if (existingSub && new Date(existingSub.expires_at) > now) {
          await supabase
            .from("subscriptions")
            .update({
              expires_at: maxExpiresAt.toISOString(),
              updated_at: now.toISOString()
            })
            .eq("user_id", sessionData.user_id)
            .eq("status", "active");
        } else {
          await supabase
            .from("subscriptions")
            .insert({
              user_id: sessionData.user_id,
              plan_type: "custom_paid",
              amount: verifyData.payment.amount,
              currency: "BDT",
              payment_method: "rupantor_pay",
              payment_id: payload.payment_id,
              status: "active",
              starts_at: now.toISOString(),
              expires_at: maxExpiresAt.toISOString(),
            });
        }

        // Create Individual Purchase records with stacking
        const purchaseRecords = await Promise.all(cartData.items.map(async (item: any) => {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.item_slug);
          
          // Check for existing active purchase of this same item
          const { data: existingPurchase } = await supabase
            .from("user_purchases")
            .select("expires_at")
            .eq("user_id", sessionData.user_id)
            .eq("item_type", item.item_type)
            .eq(isUuid ? "item_id" : "module_slug", item.item_slug)
            .eq("status", "completed")
            .order("expires_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          let itemBaseDate = now;
          if (existingPurchase && new Date(existingPurchase.expires_at) > now) {
            itemBaseDate = new Date(existingPurchase.expires_at);
          }

          const expiresAt = new Date(itemBaseDate);
          expiresAt.setDate(expiresAt.getDate() + (item.duration_days || 365));
          
          return {
            user_id: sessionData.user_id,
            item_type: item.item_type,
            item_id: isUuid ? item.item_slug : null,
            module_slug: isUuid ? null : item.item_slug,
            duration_days: item.duration_days || 365,
            amount: item.price,
            currency: "BDT",
            payment_method: "rupantor_pay",
            payment_id: payload.payment_id,
            status: "completed",
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString()
          };
        }));

        const { error: purchaseError } = await supabase
          .from("user_purchases")
          .insert(purchaseRecords);

        if (purchaseError) throw purchaseError;

        // Fetch user email for subscription notification
        const { data: userData } = await supabase.auth.admin.getUserById(sessionData.user_id);
        if (userData?.user?.email) {
          try {
            await sendEmail({
              to: userData.user.email,
              subject: "পেমেন্ট সফল - সাবস্ক্রিপশন সক্রিয় হয়েছে",
              react: React.createElement(PaymentSuccessEmail, {
                name: userData.user.user_metadata?.full_name || "User",
                email: userData.user.email,
                productName: "Custom Subscription",
                productType: "subscription",
                amount: verifyData.payment.amount,
                transactionId: payload.payment_id,
                purchaseDate: new Date().toLocaleDateString('bn-BD'),
                expiryDate: maxExpiresAt.toLocaleDateString('bn-BD')
              })
            });
          } catch (e) {
            console.error("Failed to send subscription email directly", e);
          }
        }

        return NextResponse.json({ message: "Subscription activated successfully" });
      }

      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    } else {
      console.warn("Rupantor Pay Webhook Verification Failed:", verifyData);
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
