import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  fetchLessonNotes,
  fetchCourseNotes,
  createLessonNote,
  updateNote,
  deleteNote,
  type NoteItem,
} from '../api/notes';

interface Props {
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  onNavigateLesson?: (lessonId: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LessonNotes({ courseId, lessonId, lessonTitle, onNavigateLesson }: Props) {
  const [viewMode, setViewMode] = useState<'lesson' | 'course'>('lesson');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      if (viewMode === 'lesson') {
        const data = await fetchLessonNotes(lessonId);
        setNotes(data);
      } else {
        const data = await fetchCourseNotes(courseId);
        setNotes(data);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [viewMode, lessonId, courseId]);

  useEffect(() => {
    loadNotes();
    setEditingId(null);
  }, [loadNotes]);

  const handleCreateNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      const newNote = await createLessonNote(lessonId, content.trim());
      setNotes((prev) => [newNote, ...prev]);
      setContent('');
      toast.success('Study note saved!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreateNote();
    }
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingId(note._id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim() || savingEdit) return;

    try {
      setSavingEdit(true);
      const updated = await updateNote(noteId, editContent.trim());
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, content: updated.content, updatedAt: updated.updatedAt } : n))
      );
      setEditingId(null);
      toast.success('Note updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update note');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      toast.success('Note deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete note');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & View Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📝 Personal Study Notes</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Personal notes are private to your account and help retain key concepts.
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('lesson')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'lesson'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Current Lesson
          </button>
          <button
            type="button"
            onClick={() => setViewMode('course')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'course'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Course Notes
          </button>
        </div>
      </div>

      {/* Note Creation Form (Always enabled for current lesson) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="new-note-text" className="text-sm font-semibold text-gray-800">
            Add a Note {lessonTitle && <span className="text-gray-400 font-normal">for {lessonTitle}</span>}
          </label>
          <span className="text-xs text-gray-400 font-mono">
            {content.length}/5,000
          </span>
        </div>

        <form onSubmit={handleCreateNote} className="space-y-3">
          <textarea
            id="new-note-text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your study notes, code snippets, or takeaways here... (Ctrl+Enter to save)"
            rows={3}
            maxLength={5000}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 hidden sm:inline">
              Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 border border-gray-200">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 border border-gray-200">Enter</kbd> to save quickly
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ml-auto"
            >
              {submitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>

      {/* Note List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse bg-white border border-gray-200 rounded-2xl p-6 h-28" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✏️
          </div>
          <h4 className="text-base font-bold text-gray-900 mb-1">
            {viewMode === 'lesson' ? 'No notes for this lesson yet' : 'No notes recorded in this course yet'}
          </h4>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Take notes while watching or reading lessons to reinforce your understanding.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const isEditing = editingId === note._id;
            const targetLesson = typeof note.lesson === 'object' ? note.lesson : null;

            return (
              <div
                key={note._id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {viewMode === 'course' && targetLesson && (
                      <button
                        type="button"
                        onClick={() => onNavigateLesson?.(targetLesson._id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <span>Lesson {targetLesson.order}: {targetLesson.title}</span>
                        <span>↗</span>
                      </button>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatDate(note.createdAt)}
                    </span>
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <span className="text-[10px] text-gray-400 italic">
                        (edited)
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(note)}
                        title="Edit note"
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note._id)}
                        title="Delete note"
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      maxLength={5000}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note._id)}
                        disabled={savingEdit || !editContent.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
