import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number;
  icon?: React.ReactNode;
  accent?: "default" | "warn" | "danger" | "info";
  className?: string;
};

const accentStyles: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "border-green bg-green/8 text-green",
  warn: "border-yellow-400 bg-yellow-400/8 text-yellow-400",
  danger: "border-red-500 bg-red-500/8 text-red-400",
  info: "border-cyan-400 bg-cyan-400/8 text-cyan-400",
};

export default function StatCard({
  title,
  value,
  icon,
  accent = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 sm:px-5 sm:py-4 space-y-1 transition-colors",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider font-medium">
        <span>{title}</span>
        {icon && <span className="opacity-80">{icon}</span>}
      </div>
      <div className="font-semibold text-2xl sm:text-3xl">{value}</div>
    </div>
  );
}
