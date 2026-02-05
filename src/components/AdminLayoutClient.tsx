"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Users, 
  BookOpen, 
  Settings, 
  LayoutDashboard,
  LogOut, 
  ShieldCheck, 
  Menu,
  FileText,
  BarChart3,
  Calendar,
  Sparkles,
  Mail,
  GraduationCap,
  Zap,
  Library
} from "lucide-react";
import Link from "next/link";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLayoutClient({
  children,
  userEmail
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isEditor = pathname?.includes("/editor");

    const navItems = [
        { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { label: "Users", icon: Users, href: "/admin/users" },
        { label: "Mock Tests", icon: BookOpen, href: "/admin/mock" },
        { label: "Sample Tests", icon: GraduationCap, href: "/admin/tests?type=sample" },
        { label: "Micro Tests", icon: Zap, href: "/admin/tests?type=micro" },
        { label: "Cambridge Tests", icon: Library, href: "/admin/tests?type=cambridge" },
        { label: "Pre-bookings", icon: Calendar, href: "/admin/pre-bookings" },
        { label: "Practice", icon: FileText, href: "/admin/practice" },
        { label: "Vocab", icon: Sparkles, href: "/admin/vocab" },
        { label: "Email Settings", icon: Mail, href: "/admin/settings/emails" },
        { label: "AI Settings", icon: Sparkles, href: "/admin/settings?tab=ai" },
        { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
        { label: "Settings", icon: Settings, href: "/admin/settings" },
      ];

  const showSidebar = mounted && !isEditor;

  return (
    <div className={cn("min-h-screen bg-background font-hind-siliguri", showSidebar && "flex")}>
      {/* Desktop Sidebar */}
      {showSidebar && (
        <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r border-border bg-card/50 backdrop-blur-xl">
          <div className="flex h-16 items-center px-6 border-b border-border">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span>Admin Panel</span>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all group",
                  pathname === item.href && "text-primary bg-primary/10"
                )}
              >
                <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <form action="/api/auth/signout" method="POST">
              <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group">
                <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">Sign Out</span>
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col min-w-0", showSidebar && "lg:pl-64")}>
        {/* Mobile Header */}
        {showSidebar && (
          <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <Link href="/admin" className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Admin</span>
            </Link>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-6 border-b border-border">
                  <SheetTitle className="flex items-center gap-2 font-bold text-xl">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span>Admin Panel</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all",
                        pathname === item.href && "text-primary bg-primary/10"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t border-border bg-card">
                  <form action="/api/auth/signout" method="POST">
                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className={cn("mx-auto", showSidebar ? "p-4 md:p-8 max-w-7xl" : "")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
