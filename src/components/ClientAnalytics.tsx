"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { useEffect } from "react";

export function ClientAnalytics() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const elementId = target.id || target.getAttribute("data-testid") || undefined;
      const text = target.innerText?.slice(0, 50);
      
      trackEvent("click", { 
        text, 
        tagName: target.tagName,
        className: target.className 
      }, elementId);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [trackEvent]);

  return null;
}
