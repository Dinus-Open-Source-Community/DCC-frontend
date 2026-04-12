type SystemLogsCardProps = {
  logs: string[];
};

export default function SystemLogsCard({ logs }: SystemLogsCardProps) {
  return (
    <div className="col-span-1 rounded-lg border border-green bg-green/8 p-4 sm:p-7 text-green">
      <div className="text-xl font-normal">System Logs</div>
      <div className="mt-6 space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {logs.map((log, index) => (
          <div className="border-b border-green/60 pb-3 text-base" key={`${log}-${index}`}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
