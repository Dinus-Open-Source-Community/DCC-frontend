import React, { useState, useEffect } from "react";
import axios from "axios";
import NoteCard from "./components/NoteCard";
import NoteForm from "./components/NoteForm";


const API_BASE_URL = "/api/notes";
const axiosInstance = axios.create({
  withCredentials: true,
});

type Note = {
  id: string;
  title: string;
  content: string;
  date: string;
  created_at?: string;
};

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const fetchNotes = async () => {
    try {
      const response = await axiosInstance.get(API_BASE_URL);
      const fetchedNotes = Array.isArray(response.data) ? response.data.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        date: n.created_at ? new Date(n.created_at).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }).replace('.', ':') : new Date().toLocaleString('id-ID')
      })) : [];
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSave = async (title: string, content: string) => {
    const formattedTitle = title.trim() ? title.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ") : "";
    try {
      if (editingNote) {
        await axiosInstance.put(`${API_BASE_URL}/${editingNote.id}`, {
          title: formattedTitle,
          content
        });
        setNotes(notes.map(n => n.id === editingNote.id ? { ...n, title: formattedTitle, content } : n));
      } else {
        const response = await axiosInstance.post(API_BASE_URL, {
          title: formattedTitle,
          content
        });
        const newNote = response.data;
        const noteDate = newNote.created_at 
          ? new Date(newNote.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', ':')
          : new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', ':');
        
        setNotes([{
          id: newNote.id || Date.now().toString(),
          title: newNote.title || formattedTitle,
          content: newNote.content || content,
          date: noteDate
        }, ...notes]);
      }
      setEditingNote(null);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`${API_BASE_URL}/${id}`);
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return (
    <div className="flex flex-col px-6 md:px-8 py-8 w-full h-[calc(100vh-1px)] overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between w-full border-b border-green mb-9">

        <h1 className="text-2xl sm:text-3xl font-semibold text-green pb-5">
          Notes
          <span className="inline-block w-3 h-3 rounded-full bg-green ml-2 animate-pulse"></span>
        </h1>
      </div>

      {/* MAIN LAYOUT (Dua Kolom) */}
      <div className="flex gap-10 flex-1 min-h-0">

        {/* KOLOM KIRI: HISTORY NOTE */}
        <div className="bg-black rounded-[10px] w-1/3 flex flex-col p-5 border border-green/30 min-h-0 overflow-hidden">

          <div className="flex-1 w-full rounded-md pr-4 overflow-y-auto custom-scrollbar pb-10">
  <div className="space-y-4">
    {notes.length === 0 ? (
      <p className="text-white/30 italic">No notes yet...</p>
    ) : (
      notes.map(note => (
        <NoteCard
          key={note.id}
          title={note.title}
          content={note.content}
          date={note.date}
          isActive={editingNote?.id === note.id}
          onDelete={() => handleDelete(note.id)}
          onEdit={() => setEditingNote(note)}
        />
      ))
    )}
  </div>
</div>
        </div>

        {/* KOLOM KANAN: CREATE/EDIT FORM */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <NoteForm
            onSave={handleSave}
            onCancel={() => setEditingNote(null)}
            isEditing={!!editingNote}
            initialTitle={editingNote?.title}
            initialContent={editingNote?.content}
          />
        </div>

      </div>
    </div>
  );
}