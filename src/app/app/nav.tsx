"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Disc3,
  Dumbbell,
  Globe,
  History,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  Scale,
  Settings,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { logout } from "@/lib/auth/actions";

const ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/train", label: "Train", icon: Dumbbell },
  { href: "/app/programs", label: "Programs", icon: LibraryBig },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/records", label: "1RMs", icon: Trophy },
  { href: "/app/metrics", label: "Body metrics", icon: Scale },
  { href: "/app/plates", label: "Plates", icon: Disc3 },
  { href: "/community", label: "Community", icon: Globe },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const ADMIN_ITEM = { href: "/app/admin", label: "Admin", icon: ShieldCheck };

function isActive(pathname: string, item: { href: string; exact?: boolean }) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** Desktop sidebar navigation. */
export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS;
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive(pathname, item)
              ? "bg-accent-soft font-medium text-accent-strong"
              : "text-muted hover:bg-surface-2 hover:text-text"
          }`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="hidden lg:inline">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** Phone bottom tab bar: four main tabs plus a More sheet with the rest. */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = ITEMS.slice(0, 4);
  const moreItems = [...ITEMS.slice(4), ...(isAdmin ? [ADMIN_ITEM] : [])];
  const moreActive = moreItems.some((i) => isActive(pathname, i));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" role="dialog" aria-label="More navigation">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-14 rounded-t-xl border-t border-border bg-surface p-3 pb-4">
            <div className="grid grid-cols-2 gap-1.5">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    isActive(pathname, item)
                      ? "bg-accent-soft font-medium text-accent-strong"
                      : "text-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
              <form action={logout} className="contents">
                <button
                  type="submit"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-14 grid-cols-5 border-t border-border bg-surface/95 backdrop-blur sm:hidden">
        {tabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
              isActive(pathname, item) && !moreOpen
                ? "text-accent-strong"
                : "text-muted"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            moreOpen || moreActive ? "text-accent-strong" : "text-muted"
          }`}
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>
    </>
  );
}
