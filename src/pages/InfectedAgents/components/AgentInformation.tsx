import type { ClientInfo } from "@/services/clientService";
import { isClientOnline } from "@/lib/os";

type AgentInformationProps = {
  client: ClientInfo | null;
};

export default function AgentInformation({ client }: AgentInformationProps) {
  if (!client) {
    return (
      <div className="w-full lg:w-[340px] shrink-0 border border-green/30 bg-[#0A0F0A] p-5 rounded-xl font-mono text-green text-center">
        NO AGENT SELECTED
      </div>
    );
  }

  const isOnline = isClientOnline(client.last_seen);

  // Function to parse geospatial info
  const parseCountryInfo = (info: string) => {
    if (!info) return { location: "Unknown", isp: "Unknown" };
    const lines = info.split("\n");
    let country = "";
    let region = "";
    let city = "";
    let isp = "";

    lines.forEach((line) => {
      const parts = line.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(":").trim();
        if (key === "country") country = value;
        else if (key === "region") region = value;
        else if (key === "city") city = value;
        else if (key === "isp") isp = value;
      }
    });

    const locationParts = [city, region, country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : info;
    return { location, isp: isp || "Unknown" };
  };

  const { location, isp } = parseCountryInfo(client.country_info);

  // Formatter for disk space (bytes to GB)
  const formatGB = (bytes: number) => {
    if (!bytes) return "0 GB";
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const totalDisk = client.total_disk_space || 0;
  const availableDisk = client.available_disk_space || 0;
  const usedDisk = totalDisk - availableDisk;
  const diskPercent = totalDisk > 0 ? Math.round((usedDisk / totalDisk) * 100) : 0;

  return (
    <div className="w-full lg:w-[340px] shrink-0 space-y-4 h-fit">
      {/* IDENTITY SECTION */}
      <div className="rounded-xl border border-green/30 bg-[#0A0F0A] p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-green tracking-widest uppercase">IDENTITY</h3>
          <span
            className={[
              "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
              isOnline ? "bg-green text-black" : "bg-red-950 border border-red-500/50 text-red-400",
            ].join(" ")}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="space-y-4 font-mono">
          <div>
            <div className="mb-1 text-[10px] text-gray-500">IP ADDRESS</div>
            <div className="text-sm font-semibold text-green">{client.ip}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] text-gray-500">HOSTNAME / USER</div>
            <div className="text-sm text-gray-200">
              {client.hostname} <span className="text-green">\</span> {client.username}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] text-gray-500">TARGET ID HASH</div>
            <div className="text-xs text-gray-400 break-all">{client.id}</div>
          </div>
        </div>
      </div>

      {/* GEOSPATIAL UPLINK SECTION */}
      <div className="rounded-xl border border-green/30 bg-[#0A0F0A] p-5">
        <h3 className="mb-4 text-sm font-bold text-green tracking-widest uppercase">
          GEOSPATIAL UPLINK
        </h3>

        {/* Map placeholder */}
        <div className="relative mb-4 h-36 w-full overflow-hidden border border-green/20 bg-[#131713] flex items-center justify-center">
          <div className="text-xs text-green/20 font-mono tracking-widest">MAP SENSOR ONLINE</div>
          {/* Glowing dot representing location */}
          <div className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green shadow-[0_0_12px_3px_rgba(0,255,0,0.6)] animate-pulse" />
        </div>

        <div className="flex flex-col gap-1.5 font-mono text-[11px] text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-500">LOC:</span>
            <span>{location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ISP:</span>
            <span className="text-right truncate max-w-[180px]" title={isp}>{isp}</span>
          </div>
        </div>
      </div>

      {/* ENVIRONMENT SPECS SECTION */}
      <div className="rounded-xl border border-green/30 bg-[#0A0F0A] p-5">
        <h3 className="mb-4 text-sm font-bold text-green tracking-widest uppercase">
          ENVIRONMENT SPECS
        </h3>

        <div className="space-y-3">
          {/* OS Box */}
          <div className="rounded border border-green/20 bg-[#0F140F] p-3 font-mono">
            <div className="mb-1 text-[10px] text-gray-500">OPERATING SYSTEM</div>
            <div className="text-xs text-green">{client.os} ({client.arch})</div>
          </div>

          {/* Processor Box */}
          <div className="rounded border border-green/20 bg-[#0F140F] p-3 font-mono">
            <div className="mb-1 text-[10px] text-gray-500">PROCESSOR</div>
            <div className="text-[11px] text-gray-300 leading-relaxed">
              {client.cpu_brand || "Unknown CPU"}<br />
              {client.cpu_cores || 0} Cores @ {client.cpu_frequency || 0} MHz
            </div>
          </div>

          {/* Disk & Memory Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-green/20 bg-[#0F140F] p-3 font-mono flex flex-col justify-between">
              <div>
                <div className="mb-1 text-[10px] text-gray-500">DISK SPACE</div>
                <div className="mb-3 text-[11px] font-semibold text-gray-300">
                  {formatGB(totalDisk)}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[9px] text-gray-500 flex justify-between">
                  <span>USED</span>
                  <span>{diskPercent}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-green/10">
                  <div
                    className="h-full rounded-full bg-green"
                    style={{ width: `${diskPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded border border-green/20 bg-[#0F140F] p-3 font-mono flex flex-col justify-between">
              <div>
                <div className="mb-1 text-[10px] text-gray-500">MEMORY (RAM)</div>
                <div className="mb-3 text-[11px] font-semibold text-gray-300">
                  {client.memory ? `${client.memory} GB` : "Unknown"}
                </div>
              </div>
              <div className="mt-auto">
                <div className="mb-1.5 text-[9px] text-gray-500 opacity-0 hidden">USED</div>
                <div className="h-1 w-full rounded-full bg-green/10">
                  <div className="h-full w-[35%] rounded-full bg-green" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

