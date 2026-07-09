import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { deleteBodyMetric } from "@/lib/metrics/actions";
import { formatDate, formatWeight } from "@/lib/format";
import { Card, CardTitle, EmptyState } from "@/components/ui";
import { MetricsChart, type MetricPoint } from "./chart";
import { LogMetricForm } from "./log-form";

export const metadata = { title: "Body metrics" };

export default async function MetricsPage() {
  const user = await requireUserPage();
  const metrics = await db.bodyMetric.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 365,
  });

  const points: MetricPoint[] = [...metrics]
    .reverse()
    .map((m) => ({
      date: m.date.toLocaleDateString("sv-SE"),
      weight: m.weight,
      bodyFatPct: m.bodyFatPct,
    }));

  const latest = metrics[0];
  const first = metrics[metrics.length - 1];
  const weightDelta =
    latest?.weight != null && first?.weight != null && metrics.length > 1
      ? latest.weight - first.weight
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Body metrics</h1>
        <p className="mt-1 text-muted">
          Track body weight and body fat percentage over time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Trend</CardTitle>
            {weightDelta !== null && (
              <span
                className={`font-mono text-xs ${weightDelta <= 0 ? "text-success" : "text-accent-strong"}`}
              >
                {weightDelta > 0 ? "+" : ""}
                {weightDelta.toFixed(1)} {user.unit} overall
              </span>
            )}
          </div>
          {points.length >= 2 ? (
            <div className="mt-4">
              <MetricsChart data={points} unit={user.unit} />
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="Not enough data yet">
                Log at least two entries to see your trend.
              </EmptyState>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Log entry</CardTitle>
          <div className="mt-4">
            <LogMetricForm unit={user.unit} />
          </div>
        </Card>
      </div>

      {metrics.length > 0 && (
        <Card>
          <CardTitle>Entries</CardTitle>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Weight</th>
                <th className="pb-2 font-medium">Body fat</th>
                <th className="pb-2 font-medium">Notes</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {metrics.slice(0, 50).map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-2">{formatDate(m.date)}</td>
                  <td className="py-2 font-mono text-xs">
                    {m.weight != null ? formatWeight(m.weight, user.unit) : "—"}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {m.bodyFatPct != null ? `${m.bodyFatPct}%` : "—"}
                  </td>
                  <td className="max-w-48 truncate py-2 text-xs text-muted">
                    {m.notes || ""}
                  </td>
                  <td className="py-2 text-right">
                    <form action={deleteBodyMetric} className="inline">
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        aria-label="Delete entry"
                        className="text-muted transition-colors hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
