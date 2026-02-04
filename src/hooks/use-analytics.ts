"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useAnalytics() {
  const pathname = usePathname();

    const trackEvent = useCallback(async (eventType: string, metadata: any = {}, elementId?: string) => {
      let userId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch (e) {
        // Silently fail auth check for anonymous tracking
      }

      await supabase.from("user_activity").insert({
        user_id: userId,
        event_type: eventType,
        path: pathname,
        element_id: elementId,
        metadata: metadata,
      });
    }, [pathname]);

  // Track page view
  useEffect(() => {
    trackEvent("page_view");
  }, [pathname, trackEvent]);

  // Track page time
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const endTime = Date.now();
      const timeSpent = Math.round((endTime - startTime) / 1000);
      if (timeSpent > 2) { // Only track if spent more than 2 seconds
        trackEvent("page_time", { seconds: timeSpent });
      }
    };
  }, [pathname, trackEvent]);

  return { trackEvent };
}
