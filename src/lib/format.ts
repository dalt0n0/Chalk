export function formatWeight(weight: number, unit: string): string {
  const n = Number.isInteger(weight)
    ? weight.toString()
    : weight.toFixed(1).replace(/\.0$/, "");
  return `${n} ${unit}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function formatDateTime(d: Date): string {
  return `${formatDate(d)}, ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function repTarget(minReps: number, maxReps: number, amrap: boolean) {
  if (amrap) return `${minReps}+`;
  if (minReps !== maxReps) return `${minReps}-${maxReps}`;
  return `${minReps}`;
}
