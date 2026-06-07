import { useEffect, useState } from "react";
import { clientService } from "@/services/clientService";

const commonCommands = ["whoami", "pwd", "ls -la", "ps aux", "netstat -ant", "uname -a"];

type CommandExecutionTabProps = {
  clientId?: string;
};

export default function CommandExecutionTab({ clientId }: CommandExecutionTabProps) {
  const [commandInput, setCommandInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    if (!clientId) return;
    try {
      const res = await clientService.getCommandResults(clientId);
      // Urutkan berdasarkan waktu eksekusi terbaru
      const sorted = (res || []).sort(
        (a: any, b: any) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
      );
      setResults(sorted);
    } catch (err: any) {
      console.error("Failed to fetch command results:", err);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 3000);
    return () => clearInterval(interval);
  }, [clientId]);

  const handleExecute = async (cmdToRunText?: string) => {
    const text = cmdToRunText || commandInput;
    if (!clientId || !text.trim()) return;

    setIsExecuting(true);
    setError(null);
    try {
      await clientService.queueCommand(clientId, text);
      if (!cmdToRunText) {
        setCommandInput("");
      }
      // Pemicu fetch langsung
      setTimeout(fetchResults, 500);
    } catch (err: any) {
      setError(err.message || "Failed to queue command.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 font-mono">
      {/* Common Commands */}
      <div className="border border-green/40 rounded-lg p-4 sm:p-6 bg-black/40">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Common Commands</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
          {commonCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleExecute(cmd)}
              disabled={isExecuting || !clientId}
              className="border border-green/50 rounded px-4 py-2 text-white text-xs sm:text-sm hover:bg-green/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Execute Command */}
      <div className="border border-green/40 rounded-lg p-4 sm:p-6 bg-black/40">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Execute Command</h2>
        {error && (
          <div className="mb-4 text-red-500 text-xs">
            [ERROR] Queue failed: {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center border border-green/50 rounded px-3 sm:px-4 py-2 sm:py-3 bg-transparent">
            <span className="text-green mr-2 font-bold">$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExecute()}
              disabled={isExecuting || !clientId}
              placeholder="Enter command to execute..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm sm:text-base w-full disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => handleExecute()}
            disabled={isExecuting || !clientId || !commandInput.trim()}
            className="border border-green/50 rounded px-6 py-2 sm:py-3 text-green font-semibold hover:bg-green/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base"
          >
            {isExecuting ? "Queueing..." : "Execute"}
          </button>
        </div>
      </div>

      {/* Execution Results */}
      <div className="border border-green/40 rounded-lg p-4 sm:p-6 bg-black/40">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Execution Results</h2>
          <button
            onClick={fetchResults}
            disabled={!clientId}
            className="border border-green/50 rounded px-3 py-1.5 text-green text-xs sm:text-sm font-semibold hover:bg-green/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {results.length === 0 ? (
            <div className="text-gray-500 text-sm italic text-center py-6 border border-dashed border-green/20 rounded-lg">
              No command logs recorded yet.
            </div>
          ) : (
            results.map((res, index) => {
              const formattedTime = new Date(res.executed_at).toLocaleString();
              const hasExitError = res.exit_code !== 0;

              return (
                <div className="border border-green/30 rounded p-4 bg-[#0a0f0a]" key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="bg-green/15 text-green text-xs sm:text-sm font-bold px-3 py-1 rounded">
                      {res.command}
                    </span>
                    <span className="flex items-center gap-2 text-green text-xs sm:text-sm">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 flex items-center gap-1 border",
                          hasExitError
                            ? "bg-red-950/20 border-red-500/30 text-red-500"
                            : "bg-green/10 border-green/30 text-green",
                        ].join(" ")}
                      >
                        {hasExitError ? "✗" : "✓"}{" "}
                        <span className={hasExitError ? "text-red-500" : "text-green"}>
                          {res.exit_code}
                        </span>
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-500 text-[10px] mb-3 mt-1 ml-1">{formattedTime}</p>
                  
                  {res.stdout && (
                    <div className="mb-2">
                      <div className="text-green text-xs mb-1 font-semibold">[+] STDOUT</div>
                      <pre className="border border-green/20 rounded p-3 bg-[#060d06] text-white text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {res.stdout}
                      </pre>
                    </div>
                  )}

                  {res.stderr && (
                    <div>
                      <div className="text-red-500 text-xs mb-1 font-semibold">[-] STDERR</div>
                      <pre className="border border-red-500/20 rounded p-3 bg-[#0c0606] text-red-400 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {res.stderr}
                      </pre>
                    </div>
                  )}

                  {!res.stdout && !res.stderr && (
                    <div className="text-gray-500 text-xs italic ml-1">
                      [Command executed with no output]
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

