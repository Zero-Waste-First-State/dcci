"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AutoLogoutProps {
  timeoutMinutes?: number;
  onLogout?: () => void;
}

export function AutoLogout({ timeoutMinutes = 30, onLogout }: AutoLogoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Check if current page is a task-specific table or dashboard page
  const isTaskTable = pathname.includes('/dashboard/') && 
    (pathname.includes('/adding-material') ||
     pathname.includes('/measurements') ||
     pathname.includes('/issues') ||
     pathname.includes('/moving-bins') ||
     pathname.includes('/finished-compost') ||
     pathname.includes('/browns-bin') ||
     pathname.includes('/contamination'));
  
  // Check if we're on any dashboard page (including main dashboard)
  const isDashboardPage = pathname.startsWith('/dashboard');

  const resetTimeout = () => {
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut();
        onLogout?.();
        router.push("/");
      } catch (error) {
        console.error("Auto-logout error:", error);
      }
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Much more conservative activity detection - only reset on meaningful interactions
    const handleActivity = () => {
      // Only reset timeout if it's been at least 10 minutes since last reset
      const timeThreshold = 10 * 60 * 1000; // 10 minutes
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > timeThreshold) {
        resetTimeout();
      }
    };

    // Handle page visibility changes - be more conservative
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, don't reset timeout immediately
        // Let the existing timeout continue
      } else {
        // Page is visible again, reset timeout
        resetTimeout();
      }
    };

    // Handle page unload - logout when tab/window is closed
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      try {
        // Use sendBeacon for reliable delivery even when page is closing
        const logoutData = new FormData();
        logoutData.append('action', 'logout');
        
        // Send logout request
        navigator.sendBeacon('/api/auth/logout', logoutData);
      } catch (error) {
        console.error('Logout beacon failed:', error);
      }
    };

    // Only listen to meaningful user interactions, not every mousemove
    const events = [
      "click",
      "keydown"
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeoutMinutes, router, supabase, onLogout]);

  return null; // This component doesn't render anything
}
