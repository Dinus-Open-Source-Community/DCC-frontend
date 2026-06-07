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
        "rounded-lg border px-4 py-4 sm:px-7 sm:py-6 space-y-2 sm:space-y-3 transition-colors",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 font-normal text-lg sm:text-xl">
        <span>{title}</span>
        {icon && <span className="opacity-80">{icon}</span>}
      </div>
      <div className="font-semibold text-3xl sm:text-4xl">{value}</div>
    </div>
  );
}
