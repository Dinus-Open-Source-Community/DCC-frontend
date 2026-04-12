import { useState, useEffect } from "react";
import { fetchJson } from "../../lib/api";

type LogEntry = {
  id: number;
  event_type: string;
  client_id: string | null;
  username: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string | null;
};

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<LogEntry[]>('/api/logs');
      setLogs(data);
      setFilteredLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = logs;
    if (typeFilter) {
      result = result.filter(log => log.event_type === typeFilter);
    }
    if (searchFilter) {
      const query = searchFilter.toLowerCase();
      result = result.filter(log => 
        log.details?.toLowerCase().includes(query) ||
        log.client_id?.toLowerCase().includes(query) ||
        log.username?.toLowerCase().includes(query) ||
        log.ip_address?.toLowerCase().includes(query)
      );
    }
    setFilteredLogs(result);
  }, [searchFilter, typeFilter, logs]);

  const uniqueEventTypes = Array.from(new Set(logs.map(log => log.event_type)));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex flex-col px-8 py-6 h-full max-h-screen">
      <div className="w-full border-b border-green flex justify-between items-end pb-7">
        <h1 className="text-2xl font-semibold text-green">System Logs</h1>
        <button 
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-6 py-2 border border-green text-green hover:bg-green hover:text-black transition-colors rounded uppercase tracking-wider text-sm font-semibold disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Search details, client, user, ip..." 
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="flex-1 bg-transparent border border-green/40 px-4 py-2 rounded text-white outline-none focus:border-green"
        />
        <select 
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-black border border-green/40 px-4 py-2 rounded text-white outline-none focus:border-green w-64"
        >
          <option value="">All Event Types</option>
          {uniqueEventTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex-1 overflow-hidden border border-green/40 rounded-lg bg-[#0a0f0a]">
        <div className="h-full overflow-y-auto max-h-[100%] overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
            <thead className="bg-[#0d120d] border-b border-green/20 sticky top-0 text-gray-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3 w-48">Event Type</th>
                <th className="px-4 py-3 w-72">Target (Client/User)</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 w-48">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green/10">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-green/5 text-gray-300">
                  <td className="px-4 py-3 text-gray-500 font-mono">{log.id}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green/10 text-green px-2 py-1 rounded-sm text-xs font-semibold">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-400">
                    {log.client_id && <div>ID: {log.client_id}</div>}
                    {log.username && <div>User: {log.username}</div>}
                    {log.ip_address && <div>IP: {log.ip_address}</div>}
                    {(!log.client_id && !log.username && !log.ip_address) && <span className="text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-normal break-words max-w-lg text-xs leading-relaxed">
                    {log.details || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono text-right">
                    {formatDate(log.created_at)}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}