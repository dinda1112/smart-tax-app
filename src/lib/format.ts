export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  const mins = Math.floor(diffSec / 60);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
