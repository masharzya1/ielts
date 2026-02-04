"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { Menu, X } from "lucide-react";
import { UserNav } from "./UserNav";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

    const navLinks = [
      { href: "/", label: "হোম" },
      { href: "/free", label: "ফ্রি" },
      { href: "/practice", label: "প্র্যাকটিস" },
      { href: "/mock", label: "মক টেস্ট" },
      { href: "/vocab", label: "ভোকাব" },
      { href: "/pricing", label: "প্রাইসিং" },
      { href: "/custom-subscription", label: "কাস্টম" },
    ];

  // Don't render navbar on editor and exam pages
  if (!mounted || pathname.includes("/editor") || pathname.includes("/start") || pathname.includes("/admin")) {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 border-b border-border/10 bg-background/80 backdrop-blur-xl font-hind-siliguri">
        <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 md:gap-3 group">
                  <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-black dark:bg-[#74b602] text-white font-black text-lg md:text-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:shadow-[0_0_20px_rgba(116,182,2,0.4)]">
                    I
                  </div>
                <span className="text-lg md:text-2xl font-black tracking-tighter">
                  ielts<span className="text-black dark:text-[#74b602]">practice</span>bd
                </span>
              </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-base font-semibold tracking-tight transition-all hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden lg:flex items-center gap-2 md:gap-4">
                      <ThemeToggle />
                    </div>
                <div className="hidden sm:flex items-center gap-2">
                  <UserNav />
                </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </nav>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 pt-16 bg-background lg:hidden overflow-y-auto font-hind-siliguri">
              <div className="flex flex-col p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">Theme & Auth</span>
                    <ThemeToggle />
                  </div>
                  <div className="pt-2">
                    <UserNav isMobileMenu={true} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-2 block mb-2">Navigation</span>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "text-xl font-bold py-4 px-4 rounded-2xl transition-all flex items-center justify-between group",
                        pathname === link.href 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground hover:bg-secondary/50"
                      )}
                    >
                      {link.label}
                      <X className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity rotate-45", pathname === link.href && "opacity-100")} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
    </>
  );
}
