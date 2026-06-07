import { useState, useEffect } from "react";
import { Sun, Moon, CheckCircle2, XCircle } from "lucide-react";
import axios from "axios";

const axiosInstance = axios.create({
  withCredentials: true,
});

export default function Settings() {
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axiosInstance.get("/api/auth/status");
        if (response.data.authenticated) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      } catch (error) {
        setServerStatus("offline");
      }
    };
    
    checkStatus();
    // Poll every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col px-6 md:px-8 py-8 w-full h-[calc(100vh-1px)] overflow-y-auto custom-scrollbar">
      {/* HEADER */}
      <div className="flex justify-between w-full border-b border-green mb-9">
        <h1 className="text-2xl sm:text-3xl font-semibold text-green pb-5">
          Settings
          <span className="inline-block w-3 h-3 rounded-full bg-green ml-2 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
        </h1>
      </div>

      <div className="max-w-4xl border border-green/30 rounded-[10px] p-8 sm:p-10 bg-black flex flex-col gap-10">
        
        {/* APPEARANCE SECTION */}
        <div>
          <h2 className="text-3xl font-bold text-green mb-2 tracking-wide">Appearance</h2>
          <p className="text-green/70 mb-6">Customize the interface theme to match your preference</p>

          <div className="flex gap-6">
            <button className="flex-1 border border-green/30 rounded-[10px] p-6 flex items-center gap-5 hover:bg-green/5 transition-colors text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-green/30 bg-green/5 text-green">
                <Sun size={28} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-green">Light Mode</span>
                <span className="text-sm text-green/70">Clean tech aesthetic</span>
              </div>
            </button>

            <button className="flex-1 border border-green/30 rounded-[10px] p-6 flex items-center gap-5 hover:bg-green/5 transition-colors text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-green/30 bg-green/5 text-green">
                <Moon size={28} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-green">Dark Mode</span>
                <span className="text-sm text-green/70">Cyberpunk hacker theme</span>
              </div>
            </button>
          </div>
        </div>

        {/* ABOUT SECTION */}
        <div className="border border-green/20 rounded-[10px] p-8 bg-[#050A07]">
          <h2 className="text-2xl font-bold text-green mb-6 tracking-wide border-b border-green/10 pb-4">System Information</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-green/10 pb-4">
              <p className="text-green/50 text-sm">Framework Version</p>
              <p className="text-green font-mono text-sm sm:text-base">React 19.0.0</p>
            </div>
            
            <div className="flex items-center justify-between border-b border-green/10 pb-4">
              <p className="text-green/50 text-sm">Build Release</p>
              <p className="text-green font-mono text-sm sm:text-base">v1.0.0-beta</p>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-green/50 text-sm">C2 Server Status</p>
              <div className="flex items-center gap-2 font-mono">
                {serverStatus === "checking" && <span className="text-yellow-500 text-sm animate-pulse">CHECKING...</span>}
                {serverStatus === "online" && (
                  <>
                    <span className="text-green text-sm">ONLINE</span>
                    <CheckCircle2 size={16} className="text-green" />
                  </>
                )}
                {serverStatus === "offline" && (
                  <>
                    <span className="text-red-500 text-sm">OFFLINE</span>
                    <XCircle size={16} className="text-red-500" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
