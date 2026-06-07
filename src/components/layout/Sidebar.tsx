import { NavLink } from "react-router";
import { User } from "lucide-react";
import logo from "../../assets/logo.svg";

const NavItem = [
  {
    name: "Dashboard",
    path: "/",
  },
  {
    name: "Infected Agents",
    path: "/infected-agents",
  },
  // {
  //   name: "System Logs",
  //   path: "/system-logs",
  // },
  {
    name: "Notes",
    path: "/notes",
  },
  {
    name: "Payload Generator",
    path: "/payload-generator",
  },
  {
    name: "Settings",
    path: "/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-green/55 px-4 py-5 flex flex-col h-[calc(100vh-1px)] sticky top-0">
      <div className="flex items-center border-b border-green/55 pb-4 shrink-0">
        <img src={logo} alt="Logo" className="mr-2.5 h-8 w-8" />
        <h1 className="text-lg font-semibold tracking-wider text-green">DCC</h1>
      </div>
      <nav className="pt-4 text-green flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-4">
          {NavItem.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  [
                    "relative block rounded-md text-sm font-medium leading-none transition-colors duration-150",
                    isActive
                      ? "px-4 py-2.5 border border-green/80 bg-[#00230d] text-green before:absolute before:inset-y-0 before:left-0 before:w-2 before:rounded-l-md before:bg-green before:content-['']"
                      : "px-3 py-2 text-green font-normal hover:bg-[#00190a]",
                  ].join(" ")
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto border-t border-green/55 pt-4 shrink-0">
        <div className="flex items-center gap-3 rounded-md border border-green/60 p-2.5 hover:bg-green/5 cursor-pointer transition-colors">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green/60 bg-green/10 text-green">
            <User size={16} strokeWidth={2} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-green leading-none">
              Admin User
            </span>
            <span className="text-xs font-medium text-green/70 leading-none">
              Administrator
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
