import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import CommandExecutionTab from "./components/CommandExecutionTab";
import ReverseShellTab from "./components/ReverseShellTab";
import FileManagerTab from "./components/FileManagerTab";
import AgentInformation from "./components/AgentInformation";
import { clientService } from "@/services/clientService";
import type { ClientInfo } from "@/services/clientService";

type Tab = "command" | "reverse-shell" | "file-manager";

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "command", label: "Command Execution", icon: ">_" },
  { key: "reverse-shell", label: "Reverse Shell", icon: ">_" },
  { key: "file-manager", label: "File Manager", icon: "📁" },
];

export default function InfectedAgents() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("command");
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async (isInitial = false) => {
    try {
      const displayData = await clientService.getClientsDisplay();
      const list = displayData.clients || [];
      setClients(list);
      setError(null);

      if (list.length > 0) {
        if (id) {
          const found = list.find((c) => c.id === id);
          if (found) {
            setSelectedClient(found);
          } else if (isInitial) {
            // Fallback if ID is invalid (e.g. agent deleted)
            const fallback = list[0];
            setSelectedClient(fallback);
            navigate(`/infected-agents/${fallback.id}`, { replace: true });
          }
        } else {
          // Auto-select first client if no ID is in URL
          const first = list[0];
          setSelectedClient(first);
          navigate(`/infected-agents/${first.id}`, { replace: true });
        }
      } else {
        setSelectedClient(null);
        if (id) {
          navigate("/infected-agents", { replace: true });
        }
      }
    } catch (err: any) {
      console.error("Error fetching agents:", err);
      setError(err.message || "Failed to retrieve telemetry from server.");
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAgents(true);
    const interval = setInterval(() => fetchAgents(false), 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (isLoading && clients.length === 0) {
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

  if (clients.length === 0) {
    return (
      <div className="w-full flex flex-col px-4 sm:px-6 lg:px-10 py-5 sm:py-7 lg:py-9">
        <div className="w-full border-b border-green">
          <h1 className="text-xl sm:text-2xl font-semibold text-green pb-3 sm:pb-4 flex items-center">
            Infected Agents{" "}
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2 animate-pulse" />
          </h1>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center border border-green/30 bg-[#0A0F0A] rounded-md p-6 text-center font-mono">
          <div className="text-red-500 text-2xl mb-3">⚠️</div>
          <div className="text-green text-base font-bold uppercase tracking-wider mb-2">
            NO INFECTED AGENTS DETECTED
          </div>
          <p className="text-gray-400 text-sm max-w-md">
            There are currently no active implants connected to the C2 server.
            Please generate an implant using the Payload Generator and run it on
            a target machine to establish a secure link.
          </p>
          <button
            onClick={() => navigate("/payload-generator")}
            className="mt-4 border border-green bg-[#111811] text-green px-4 py-1.5 rounded-md font-semibold hover:bg-green hover:text-black transition-colors cursor-pointer"
          >
            Go to Payload Generator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col px-4 sm:px-6 lg:px-10 py-5 sm:py-7 lg:py-9">
        <div className="w-full border-b border-green">
          <h1 className="text-xl sm:text-2xl font-semibold text-green pb-3 sm:pb-4 flex items-center">
            Infected Agents{" "}
            <span className="inline-block w-2 h-2 rounded-full bg-green ml-2 animate-pulse" />
          </h1>
        </div>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 lg:mx-10 mb-4 p-3 border border-red-500/50 bg-red-950/20 text-red-400 font-mono text-xs rounded relative">
          <div className="absolute top-0 left-0 border-t-2 border-l-2 border-red-500 w-3 h-3 -mt-[1px] -ml-[1px]" />
          <div className="absolute top-0 right-0 border-t-2 border-r-2 border-red-500 w-3 h-3 -mt-[1px] -mr-[1px]" />
          [WARNING] TELEMETRY FAULT: {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 px-4 sm:px-6 lg:px-10 pb-8">
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-x-hidden">
          <div className="flex gap-1 border-b border-green/30 overflow-x-auto whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors cursor-pointer",
                  activeTab === tab.key
                    ? "text-green border-b-2 border-green"
                    : "text-gray-500 hover:text-green/70",
                ].join(" ")}
              >
                <span className="opacity-70">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "command" && (
            <CommandExecutionTab clientId={selectedClient?.id} />
          )}
          {activeTab === "reverse-shell" && (
            <ReverseShellTab clientId={selectedClient?.id} />
          )}
          {activeTab === "file-manager" && (
            <FileManagerTab
              clientId={selectedClient?.id}
              client={selectedClient}
            />
          )}
        </div>

        <AgentInformation client={selectedClient} />
      </div>
    </div>
  );
}
