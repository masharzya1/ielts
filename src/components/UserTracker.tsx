"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UserTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
      let mounted = true;
      const trackActivity = async (duration: number) => {
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user || !mounted) return;

          const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
          };

          await supabase.from("user_activity").insert({
            user_id: user.id,
            path: pathname,
            device_info: deviceInfo,
            stay_duration: Math.round(duration / 1000), // convert to seconds
          });
        } catch (error: any) {
          // Ignore abort errors during navigation
          if (error?.name !== 'AbortError' && !error?.message?.toLowerCase().includes('abort')) {
            console.error("Tracking error:", error);
          }
        }
      };

      const startTime = Date.now();
      
      return () => {
        mounted = false;
        const duration = Date.now() - startTime;
        if (duration > 1000) { // Only track if stayed for more than 1s
          trackActivity(duration);
        }
      };
    }, [pathname]);


  return null;
}
