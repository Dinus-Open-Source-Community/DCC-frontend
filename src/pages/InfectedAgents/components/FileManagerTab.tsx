import { useState, useEffect } from "react";
import { fetchJson, apiFetch } from "../../../lib/api";

type FileEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  size: number | null;
  modified: string | null;
  permissions: string | null;
  owner: string | null;
  group: string | null;
};

type FileManagerTabProps = {
  agentId: string;
};

export default function FileManagerTab({ agentId }: FileManagerTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Editor states
  const [editingFile, setEditingFile] = useState<FileEntry | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const fetchFiles = async (targetPath: string) => {
    setIsLoading(true);
    try {
      const res = await fetchJson<any>('/api/files/list', {
        method: "POST",
        body: JSON.stringify({
          client_id: agentId,
          path: targetPath,
          recursive: false
        })
      });
      if (res.success && res.data?.entries) {
        setFiles(res.data.entries);
        setCurrentPath(targetPath);
      } else {
        console.error("Failed to list files:", res.message);
      }
    } catch (e) {
      console.error("Error listing files:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles("/");
  }, [agentId]);

  // Derive breadcrumbs from path
  const parts = currentPath.split(/[/\\]/).filter(Boolean);
  const breadcrumb = [
    { label: "/", path: "/" },
    ...parts.map((part, i) => {
      const slice = parts.slice(0, i + 1);
      const isWindowsAbsolute = /^[a-zA-Z]:$/.test(slice[0]);
      let path = slice.join("/");
      if (!isWindowsAbsolute) {
        path = "/" + path;
      } else if (slice.length === 1) {
        path = path + "/"; // C:/
      }
      return { label: part, path };
    })
  ];

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const handleNavigate = (entry: FileEntry) => {
    if (entry.is_dir) {
      fetchFiles(entry.path);
    }
  };

  const handleDelete = async (file: FileEntry) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    setOpenMenuIndex(null);
    setIsLoading(true);
    try {
      await fetchJson('/api/files/delete', {
        method: "POST",
        body: JSON.stringify({ client_id: agentId, path: file.path })
      });
      await fetchFiles(currentPath);
    } catch (e) {
      console.error(e);
      alert("Failed to delete file/folder.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const endsWithSlash = currentPath.endsWith('/') || currentPath.endsWith('\\');
      const targetPath = endsWithSlash ? `${currentPath}${file.name}` : `${currentPath}/${file.name}`;
      await apiFetch(`/api/files/upload/${encodeURIComponent(targetPath)}?client_id=${agentId}`, {
        method: "POST",
        body: file
      });
      await fetchFiles(currentPath);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDirectory = async () => {
    const dirName = prompt("Enter directory name:");
    if (!dirName) return;

    setIsLoading(true);
    try {
      const endsWithSlash = currentPath.endsWith('/') || currentPath.endsWith('\\');
      const newPath = endsWithSlash ? `${currentPath}${dirName}` : `${currentPath}/${dirName}`;
      await fetchJson(`/api/clients/${agentId}/commands`, {
        method: "POST",
        body: JSON.stringify({ client_id: agentId, command: `mkdir "${newPath}"`, args: [] }),
      });
      setTimeout(() => fetchFiles(currentPath), 1500);
    } catch (e) {
      console.error(e);
      alert("Failed to create directory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = async () => {
    const fileName = prompt("Enter file name:");
    if (!fileName) return;

    setIsLoading(true);
    try {
      const endsWithSlash = currentPath.endsWith('/') || currentPath.endsWith('\\');
      const targetPath = endsWithSlash ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
      await apiFetch(`/api/files/upload/${encodeURIComponent(targetPath)}?client_id=${agentId}`, {
        method: "POST",
        body: ""
      });
      await fetchFiles(currentPath);
    } catch (err) {
      console.error(err);
      alert("Failed to create file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (file: FileEntry) => {
    setOpenMenuIndex(null);
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/files/download/${encodeURIComponent(file.path)}?client_id=${agentId}`);
      if (!res.ok) throw new Error("Failed to download");
      const text = await res.text();
      setEditingContent(text);
      setEditingFile(file);
    } catch (e) {
      console.error(e);
      alert("Failed to load file content for editing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;
    setIsLoading(true);
    try {
      await apiFetch(`/api/files/upload/${encodeURIComponent(editingFile.path)}?client_id=${agentId}`, {
        method: "POST",
        body: editingContent
      });
      setEditingFile(null);
      await fetchFiles(currentPath);
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (size?: number | null) => {
    if (size == null) return "-";
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
    return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const formatDate = (dateInfo?: any) => {
    if (!dateInfo) return "-";
    const ms = dateInfo.secs_since_epoch ? dateInfo.secs_since_epoch * 1000 : new Date(dateInfo).getTime();
    return new Date(ms).toLocaleString();
  };

  if (editingFile) {
    return (
      <div className="flex flex-col h-[600px] border border-green/40 rounded-lg bg-[#0a0f0a] overflow-hidden p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-mono">Editing: {editingFile.name}</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setEditingFile(null)}
              className="px-4 py-2 border border-green/30 rounded text-gray-300 hover:text-white hover:bg-green/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="px-4 py-2 border border-green rounded text-green bg-green/5 hover:bg-green/20 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
        <textarea
          className="flex-1 w-full bg-[#0d120d] border border-green/30 rounded-md p-4 text-green-300 font-mono outline-none resize-none focus:border-green"
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
          disabled={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="border border-green/40 rounded-lg bg-[#0a0f0a] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-green/20 bg-[#0d120d]">
        {/* Search */}
        <div className="flex items-center border border-green/30 rounded px-3 py-2 bg-[#080d08] w-72">
          <svg className="w-4 h-4 text-gray-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white text-sm outline-none w-full placeholder-gray-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchFiles(currentPath)}
            className="flex items-center gap-2 border border-green/30 rounded px-4 py-2 text-green text-sm hover:bg-green/10 transition-colors cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={handleCreateDirectory}
            className="flex items-center gap-2 border border-green/30 rounded px-4 py-2 text-green text-sm hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create Directory
          </button>
          <button
            onClick={handleCreateFile}
            className="flex items-center gap-2 border border-green/30 rounded px-4 py-2 text-green text-sm hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create File
          </button>
          <label className="flex items-center gap-2 border border-green/30 rounded px-4 py-2 text-green text-sm hover:bg-green/10 transition-colors cursor-pointer disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2.5 border-b border-green/15 text-sm flex items-center bg-[#111811]">
        {breadcrumb.map((segment, i) => (
          <span key={i} className="flex flex-row items-center">
            <button
              onClick={() => fetchFiles(segment.path)}
              className="text-green hover:underline cursor-pointer font-mono"
            >
              {segment.label === "/" ? "root:" : segment.label}
            </button>
            {i < breadcrumb.length - 1 && <span className="text-gray-600 mx-1.5">/</span>}
          </span>
        ))}
      </div>

      {/* Table Header & Rows wrapper for mobile scroll */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_120px_100px_160px_40px] items-center px-4 py-2.5 border-b border-green/20 text-gray-500 text-xs uppercase tracking-wider bg-[#0d120d]">
            <div className="flex justify-center cursor-pointer hover:text-green transition-colors pl-1">
              name <span className="text-green">↓</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-green transition-colors">
              perms <span className="text-green">↓</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-green transition-colors">
              owner:group <span className="text-green">↓</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-green transition-colors">
              size <span className="text-green">↓</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-green transition-colors">
              date <span className="text-green">↓</span>
            </div>
            <div />
          </div>

          {/* File Rows */}
          {isLoading ? (
            <div className="p-8 flex justify-center items-center">
              <p className="text-green/50 animate-pulse font-mono tracking-wide text-sm">Listing files...</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pb-20">
              {filteredFiles.map((file, i) => (
                <div
                  key={i}
                  className={[
                    "grid grid-cols-[1fr_80px_120px_100px_160px_40px] items-center px-4 py-3 border-b border-green/10 text-sm transition-colors hover:bg-green/5 group relative",
                    i % 2 === 0 ? "bg-[#0a0f0a]" : "bg-[#0d120d]",
                  ].join(" ")}
                >

                  {/* Name + Icon */}
                  <div
                    className="flex items-center gap-3 cursor-pointer pl-1 truncate pr-4"
                    onClick={() => handleNavigate(file)}
                  >
                    {file.is_dir ? (
                      <svg className="w-5 h-5 text-green shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className={`truncate ${file.is_dir ? "text-green hover:underline font-medium" : "text-gray-300 hover:text-white"}`} title={file.name}>
                      {file.name}
                    </span>
                  </div>

                  {/* Perms */}
                  <div className="text-gray-500 text-xs font-mono truncate" title={file.permissions || "-"}>
                    {file.permissions || "-"}
                  </div>

                  {/* user:group */}
                  <div className="text-gray-400 text-xs font-mono truncate" title={file.owner || "-"}>
                    {file.owner || "-"}:{file.group || "-"}
                  </div>

                  {/* Size */}
                  <div className="text-gray-400 text-xs font-mono">{file.is_dir ? "-" : formatSize(file.size)}</div>

                  {/* Date */}
                  <div className="text-gray-400 text-xs">{formatDate(file.modified)}</div>

                  {/* Actions (three-dot menu) */}
                  <div className="flex justify-center position-static">
                    <button
                      onClick={() => setOpenMenuIndex(openMenuIndex === i ? null : i)}
                      className="text-gray-500 hover:text-green p-1 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>

                    {openMenuIndex === i && (
                      <div className="absolute right-8 top-10 z-[100] w-48 border border-green/30 rounded-lg bg-[#111811] shadow-xl shadow-black py-1">
                        {file.is_dir ? (
                          <>
                            <button onClick={() => { setOpenMenuIndex(null); handleNavigate(file); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green/10 hover:text-green transition-colors cursor-pointer">Open</button>
                            <div className="border-t border-green/15 my-1" />
                            <button onClick={() => handleDelete(file)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50">Delete Directory</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(file)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green/10 hover:text-green transition-colors cursor-pointer disabled:opacity-50">Edit</button>
                            <a href={`/api/files/download/${encodeURIComponent(file.path)}?client_id=${agentId}`} target="_blank" rel="noreferrer" className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green/10 hover:text-green transition-colors cursor-pointer" onClick={() => setOpenMenuIndex(null)}>Download</a>
                            <div className="border-t border-green/15 my-1" />
                            <button onClick={() => handleDelete(file)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50">Delete File</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredFiles.length === 0 && (
                <div className="p-8 text-center text-gray-500">No files found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
