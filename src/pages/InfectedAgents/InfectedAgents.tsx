import { useState } from "react";
import { useParams } from "react-router";
import CommandExecutionTab from "./components/CommandExecutionTab";
import ReverseShellTab from "./components/ReverseShellTab";
import FileManagerTab from "./components/FileManagerTab";
import AgentInformation from "./components/AgentInformation";

type Tab = "command" | "reverse-shell" | "file-manager";

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "command", label: "Command Execution", icon: ">_" },
  { key: "reverse-shell", label: "Reverse Shell", icon: ">_" },
  { key: "file-manager", label: "File Manager", icon: "📁" },
];

export default function InfectedAgents() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("command");

  if (!id) {
    return (
      <div className="w-full flex items-center justify-center min-h-[50vh]">
        <p className="text-green/50 text-xl font-mono">No target selected. Return to Dashboard to select an agent.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col px-8 py-6">
        <div className="w-full border-b border-green">
          <h1 className="text-2xl font-semibold text-green pb-5">
            Infected Agents <span className="inline-block w-2 h-2 rounded-full bg-green ml-2 animate-pulse" />
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-8 pb-8">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-green/30 overflow-x-auto whitespace-nowrap pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer",
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

          {/* Tab Content */}
          {activeTab === "command" && <CommandExecutionTab agentId={id} />}
          {activeTab === "reverse-shell" && <ReverseShellTab agentId={id} />}
          {activeTab === "file-manager" && <FileManagerTab agentId={id} />}
        </div>

        {/* Agent Information Sidebar */}
        <AgentInformation agentId={id} />
      </div>
    </div>
  );
}
