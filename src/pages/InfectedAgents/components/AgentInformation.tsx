import { useEffect, useState } from "react";
import { fetchJson } from "../../../lib/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type AgentInformationProps = {
  agentId: string;
};

// Custom Hacker-style dot icon for the map
const HackerIcon = new L.DivIcon({
  className: "bg-transparent border-none",
  html: `<div class="w-3 h-3 bg-green rounded-full shadow-[0_0_12px_2px_#00FF41] animate-pulse"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

type GeoData = {
  lat: number;
  lon: number;
  location: string;
  isp: string;
};

export default function AgentInformation({ agentId }: AgentInformationProps) {
  const [agentData, setAgentData] = useState<any>(null);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/clients/display')
      .then((data: any) => {
        if (!mounted || !data?.clients) return;
        const target = data.clients.find((c: any) => c.id === agentId);
        if (target) {
          setAgentData(target);

          // Only fetch geo if we have an IP
          if (target.ip) {
            // Simple public IP matching to avoid pinging local IPs
            const isLocal = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|::1)/.test(target.ip);

            if (!isLocal) {
              fetch(`https://ipapi.co/${target.ip}/json/`)
                .then(r => r.json())
                .then(geo => {
                  if (mounted && geo && geo.latitude && geo.longitude) {
                    setGeoData({
                      lat: geo.latitude,
                      lon: geo.longitude,
                      location: `${geo.city || 'Unknown City'}, ${geo.country_name || geo.country || 'Unknown'}`,
                      isp: geo.org || geo.isp || 'Unknown ISP'
                    });
                  }
                  setGeoLoading(false);
                }).catch(() => {
                  if (mounted) setGeoLoading(false);
                });
            } else {
              setGeoLoading(false);
            }
          } else {
            setGeoLoading(false);
          }
        }
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, [agentId]);

  if (!agentData) {
    return (
      <div className="w-full lg:w-[350px] shrink-0 border border-green/40 rounded-lg p-6 bg-black/40 h-fit">
        <h2 className="text-xl font-semibold text-green mb-6">Agent Database</h2>
        <p className="text-green/50 animate-pulse">Uplinking to target...</p>
      </div>
    );
  }

  // Calculate quick metrics
  const memUsage = Math.round((agentData.memory / (agentData.memory + 1024)) * 100) || 0; // estimate if total not given
  const diskUsage = agentData.total_disk_space_gb
    ? Math.round(((agentData.total_disk_space_gb - agentData.available_disk_space_gb) / agentData.total_disk_space_gb) * 100)
    : 0;

  return (
    <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4">

      {/* Primary Identity Card */}
      <div className="border border-green/40 rounded-lg p-5 bg-[#0a0f0a]">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-green tracking-wider uppercase">Identity</h2>
          <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${agentData.is_online ? "bg-green text-black animate-pulse" : "bg-red-500/20 text-red-500"}`}>
            {agentData.is_online ? "Online" : "Offline"}
          </div>
        </div>

        <div className="space-y-3 mt-4 text-sm break-all font-mono">
          <div>
            <div className="text-gray-500 text-xs uppercase">IP Address</div>
            <div className="text-green font-bold">{agentData.ip}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs uppercase">Hostname / User</div>
            <div className="text-white">{agentData.hostname} <span className="text-green/50">\</span> {agentData.username}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs uppercase">Target ID Hash</div>
            <div className="text-gray-400 text-xs truncate" title={agentData.id}>{agentData.id}</div>
          </div>
        </div>
      </div>

      {/* Geospatial Map Link */}
      <div className="border border-green/40 rounded-lg bg-[#0a0f0a] overflow-hidden">
        <div className="border-b border-green/20 bg-[#0d120d] px-4 py-2">
          <h3 className="text-sm font-semibold text-green uppercase tracking-wider">Geospatial Uplink</h3>
        </div>

        <div className="h-48 w-full bg-black relative">
          {geoLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-green/50 text-xs animate-pulse font-mono tracking-widest">TRACING IP...</span>
            </div>
          ) : geoData ? (
            <MapContainer
              center={[geoData.lat, geoData.lon]}
              zoom={5}
              zoomControl={false}
              attributionControl={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <Marker position={[geoData.lat, geoData.lon]} icon={HackerIcon}>
                <Popup className="hacker-popup">
                  <div className="text-xs font-mono">Target Located.</div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
              <span className="text-red-400 text-2xl mb-1 mt-2">✕</span>
              <span className="text-red-400 text-xs font-mono tracking-widest uppercase">Trace Failed</span>
            </div>
          )}
        </div>

        {geoData && (
          <div className="p-3 bg-[#0d120d] border-t border-green/20 text-xs font-mono">
            <div className="flex justify-between text-gray-400 mb-1">
              <span>LOC:</span>
              <span className="text-white text-right truncate pl-2">{geoData.location}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>ISP:</span>
              <span className="text-white text-right truncate pl-2">{geoData.isp}</span>
            </div>
          </div>
        )}
      </div>

      {/* Hardware / Environment Card */}
      <div className="border border-green/40 rounded-lg p-5 bg-[#0a0f0a]">
        <h2 className="text-sm font-semibold text-green mb-4 uppercase tracking-wider">Environment Specs</h2>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="col-span-2 bg-[#0d120d] p-3 rounded border border-green/10">
            <div className="text-gray-500 mb-1 uppercase text-[10px]">Operating System</div>
            <div className="text-green">{agentData.os}</div>
          </div>

          <div className="col-span-2 bg-[#0d120d] p-3 rounded border border-green/10">
            <div className="text-gray-500 mb-1 uppercase text-[10px]">Processor</div>
            <div className="text-white truncate" title={agentData.cpu_brand}>{agentData.cpu_brand}</div>
            <div className="text-gray-400 mt-1">{agentData.cpu_cores} Cores @ {agentData.cpu_frequency} MHz</div>
          </div>

          <div className="bg-[#0d120d] p-3 rounded border border-green/10">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500 uppercase text-[10px]">Disk Space</span>
            </div>
            <div className="text-white">{agentData.total_disk_space_gb ? (agentData.total_disk_space_gb - agentData.available_disk_space_gb).toFixed(1) : 0} GB <span className="text-gray-600 text-[10px]">USED</span></div>
            <div className="w-full bg-black h-1 mt-2 rounded">
              <div className="bg-green h-1 rounded pointer-events-none" style={{ width: `${diskUsage}%` }}></div>
            </div>
          </div>

          <div className="bg-[#0d120d] p-3 rounded border border-green/10">
            <div className="text-gray-500 mb-1 uppercase text-[10px]">Memory (RAM)</div>
            <div className="text-white">{agentData.memory} GB</div>
            <div className="w-full bg-black h-1 mt-2 rounded">
              <div className="bg-green h-1 rounded pointer-events-none" style={{ width: `${memUsage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
