type SystemLogsCardProps = {
  logs: string[];
};

export default function SystemLogsCard({ logs }: SystemLogsCardProps) {
  return (
    <div className="col-span-1 border-green/30 bg-[#0A0F0A] rounded-md border px-4 py-3 text-green sm:px-5 sm:py-4">
      <div className="text-xs uppercase tracking-wider font-medium">System Logs</div>
      <div className="mt-3 space-y-2">
        {logs.map((log, index) => (
          <div className="border-green/60 border-b pb-2 text-sm" key={`${log}-${index}`}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
