import { getCurrentUser, listSessions, currentSessionId } from "@/lib/auth/session";
import { revokeOtherSessions } from "@/lib/settings/actions";
import { getEdition } from "@/lib/edition";
import { formatDateTime } from "@/lib/format";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  const [sessions, currentId] = await Promise.all([
    listSessions(user.id),
    currentSessionId(),
  ]);
  const edition = getEdition();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted">
          {user.email} ·{" "}
          {edition === "community" ? "Community Edition" : `${user.plan} plan`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Profile</CardTitle>
          <div className="mt-4">
            <ProfileForm name={user.name} unit={user.unit} />
          </div>
        </Card>

        <Card>
          <CardTitle>Password</CardTitle>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Active sessions</CardTitle>
          <form action={revokeOtherSessions}>
            <Button type="submit" variant="secondary" size="sm">
              Sign out other sessions
            </Button>
          </form>
        </div>
        <ul className="mt-4 space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-xs text-muted">
                  {s.userAgent ?? "Unknown device"}
                </p>
                <p className="text-xs text-muted">
                  Signed in {formatDateTime(s.createdAt)}
                </p>
              </div>
              {s.id === currentId && <Badge variant="success">This device</Badge>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border-danger/30">
        <CardTitle className="text-danger">Danger zone</CardTitle>
        <div className="mt-4 max-w-sm">
          <DeleteAccountForm />
        </div>
      </Card>
    </div>
  );
}
