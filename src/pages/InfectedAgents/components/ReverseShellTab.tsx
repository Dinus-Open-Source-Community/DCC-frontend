import { useState, useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { fetchJson } from "../../../lib/api";

type ShellStatus = "idle" | "connecting" | "connected" | "error";

type ReverseShellTabProps = {
  agentId: string;
};

export default function ReverseShellTab({ agentId }: ReverseShellTabProps) {
  const [status, setStatus] = useState<ShellStatus>("idle");
  const [listenPort, setListenPort] = useState<number | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const initTerminal = () => {
    if (!xtermRef.current && terminalRef.current) {
      const term = new Terminal({
        theme: {
          background: "#0a0f0a",
          foreground: "#22c55e",
          cursor: "#22c55e",
        },
        fontFamily: "monospace",
        fontSize: 14,
      });
      term.open(terminalRef.current);
      xtermRef.current = term;

      term.onData((data: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(data);
        }
      });
    }
  };

  const handleActivate = async () => {
    setStatus("connecting");
    try {
      const res = await fetchJson<any>(`/api/clients/${agentId}/reverse_shell`, {
        method: "POST"
      });
      if (res.success) {
        setListenPort(res.port);
        // Start WebSocket
        connectWebSocket();
      } else {
        setStatus("error");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const connectWebSocket = () => {
    // Protocol relative websocket URI
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Construct the websocket URL based on Vite proxy (or direct backend if building)
    const wsUrl = `${protocol}//${window.location.host}/ws/shell/${agentId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      xtermRef.current?.writeln("[\x1b[32m+\x1b[0m] Remote shell connection established.");
    };

    ws.onmessage = (event) => {
      // Data is usually text, but could be a blob depending on the backend
      if (typeof event.data === "string") {
        xtermRef.current?.write(event.data);
      } else if (event.data instanceof Blob) {
        event.data.text().then(text => xtermRef.current?.write(text));
      }
    };

    ws.onclose = () => {
      setStatus("idle");
      xtermRef.current?.writeln("\r\n[\x1b[31m-\x1b[0m] Remote shell connection closed.");
    };

    ws.onerror = (e) => {
      console.error("WS error", e);
      setStatus("error");
    };
  };

  useEffect(() => {
    initTerminal();
    return () => {
      wsRef.current?.close();
      xtermRef.current?.dispose();
    };
  }, []);

  const connectionLabel =
    status === "idle"
      ? "Waiting to receive..."
      : status === "connecting"
        ? "Request sent, waiting for connection"
        : status === "error"
        ? "Connection failed"
        : "Connected";

  const connectionDotColor =
    status === "connected" ? "bg-green-500" : status === "connecting" ? "bg-yellow-500" : "bg-red-500";

  const sessionId = status === "connected" ? agentId : "N/A";

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-green-900/40 rounded-lg p-6 bg-black/40">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Reverse Shell Console</h2>
          {status !== "connected" && (
            <button
              onClick={handleActivate}
              disabled={status === "connecting"}
              className="border border-green-500/50 rounded px-4 py-2 text-green-500 text-sm font-semibold hover:bg-green-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {status === "connecting" ? "Activating..." : "Activate Reverse Shell"}
            </button>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Connection Status */}
          <div className="border border-green-900/30 rounded-lg p-4 bg-[#0a0f0a]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <span className="text-green-500">⚡</span> Connection Status
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${connectionDotColor}`} />
              <span className="text-white text-sm">{connectionLabel}</span>
            </div>
          </div>

          {/* Session ID */}
          <div className="border border-green-900/30 rounded-lg p-4 bg-[#0a0f0a]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <span className="text-red-500">■</span> Session ID
            </div>
            <p className="text-white text-sm truncate">{sessionId}</p>
          </div>

          {/* Listening Port */}
          <div className="border border-green-900/30 rounded-lg p-4 bg-[#0a0f0a]">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <span className="text-green-500">⚡</span> Listening Port
            </div>
            <p className="text-white text-sm">{listenPort || "N/A"}</p>
          </div>
        </div>

        {/* Terminal */}
        <div className="border border-green-900/30 rounded-lg overflow-hidden bg-[#0a0f0a]">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-green-900/20 bg-[#111811]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400 text-sm ml-2">Terminal</span>
            </div>
            <span
              className={`text-sm font-medium ${
                status === "connected"
                  ? "text-green-500"
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

          {/* Terminal Body */}
          <div className="p-4 bg-[#0a0f0a]">
             <div ref={terminalRef} className="w-full h-[400px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
