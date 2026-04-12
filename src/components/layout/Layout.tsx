import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <div className="h-px w-full bg-green/50 hidden lg:block" />
      
      {/* Mobile Header (Hamburger) */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-green/30 bg-[#030603] sticky top-0 z-40">
        <div className="flex items-center gap-3 text-green">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          <span className="font-bold text-lg font-mono truncate">{location.pathname === '/' ? '/dashboard' : location.pathname}</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="text-green p-2 hover:bg-green/10 rounded">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-61px)] lg:min-h-[calc(100vh-1px)] relative">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 w-full overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
