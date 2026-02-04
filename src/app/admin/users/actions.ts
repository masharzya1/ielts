"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(formData: FormData) {
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    console.error("Error updating role:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

export async function assignSubscriptionToUser(formData: FormData) {
  const userId = formData.get("userId") as string;
  const itemType = formData.get("itemType") as string;
  const moduleSlug = formData.get("moduleSlug") as string || null;
  const durationDays = parseInt(formData.get("durationDays") as string);

  const supabase = await createClient();

  const startsAt = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(startsAt.getDate() + durationDays);

  const { error } = await supabase
    .from("user_purchases")
    .insert({
      user_id: userId,
      item_type: itemType,
      module_slug: moduleSlug,
      duration_days: durationDays,
      status: "completed",
      amount: 0,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_id: "ADMIN_ASSIGNED_" + Math.random().toString(36).substring(7).toUpperCase()
    });

  if (error) {
    console.error("Error assigning subscription:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function removeSubscriptionFromUser(formData: FormData) {
  const userId = formData.get("userId") as string;
  const purchaseId = formData.get("purchaseId") as string;

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_purchases")
    .update({ status: "removed", expires_at: new Date().toISOString() })
    .eq("id", purchaseId);

  if (error) {
    console.error("Error removing subscription:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function giveTestToUser(formData: FormData) {
  const userId = formData.get("userId") as string;
  const testId = formData.get("testId") as string;

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_purchases")
    .insert({
      user_id: userId,
      item_id: testId,
      item_type: "mock_single",
      status: "completed",
      amount: 0,
      payment_id: "ADMIN_GIFT_" + Math.random().toString(36).substring(7).toUpperCase()
    });

  if (error) {
    console.error("Error giving test:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}
