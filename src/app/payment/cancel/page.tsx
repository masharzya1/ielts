"use client";

import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-red-500/20 text-red-500">
        <XCircle size={64} strokeWidth={1.5} />
      </div>
      
      <h1 className="mb-4 text-4xl font-bold tracking-tight">
        Payment Cancelled
      </h1>
      
      <p className="mb-10 max-w-md text-xl text-muted-foreground">
        Your payment was cancelled. No charges have been made to your account.
      </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg font-bold gap-2">
            <Link href="/practice">
              <ArrowLeft className="h-5 w-5" />
              Back to Practice
            </Link>
          </Button>
        <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg gap-2" onClick={() => window.history.back()}>
          <RefreshCw className="h-5 w-5" />
          Try Again
        </Button>
      </div>

      <div className="mt-12 p-6 rounded-2xl bg-card/50 border border-border/50 max-w-md">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-muted-foreground">
          If you experienced any issues during checkout or have questions about pricing, 
          please contact our support team.
        </p>
      </div>
    </div>
  );
}
