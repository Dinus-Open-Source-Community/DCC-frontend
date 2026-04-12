import { useState, useEffect } from "react";
import { fetchJson } from "../../../lib/api";

const commonCommands = ["whoami", "pwd", "ls -la", "ps aux", "netstat -antp", "uname -a"];

type CommandResult = {
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  executed_at: string;
};

type CommandExecutionTabProps = {
  agentId: string;
};

export default function CommandExecutionTab({ agentId }: CommandExecutionTabProps) {
  const [commandInput, setCommandInput] = useState("");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchResults = async () => {
    try {
      const data = await fetchJson<CommandResult[]>(`/api/clients/${agentId}/results`);
      // Sort newest first
      data.sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime());
      setResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [agentId]);

  const handleExecute = async (cmdStr: string) => {
    if (!cmdStr.trim()) return;
    setIsExecuting(true);
    setCommandInput("");
    try {
      await fetchJson(`/api/clients/${agentId}/commands`, {
        method: "POST",
        body: JSON.stringify({ client_id: agentId, command: cmdStr, args: [] }),
      });
      // Poll briefly after execution
      setTimeout(fetchResults, 1000);
      setTimeout(fetchResults, 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Common Commands */}
      <div className="border border-green/40 rounded-lg p-6 bg-black/40">
        <h2 className="text-xl font-semibold text-white mb-4">Common Commands</h2>
        <div className="grid grid-cols-6 gap-3">
          {commonCommands.map((cmd) => (
            <button
              key={cmd}
              disabled={isExecuting}
              onClick={() => handleExecute(cmd)}
              className="border border-green/50 rounded px-4 py-2 text-white text-sm hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Execute Command */}
      <div className="border border-green/40 rounded-lg p-6 bg-black/40">
        <h2 className="text-xl font-semibold text-white mb-4">Execute Command</h2>
        <form 
          className="flex gap-3" 
          onSubmit={(e) => { e.preventDefault(); handleExecute(commandInput); }}
        >
          <div className="flex-1 flex items-center border border-green/50 rounded px-4 py-3 bg-transparent focus-within:border-green transition-colors">
            <span className="text-green mr-2 font-bold">$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter command to execute..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none font-mono"
            />
          </div>
          <button 
            type="submit"
            disabled={isExecuting || !commandInput.trim()}
            className="border border-green/50 rounded px-6 py-3 text-green font-semibold hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            Execute
          </button>
        </form>
      </div>

      {/* Execution Results */}
      <div className="border border-green/40 rounded-lg p-6 bg-black/40">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Execution Results</h2>
          <button 
            onClick={fetchResults}
            className="border border-green/50 rounded px-4 py-1.5 text-green text-sm font-semibold hover:bg-green/10 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
        
        <div className="flex flex-col gap-4">
          {results.length === 0 && (
            <p className="text-green/50 text-sm font-mono mt-2">No commands executed yet.</p>
          )}
          {results.map((res, idx) => (
            <div key={idx} className="border border-green/30 rounded p-4 bg-[#0a0f0a]">
              <div className="flex justify-between items-center mb-1">
                <span className="bg-green/15 text-green text-sm font-semibold px-3 py-1 rounded font-mono">
                  {res.command}
                </span>
                <span className="flex items-center gap-2 text-green text-sm">
                  <span className={`bg-green/20 rounded-full px-2 py-0.5 flex items-center gap-1 ${res.exit_code !== 0 ? 'text-red-400' : 'text-green'}`}>
                    {res.exit_code === 0 ? '✓' : '✗'} <span>{res.exit_code}</span>
                  </span>
                </span>
              </div>
              <p className="text-gray-500 text-xs mb-3 mt-1 ml-1">{new Date(res.executed_at).toLocaleString()}</p>
              
              {res.stdout && (
                <>
                  <div className="text-blue-400 text-sm mb-1 font-medium">[+] STDOUT</div>
                  <div className="border border-green/20 rounded p-3 bg-[#060d06] mt-1 overflow-x-auto whitespace-pre-wrap">
                    <p className="text-green-300 text-sm font-mono leading-relaxed">{res.stdout}</p>
                  </div>
                </>
              )}
              {res.stderr && (
                <>
                  <div className="text-red-400 text-sm mt-3 mb-1 font-medium">[-] STDERR</div>
                  <div className="border border-red-900/40 rounded p-3 bg-red-950/10 mt-1 overflow-x-auto whitespace-pre-wrap">
                    <p className="text-red-300 text-sm font-mono leading-relaxed">{res.stderr}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
