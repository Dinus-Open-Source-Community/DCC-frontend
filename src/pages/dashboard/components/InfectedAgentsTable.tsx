import { useNavigate } from "react-router";
import { formatRelativeTime } from "@/lib/format";
import { getOsBadge } from "@/lib/os";
import { cn } from "@/lib/utils";

type AgentRow = {
  id: string;
  AgentID: string;
  IP: string;
  OS: string;
  osName: string;
  isAdmin: boolean;
  lastSeen: string;
  Status: string;
};

type InfectedAgentsTableProps = {
  rows: AgentRow[];
};

function StatusDot({ status }: { status: string }) {
  const online = status === "Online";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full",
          online ? "bg-green animate-pulse shadow-[0_0_8px_rgba(0,255,65,0.7)]" : "bg-red-500/70"
        )}
        aria-hidden
      />
      <span className={cn("text-sm sm:text-base font-normal", online ? "text-green" : "text-red-400/80")}>
        {status}
      </span>
    </span>
  );
}

export default function InfectedAgentsTable({ rows }: InfectedAgentsTableProps) {
  const navigate = useNavigate();

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/infected-agents/${id}`);
    }
  };

  return (
    <div className="col-span-1 lg:col-span-2 rounded-lg border border-green bg-green/8 px-4 sm:px-7 py-4 sm:py-6 text-green">
      <div className="flex items-center justify-between text-lg sm:text-xl font-normal">
        <span>Infected Agents</span>
        <span className="text-xs text-green/60 font-mono">click row to inspect</span>
      </div>
      <div className="rounded-lg py-4 sm:py-6 overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-green/30">
              <th className="pb-3 sm:pb-5 pr-6 text-start">Agent ID</th>
              <th className="pb-3 sm:pb-5 pr-6 text-start">IP Address</th>
              <th className="pb-3 sm:pb-5 pr-6 text-start">OS</th>
              <th className="pb-3 sm:pb-5 pr-6 text-start">Last Seen</th>
              <th className="pb-3 sm:pb-5 pr-6 text-start">Status</th>
              <th className="pb-3 sm:pb-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const badge = getOsBadge(row.osName);
              return (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/infected-agents/${row.id}`)}
                  onKeyDown={(e) => handleRowKeyDown(e, row.id)}
                  className="border-b border-green/15 last:border-b-0 cursor-pointer transition-colors hover:bg-green/10 focus:bg-green/10 focus:outline-none"
                >
                  <td className="py-3 sm:py-5 pr-6 text-xs font-normal">
                    <div className="flex items-center gap-2">
                      <span>{row.AgentID}</span>
                      {row.isAdmin && (
                        <span
                          title="Admin privileges"
                          className="inline-flex items-center rounded border border-yellow-400/60 bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-yellow-400"
                        >
                          ADMIN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 sm:py-5 pr-6 text-sm sm:text-base font-normal">{row.IP}</td>
                  <td className="py-3 sm:py-5 pr-6 text-sm sm:text-base font-normal">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-mono",
                        badge.className
                      )}
                    >
                      {badge.icon}
                      {row.OS || badge.label}
                    </span>
                  </td>
                  <td
                    className="py-3 sm:py-5 pr-6 text-sm sm:text-base font-normal text-green/80"
                    title={row.lastSeen}
                  >
                    {formatRelativeTime(row.lastSeen)}
                  </td>
                  <td className="py-3 sm:py-5 pr-6">
                    <StatusDot status={row.Status} />
                  </td>
                  <td className="py-3 sm:py-5 text-center font-normal">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/infected-agents/${row.id}`);
                      }}
                      className="rounded-lg border border-green bg-[#282D35] px-4 py-1 text-sm transition-colors duration-300 hover:bg-green hover:text-[#282D35] cursor-pointer"
                    >
                      Interact
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
