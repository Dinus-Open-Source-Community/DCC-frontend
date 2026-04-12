import { NavLink } from "react-router";
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
  {
    name: "System Logs",
    path: "/system-logs",
  },
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

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
};

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[49] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside 
        className={[
          "w-64 border-r border-green/55 px-5 py-6 flex flex-col bg-[#030603]",
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out h-[100dvh]",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-green/55 pb-4">
          <div className="flex items-center">
            <img src={logo} alt="Logo" className="mr-3 h-8 w-8" />
            <h1 className="text-xl font-bold text-green">DCC</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-green hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      <nav className="pt-6 text-green">
        <ul className="space-y-2.5">
          {NavItem.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  [
                    "relative block rounded-md px-4 py-2.5 text-sm font-medium leading-none transition-colors duration-150",
                    isActive
                      ? "border border-green/80 bg-[#00230d] text-green before:absolute before:inset-y-0 before:left-0 before:w-2 before:rounded-l-lg before:bg-green before:content-['']"
                      : "text-green font-normal hover:bg-[#00190a]",
                  ].join(" ")
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
    </>
  );
}
