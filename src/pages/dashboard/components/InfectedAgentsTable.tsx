import { useNavigate } from "react-router";

type AgentRow = {
  id: number;
  AgentID: string;
  IP: string;
  OS: string;
  User: string;
  Status: string;
};

type InfectedAgentsTableProps = {
  rows: AgentRow[];
  onDelete?: (agentId: string) => void;
};

export default function InfectedAgentsTable({ rows, onDelete }: InfectedAgentsTableProps) {
  const navigate = useNavigate();
  return (
    <div className="md:col-span-1 xl:col-span-2 rounded-lg border border-green bg-green/8 p-4 sm:p-7 text-green">
      <div className="text-xl font-normal">Infected Agents</div>
      <div className="w-full overflow-auto max-h-[300px]">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b">
              <th className="pb-5 text-start">Agent ID</th>
              <th className="pb-5 text-start">IP Address</th>
              <th className="pb-5 text-start">OS</th>
              <th className="pb-5 text-start">User</th>
              <th className="pb-5 text-start">Status</th>
              <th className="pb-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b last:border-b-0" key={row.id}>
                <td className="py-5 text-xs font-normal">{row.AgentID}</td>
                <td className="text-base font-normal">{row.IP}</td>
                <td className="text-base font-normal">{row.OS}</td>
                <td className="text-base font-normal">{row.User}</td>
                <td className="text-base font-normal">{row.Status}</td>
                <td className="text-center font-normal space-x-2">
                  <button
                    onClick={() => navigate('/infected-agents/' + row.AgentID)}
                    className="rounded-lg border border-green bg-[#282D35] px-4 py-1 text-sm transition-colors duration-300 hover:bg-green hover:text-[#282D35] cursor-pointer"
                  >
                    Interact
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(row.AgentID)}
                    className="rounded-lg border border-red-500 bg-[#282D35] px-4 py-1 text-sm text-red-500 transition-colors duration-300 hover:bg-red-500 hover:text-white cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
