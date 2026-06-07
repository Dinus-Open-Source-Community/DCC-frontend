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

export function toTimestamp(input: string | number | Date | null | undefined | object): number {
  if (input === null || input === undefined || input === "") return NaN;

  if (typeof input === "object" && !(input instanceof Date)) {
    const obj = input as Record<string, unknown>;

    if (typeof obj.$date === "string" || typeof obj.$date === "number") {
      return toTimestamp(obj.$date as string | number);
    }
    if (typeof obj.iso === "string") {
      return toTimestamp(obj.iso);
    }

    const secondsRaw = obj.seconds ?? obj.secs_since_epoch ?? obj._seconds;
    const nanosRaw =
      obj.nanos ?? obj.nanoseconds ?? obj.nanos_since_epoch ?? obj._nanoseconds ?? obj.nanoseconds_since_epoch;
    if (secondsRaw !== undefined && secondsRaw !== null) {
      const seconds = Number(secondsRaw);
      const nanos = nanosRaw !== undefined && nanosRaw !== null ? Number(nanosRaw) : 0;
      if (!Number.isNaN(seconds)) {
        return seconds * 1000 + Math.floor(nanos / 1e6);
      }
    } else if (nanosRaw !== undefined && nanosRaw !== null) {
      const nanos = Number(nanosRaw);
      if (!Number.isNaN(nanos)) {
        return Math.floor(nanos / 1e6);
      }
    }

    if (typeof obj.value === "string" || typeof obj.value === "number") {
      return toTimestamp(obj.value as string | number);
    }

    return NaN;
  }

  const date = input instanceof Date ? input : new Date(input as string | number);
  return date.getTime();
}

export function formatDate(input: string | number | Date | null | undefined | object): string {
  if (input === null || input === undefined || input === "") return "-";
  const timestamp = toTimestamp(input);
  if (Number.isNaN(timestamp)) {
    const raw = typeof input === "object" ? JSON.stringify(input) : String(input);
    return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
  }
  return new Date(timestamp).toLocaleString();
}
