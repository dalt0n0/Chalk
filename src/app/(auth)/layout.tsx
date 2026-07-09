import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(249,115,22,0.14),transparent)]"
      />
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl shadow-black/40">
        {children}
      </div>
    </div>
  );
}
