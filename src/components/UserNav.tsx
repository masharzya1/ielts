"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, LayoutDashboard, Shield } from "lucide-react";

const userCache = {
  user: null as any,
  role: null as string | null,
  loaded: false,
  listeners: new Set<() => void>(),
};

export function UserNav({ isMobileMenu = false }: { isMobileMenu?: boolean }) {
  const [user, setUser] = useState<any>(userCache.user);
  const [role, setRole] = useState<string | null>(userCache.role);
  const [loading, setLoading] = useState(!userCache.loaded);
  const router = useRouter();

  const updateState = useCallback(() => {
    setUser(userCache.user);
    setRole(userCache.role);
    setLoading(!userCache.loaded);
  }, []);

    useEffect(() => {
      userCache.listeners.add(updateState);
      
      if (userCache.loaded) {
        updateState();
        return () => {
          userCache.listeners.delete(updateState);
        };
      }

      let mounted = true;

      const loadUser = async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (!mounted) return;

            if (error) {
              if (error.name === 'AuthRetryableFetchError' || error.name === 'AbortError' || error.message?.toLowerCase().includes('abort')) {
                // Ignore abort errors
                return;
              }
              throw error;
            }
            
            if (session?.user) {
              userCache.user = session.user;
              const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .maybeSingle();
              
              if (!mounted) return;
              userCache.role = profile?.role || "user";
            } else {
              userCache.user = null;
              userCache.role = null;
            }
            
            userCache.loaded = true;
            userCache.listeners.forEach(fn => fn());
          } catch (error: any) {
            if (!mounted) return;
            // Only log non-abort errors
            if (error?.name !== 'AbortError' && !error?.message?.toLowerCase().includes('abort')) {
              console.error("Error loading user:", error);
            }
            userCache.loaded = true;
            userCache.listeners.forEach(fn => fn());
          }
      };

      if (!userCache.loaded) {
        loadUser();
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            userCache.user = session.user;
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .maybeSingle();
            
            if (!mounted) return;
            
            userCache.role = profile?.role || "user";
            userCache.loaded = true;
            userCache.listeners.forEach(fn => fn());
            router.refresh();
          } else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
            if (event === 'SIGNED_OUT') {
              userCache.user = null;
              userCache.role = null;
            } else if (session?.user) {
              userCache.user = session.user;
            }
            
            userCache.loaded = true;
            userCache.listeners.forEach(fn => fn());
            router.refresh();
          }
        }
      );

    return () => {
      mounted = false;
      userCache.listeners.delete(updateState);
      subscription.unsubscribe();
    };
  }, [router, updateState]);

  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    if (isMobileMenu) {
      return (
        <div className="flex flex-col gap-3 w-full">
          <Button asChild variant="outline" className="w-full font-bold h-12 text-lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="w-full font-bold h-12 text-lg">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <Button asChild variant="ghost" className="hidden lg:inline-flex font-semibold">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild className="hidden lg:inline-flex font-semibold px-6">
          <Link href="/register">Sign Up</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex lg:hidden font-semibold px-6">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (isMobileMenu) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 font-bold"
        >
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm">{user.user_metadata?.full_name || user.email}</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </Link>
        <Button 
          variant="destructive" 
          className="w-full font-bold h-12 text-lg"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{user.user_metadata?.full_name || user.email}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer flex items-center py-2">
              <LayoutDashboard className="mr-3 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Dashboard</span>
            </Link>
          </DropdownMenuItem>
          {role === "admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer flex items-center py-2 text-primary focus:text-primary focus:bg-primary/5">
                <Shield className="mr-3 h-4 w-4" />
                <span className="font-bold">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer flex items-center py-2">
            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
          }} 
          className="cursor-pointer flex items-center py-2 text-destructive focus:text-destructive focus:bg-destructive/5"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
