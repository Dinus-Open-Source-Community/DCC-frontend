import { useState, useEffect } from "react";
import { fetchJson, apiFetch } from "../../lib/api";

type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
};

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [currentTitle, setCurrentTitle] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const data = await fetchJson<Note[]>("/api/notes");
      setNotes(data);
    } catch (e) {
      console.error("Failed to fetch notes:", e);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (selectedNote) {
      setCurrentTitle(selectedNote.title);
      setCurrentContent(selectedNote.content);
    } else {
      setCurrentTitle("");
      setCurrentContent("");
    }
  }, [selectedNote]);

  const handleClear = () => {
    setSelectedNote(null);
    setCurrentTitle("");
    setCurrentContent("");
  };

  const handleSave = async () => {
    if (!currentTitle.trim() && !currentContent.trim()) return;

    setIsLoading(true);
    try {
      if (selectedNote) {
        // Update existing
        await apiFetch(`/api/notes/${selectedNote.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: currentTitle,
            content: currentContent
          })
        });
      } else {
        // Create new
        const res = await apiFetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: currentTitle,
            content: currentContent
          })
        });
        const created = await res.json();
        setSelectedNote(created);
      }
      await fetchNotes();
    } catch (e) {
      console.error("Failed to save note:", e);
      alert("Failed to save note.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await apiFetch(`/api/notes/${id}`, {
        method: "DELETE"
      });
      if (selectedNote?.id === id) {
        handleClear();
      }
      await fetchNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex flex-col px-8 py-6 h-full max-h-screen">
      <div className="w-full border-b border-green flex justify-between items-end pb-7">
        <div>
          <h1 className="text-2xl font-semibold text-green">Notes</h1>
          <p className="text-green">Manage operational notes, targets, and findings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 flex-1 overflow-hidden min-h-0">
        {/* Left Column: Notes List */}
        <div className="border border-green/10 rounded-xl bg-black/20 p-4 overflow-y-auto flex flex-col gap-4">
          {notes.length === 0 && (
            <div className="text-gray-500 text-center mt-10">No notes found. Create one.</div>
          )}
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`border rounded-lg p-5 cursor-pointer transition-all duration-200 group relative ${selectedNote?.id === note.id
                ? "border-green/40 shadow-[0_0_15px_rgba(0,255,0,0.05)]"
                : "border-green/10 hover:border-green/30"
                }`}
            >
              <h3 className="text-green font-bold mb-3">{note.title || "Untitled"}</h3>
              <p className="text-green/80 text-sm mb-6 line-clamp-3 leading-relaxed">
                {note.content}
              </p>

              <div className="flex items-center justify-between text-gray-500 text-xs mt-auto">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <time>{formatDate(note.updated_at || note.created_at)}</time>
                </div>

                <button
                  onClick={(e) => handleDelete(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1"
                  title="Delete Note"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Editor */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-xl font-semibold text-green mb-6">
            {selectedNote ? "Edit Note" : "Create New Note"}
          </h2>

          <div className="flex flex-col gap-5 flex-1 min-h-0">
            <input
              type="text"
              placeholder="Enter note title..."
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              disabled={isLoading}
              className="bg-[#0f1118] border border-gray-800/80 focus:border-green/40 outline-none w-full p-4 rounded-lg text-white font-medium transition-colors"
            />

            <textarea
              placeholder="Write your operational findings here..."
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              disabled={isLoading}
              className="bg-[#0f1118] border border-gray-800/80 focus:border-green/40 outline-none w-full p-5 rounded-lg text-gray-300 flex-1 resize-none font-mono leading-relaxed transition-colors"
            />

            <div className="flex items-center justify-end gap-6 mt-4 pb-4">
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="text-white hover:text-gray-300 font-mono text-sm transition-colors cursor-pointer"
              >
                Clear / Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-[#4ade80] hover:bg-[#22c55e] text-black font-semibold px-6 py-2 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}