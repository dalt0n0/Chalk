import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink, Logo } from "@/components/ui";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="Chalk home">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-muted sm:flex">
              <Link href="/community" className="hover:text-text transition-colors">
                Community programs
              </Link>
              <Link href="/docs/program-format" className="hover:text-text transition-colors">
                Docs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <ButtonLink href="/app" size="sm">
                Open app
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" size="sm">
                  Get started
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Logo className="opacity-80 [&>span:last-child]:text-sm" />
            <span className="text-xs">Community Edition</span>
          </div>
          <div className="flex gap-6">
            <Link href="/community" className="hover:text-text">Community</Link>
            <Link href="/docs/program-format" className="hover:text-text">Program format</Link>
            <Link href="/docs/self-hosting" className="hover:text-text">Self-hosting</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
