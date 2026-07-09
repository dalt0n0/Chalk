"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Disc3,
  Dumbbell,
  Globe,
  History,
  LayoutDashboard,
  LibraryBig,
  Scale,
  Settings,
  ShieldCheck,
  Trophy,
} from "lucide-react";

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

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...ITEMS, { href: "/app/admin", label: "Admin", icon: ShieldCheck }]
    : ITEMS;
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-accent-soft font-medium text-accent-strong"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
