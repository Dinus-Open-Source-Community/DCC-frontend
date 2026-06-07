export function formatRelativeTime(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return "unknown";

  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSeconds < 0) return "just now";
  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}
