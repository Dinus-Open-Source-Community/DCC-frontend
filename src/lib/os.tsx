import type { ReactNode } from "react";

export type OsBadge = {
  label: string;
  className: string;
  icon: ReactNode;
};

export function getOsBadge(osName: string): OsBadge {
  const os = (osName || "").toLowerCase();
  if (os.includes("win")) {
    return {
      label: "Windows",
      className: "border-cyan-400/60 text-cyan-400 bg-cyan-400/10",
      icon: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
          <path d="M3 5.5L10.5 4v8H3V5.5zM3 12.5h7.5v8L3 19.5v-7zM11.5 4L21 2.5v9.5h-9.5V4zM11.5 12.5H21V21.5l-9.5-1.5v-7.5z" />
        </svg>
      ),
    };
  }
  if (os.includes("mac") || os.includes("darwin")) {
    return {
      label: "macOS",
      className: "border-purple-400/60 text-purple-300 bg-purple-400/10",
      icon: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
          <path d="M16.5 12.3c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.2 1.7 2.4 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-4zM14.4 5.4c.7-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.9-1 2.9 1 .1 2-.5 2.7-1.3z" />
        </svg>
      ),
    };
  }
  return {
    label: "Linux",
    className: "border-yellow-400/60 text-yellow-400 bg-yellow-400/10",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
        <path d="M12 2c-2.2 0-3.5 1.7-3.5 3.8 0 1.2.5 2 1 2.7-.7.6-1.5 1.4-2.3 2.4-1.2 1.4-2.2 3.1-2.2 4.7 0 1.5.8 2.5 1.7 3.2-.2.6-.3 1.2-.3 1.7 0 .8.7 1.5 1.5 1.5h8.2c.8 0 1.5-.7 1.5-1.5 0-.5-.1-1.1-.3-1.7.9-.7 1.7-1.7 1.7-3.2 0-1.6-1-3.3-2.2-4.7-.8-1-1.6-1.8-2.3-2.4.5-.7 1-1.5 1-2.7C15.5 3.7 14.2 2 12 2zm-1 4.5c.3 0 .5.2.5.5s-.2.5-.5.5-.5-.2-.5-.5.2-.5.5-.5zm2 0c.3 0 .5.2.5.5s-.2.5-.5.5-.5-.2-.5-.5.2-.5.5-.5zM9.5 11h5l.5 1h-6l.5-1zm.5 2h4l.4 1H9.6l.4-1z" />
      </svg>
    ),
  };
}

export function isClientOnline(lastSeen: string | number | Date, timeoutMs = 60000): boolean {
  const timestamp = new Date(lastSeen).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp < timeoutMs;
}
