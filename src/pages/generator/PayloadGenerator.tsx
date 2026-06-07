import { useState } from "react";
import { Download, Check, ChevronDown, AlertTriangle, Loader2 } from "lucide-react";
import { payloadService } from "@/services/payloadService";
import type { PayloadOsTarget } from "@/services/payloadService";

type Status = "idle" | "processing" | "success" | "error";

export default function PayloadGenerator() {
    const [osTarget, setOsTarget] = useState<PayloadOsTarget>("linux");
    const [serverIp, setServerIp] = useState("192.168.56.1");
    const [port, setPort] = useState(8080);
    const [antiDebug, setAntiDebug] = useState(false);
    const [antiVm, setAntiVm] = useState(false);
    const [suicide, setSuicide] = useState(false);
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);

    const isProcessing = status === "processing";

    const handleGenerate = async () => {
        if (!serverIp.trim()) {
            setError("Server IP / Domain tidak boleh kosong.");
            setStatus("error");
            return;
        }
        if (!port || port < 1 || port > 65535) {
            setError("Port harus 1-65535.");
            setStatus("error");
            return;
        }
        if (suicide && !antiDebug && !antiVm) {
            setError("Suicide mode butuh Anti-Debug atau Anti-VM aktif.");
            setStatus("error");
            return;
        }

        setStatus("processing");
        setError(null);

        try {
            const result = await payloadService.generatePayload({
                ip: serverIp.trim(),
                port,
                anti_debug: antiDebug,
                anti_vm: antiVm,
                suicide,
                os_target: osTarget,
            });

            const url = URL.createObjectURL(result.blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStatus("success");
        } catch (err: unknown) {
            console.error("Payload generation failed:", err);
            const message = err instanceof Error ? err.message : "Gagal compile payload.";
            setError(message);
            setStatus("error");
        }
    };

    const resetStatus = () => {
        if (status === "success" || status === "error") {
            setStatus("idle");
            setError(null);
        }
    };

    return (
        <div className="flex flex-col px-14 py-10 w-full h-[calc(100vh-1px)] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between w-full border-b border-green mb-9">
                <h1 className="text-4xl font-semibold text-green pb-7">
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
                                onChange={(e) => {
                                    setOsTarget(e.target.value as PayloadOsTarget);
                                    resetStatus();
                                }}
                                disabled={isProcessing}
                                className="w-full bg-black border border-green/50 rounded-lg p-3 text-white outline-none focus:border-green transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="linux">Linux</option>
                                <option value="windows">Windows</option>
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
                            value={serverIp}
                            onChange={(e) => {
                                setServerIp(e.target.value);
                                resetStatus();
                            }}
                            disabled={isProcessing}
                            className="w-full bg-black border border-green/50 rounded-lg p-3 text-white outline-none focus:border-green transition-all disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-green text-sm mb-2">Port</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={port}
                                onChange={(e) => {
                                    setPort(parseInt(e.target.value) || 0);
                                    resetStatus();
                                }}
                                disabled={isProcessing}
                                className="w-full bg-black border border-green/50 rounded-lg p-3 text-white outline-none focus:border-green transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 disabled:opacity-50"
                            />
                            <div className="absolute right-4 top-0 bottom-0 flex flex-col items-center justify-center gap-[3px]">
                                <button type="button" onClick={() => !isProcessing && setPort(p => p + 1)} disabled={isProcessing} className="text-white hover:text-green transition-colors focus:outline-none flex justify-center disabled:opacity-50">
                                    <svg width="8" height="4" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 5L6 1L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                                <button type="button" onClick={() => !isProcessing && setPort(p => Math.max(0, p - 1))} disabled={isProcessing} className="text-white hover:text-green transition-colors focus:outline-none flex justify-center disabled:opacity-50">
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
                                    onChange={(e) => {
                                        setAntiDebug(e.target.checked);
                                        resetStatus();
                                    }}
                                    disabled={isProcessing}
                                    className="peer appearance-none w-4 h-4 border border-green/50 rounded-sm bg-transparent checked:bg-[#002b11] checked:border-green transition-all cursor-pointer disabled:opacity-50"
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
                                    onChange={(e) => {
                                        setAntiVm(e.target.checked);
                                        resetStatus();
                                    }}
                                    disabled={isProcessing}
                                    className="peer appearance-none w-4 h-4 border border-green/50 rounded-sm bg-transparent checked:bg-[#002b11] checked:border-green transition-all cursor-pointer disabled:opacity-50"
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
                                    onChange={(e) => {
                                        setSuicide(e.target.checked);
                                        resetStatus();
                                    }}
                                    disabled={isProcessing}
                                    className="peer appearance-none w-4 h-4 border border-green/50 rounded-sm bg-transparent checked:bg-[#002b11] checked:border-green transition-all cursor-pointer disabled:opacity-50"
                                />
                                <Check size={12} className="absolute text-green opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                            </div>
                            <span className="text-green text-sm">Enable Suicide Mode (hanya bekerja jika Anti-Debug atau Anti-VM aktif)</span>
                        </label>

                        <div className="pt-6 mt-6">
                            <button
                                onClick={handleGenerate}
                                disabled={isProcessing}
                                className={`w-full bg-black border border-green/50 text-green py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-semibold ${isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-green hover:text-black"}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Compiling…
                                    </>
                                ) : (
                                    <>
                                        <Download size={20} />
                                        Compile & Download
                                    </>
                                )}
                            </button>

                            {isProcessing && (
                                <div className="mt-4 w-full bg-black border border-orange-500 rounded-lg p-6 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Loader2 size={20} className="text-orange-500 animate-spin" />
                                        <p className="text-orange-500 text-sm font-medium">
                                            Compiling payload di server… (30-60 detik, jangan tutup halaman)
                                        </p>
                                    </div>
                                    <div className="w-full bg-orange-500/10 rounded h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 animate-pulse w-1/3"
                                            style={{ animation: "shimmer 1.5s infinite linear" }}
                                        />
                                    </div>
                                </div>
                            )}

                            {status === "success" && (
                                <div className="mt-4 w-full bg-black border border-green rounded-lg p-6 flex justify-center items-center gap-3">
                                    <Check className="text-green" size={20} strokeWidth={3} />
                                    <p className="text-green text-sm font-medium">
                                        Generation complete! Download started otomatis. Cek folder Downloads kamu.
                                    </p>
                                </div>
                            )}

                            {status === "error" && error && (
                                <div className="mt-4 w-full bg-black border border-red-500 rounded-lg p-4 flex items-start gap-3">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-red-500 text-sm font-semibold">Compile gagal</p>
                                        <p className="text-red-400 text-xs font-mono mt-1 whitespace-pre-wrap break-words">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
