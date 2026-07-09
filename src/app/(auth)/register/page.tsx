import Link from "next/link";
import { db } from "@/lib/db";
import { isRegistrationOpen } from "@/lib/admin/settings";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const userCount = await db.user.count();
  const open = userCount === 0 || (await isRegistrationOpen());

  if (!open) {
    return (
      <>
        <h1 className="text-xl font-semibold">Registration is closed</h1>
        <p className="mt-2 text-sm text-muted">
          The administrator of this instance creates accounts. Ask them for
          access, then sign in with the credentials they give you.
        </p>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </>
    );
  }

  return <RegisterForm firstUser={userCount === 0} />;
}
