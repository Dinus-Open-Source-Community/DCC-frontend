import { useState } from "react";
import { apiFetch } from "../../lib/api";

export default function PayloadGenerator() {
  const [osTarget, setOsTarget] = useState("linux");
  const [ip, setIp] = useState("192.168.56.1");
  const [port, setPort] = useState(8080);
  const [antiDebug, setAntiDebug] = useState(false);
  const [antiVm, setAntiVm] = useState(false);
  const [suicide, setSuicide] = useState(false);
  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus("Compiling payload in the background... Please wait (this takes time).");

    const payloadConfig = {
      ip,
      port: Number(port),
      anti_debug: antiDebug,
      anti_vm: antiVm,
      suicide: suicide,
      os_target: osTarget,
    };

    try {
      const response = await apiFetch('/api/payload/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadConfig)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = osTarget === 'windows' ? 'implant.exe' : 'implant_client';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setStatus("✅ Generation complete! Download started.");
      } else {
        const err = await response.text();
        setStatus("❌ Compilation Error: " + err);
      }
    } catch (error: any) {
      setStatus("❌ Request failed: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col px-8 py-6 h-full">
      <div className="w-full border-b border-green flex items-end pb-7 mb-10">
        <h1 className="text-2xl font-semibold text-green">
          Payload Generator <span className="inline-block w-2 h-2 rounded-full bg-green ml-2 animate-pulse" />
        </h1>
      </div>

      <div className="border border-green/30 rounded-lg bg-[#0a0f0a] p-8 max-w-3xl">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-green mb-2 font-semibold">Target OS:</label>
            <select 
              value={osTarget}
              onChange={e => setOsTarget(e.target.value)}
              className="w-full p-3 bg-black/40 border border-green/30 text-white rounded outline-none focus:border-green transition-colors font-mono cursor-pointer"
            >
              <option value="linux">Linux (x86_64)</option>
              <option value="windows">Windows (x86_64)</option>
            </select>
          </div>

          <div>
            <label className="block text-green mb-2 font-semibold">Connect-back IP / Domain:</label>
            <input 
              type="text" 
              value={ip} 
              onChange={e => setIp(e.target.value)}
              className="w-full p-3 bg-black/40 border border-green/30 text-white rounded outline-none focus:border-green transition-colors font-mono"
            />
          </div>
          
          <div>
            <label className="block text-green mb-2 font-semibold">Port:</label>
            <input 
              type="number" 
              value={port} 
              onChange={e => setPort(Number(e.target.value))}
              className="w-full p-3 bg-black/40 border border-green/30 text-white rounded outline-none focus:border-green transition-colors font-mono"
            />
          </div>
          
          <div className="flex flex-col gap-4 mt-2 border border-green/15 rounded p-4 bg-black/40">
            <label className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={antiDebug}
                onChange={e => setAntiDebug(e.target.checked)}
                className="w-4 h-4 accent-green cursor-pointer"
              />
              Enable Anti-Debugging
            </label>
            
            <label className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={antiVm}
                onChange={e => setAntiVm(e.target.checked)}
                className="w-4 h-4 accent-green cursor-pointer"
              />
              Enable Anti-VM / Sandbox Evasion
            </label>
            
            <label className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={suicide}
                onChange={e => setSuicide(e.target.checked)}
                className="w-4 h-4 accent-green cursor-pointer"
              />
              <span className="flex-1">
                Enable Suicide Mode <span className="text-gray-500 text-xs ml-1">(Only works when Anti-VM / Sandbox is enabled or Anti-Debugging is enabled)</span>
              </span>
            </label>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-4 w-full bg-green/10 border border-green text-green font-bold py-3 px-4 rounded hover:bg-green hover:text-black transition-colors disabled:opacity-50 cursor-pointer uppercase tracking-wiser"
          >
            {isGenerating ? "Compiling Payload..." : "Compile & Download"}
          </button>
          
          {status && (
            <div className={`mt-2 text-center font-mono text-sm ${status.startsWith('✅') ? 'text-green' : status.startsWith('❌') ? 'text-red-400' : 'text-yellow-400'}`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
