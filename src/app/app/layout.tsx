import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";
import { Badge, Logo } from "@/components/ui";
import { AppNav } from "./nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-border bg-surface/60 p-3 lg:w-60">
        <Link href="/app" className="mb-6 flex items-center px-1 pt-1">
          <span className="hidden lg:block">
            <Logo />
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-black text-black lg:hidden">
            C
          </span>
        </Link>
        <AppNav isAdmin={user.role === "admin"} />
        <div className="mt-auto border-t border-border pt-3">
          <div className="hidden items-center justify-between px-1 lg:flex">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <Badge variant="accent" className="ml-2 shrink-0">
              CE
            </Badge>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
