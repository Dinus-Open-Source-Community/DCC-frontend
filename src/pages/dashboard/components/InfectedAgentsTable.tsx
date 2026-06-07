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
      <span className={cn("text-sm font-normal", online ? "text-green" : "text-red-400/80")}>
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
    <div className="col-span-1 lg:col-span-2 rounded-md border border-green/30 bg-[#0A0F0A] px-4 py-3 sm:px-5 sm:py-4 text-green flex flex-col">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider font-medium mb-3 shrink-0">
        <span>Infected Agents</span>
        <span className="text-xs text-green/60 font-mono normal-case tracking-normal">click row to inspect</span>
      </div>
      <div className="rounded-md pb-3 overflow-y-auto overflow-x-auto custom-scrollbar h-[600px]">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-green/30">
              <th className="pt-3 pb-2 pr-4 text-start bg-[#0A0F0A]">Agent ID</th>
              <th className="pt-3 pb-2 pr-4 text-start bg-[#0A0F0A]">IP Address</th>
              <th className="pt-3 pb-2 pr-4 text-start bg-[#0A0F0A]">OS</th>
              <th className="pt-3 pb-2 pr-4 text-start bg-[#0A0F0A]">Last Seen</th>
              <th className="pt-3 pb-2 pr-4 text-start bg-[#0A0F0A]">Status</th>
              <th className="pt-3 pb-2 text-center bg-[#0A0F0A]">Actions</th>
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
                  className="border-b border-green/15 cursor-pointer transition-colors hover:bg-green/10 focus:bg-green/10 focus:outline-none"
                >
                  <td className="py-2 pr-4 text-sm font-normal">
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
                  <td className="py-2 pr-4 text-sm font-normal">{row.IP}</td>
                  <td className="py-2 pr-4 text-sm font-normal">
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
                    className="py-2 pr-4 text-sm font-normal text-green/80"
                    title={row.lastSeen}
                  >
                    {formatRelativeTime(row.lastSeen)}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusDot status={row.Status} />
                  </td>
                  <td className="py-2 text-center font-normal">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/infected-agents/${row.id}`);
                      }}
                      className="rounded-md border border-green bg-[#282D35] px-3 py-1 text-xs transition-colors duration-300 hover:bg-green hover:text-[#282D35] cursor-pointer"
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
