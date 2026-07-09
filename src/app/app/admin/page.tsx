import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isRegistrationOpen } from "@/lib/admin/settings";
import {
  adminDeleteUser,
  adminSetRegistration,
  adminSetRole,
} from "@/lib/admin/actions";
import { formatDate } from "@/lib/format";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { CreateUserForm, ResetPasswordButton } from "./admin-forms";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") redirect("/app");

  const [users, registrationOpen] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { workouts: true, programs: true } },
      },
    }),
    isRegistrationOpen(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-muted">
          Manage this instance&apos;s accounts and registration.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Registration</CardTitle>
            <p className="mt-1 text-sm text-muted">
              {registrationOpen
                ? "Anyone who can reach this instance can create an account."
                : "Closed. Only admins create accounts."}
            </p>
          </div>
          <form action={adminSetRegistration}>
            <input
              type="hidden"
              name="registration"
              value={registrationOpen ? "closed" : "open"}
            />
            <Button type="submit" variant="secondary" size="sm">
              {registrationOpen ? "Close registration" : "Open registration"}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardTitle>Create account</CardTitle>
        <div className="mt-4">
          <CreateUserForm />
        </div>
      </Card>

      <Card className="p-0">
        <div className="px-5 pt-5">
          <CardTitle>
            Users ({users.length})
          </CardTitle>
        </div>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-2 font-medium">User</th>
              <th className="px-5 py-2 font-medium">Role</th>
              <th className="px-5 py-2 font-medium">Activity</th>
              <th className="px-5 py-2 font-medium">Joined</th>
              <th className="px-5 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === me.id;
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <p className="font-medium">
                      {u.name}
                      {isMe && <span className="ml-2 text-xs text-muted">(you)</span>}
                    </p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    {u.role === "admin" ? (
                      <Badge variant="accent" className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge>User</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">
                    {u._count.workouts} workouts · {u._count.programs} programs
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {!isMe && (
                      <div className="flex items-center justify-end gap-2">
                        <ResetPasswordButton userId={u.id} email={u.email} />
                        <form action={adminSetRole} className="inline">
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="role"
                            value={u.role === "admin" ? "user" : "admin"}
                          />
                          <button
                            type="submit"
                            className="rounded px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-surface-3 hover:text-text"
                          >
                            {u.role === "admin" ? "Demote" : "Make admin"}
                          </button>
                        </form>
                        <ConfirmDialog
                          trigger="Delete"
                          triggerVariant="ghost"
                          triggerSize="sm"
                          triggerClassName="text-xs text-muted hover:text-danger px-1.5 py-0.5"
                          title={`Delete ${u.email}?`}
                          body="Their programs, workout history, and metrics are permanently deleted. There is no undo."
                          confirmLabel="Delete user"
                          cancelLabel="Keep them"
                          action={adminDeleteUser}
                          fields={{ userId: u.id }}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
