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
import { DocumentTextIcon, PencilSquareIcon } from '@heroicons/react/20/solid';

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
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load notes';
      toast.error(msg);
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
      const newNote = await createLessonNote(courseId, lessonId, content.trim());
      setNotes((prev) => [newNote, ...prev]);
      setContent('');
      toast.success('Study note saved!');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save note';
      toast.error(msg);
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
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update note';
      toast.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      toast.success('Note deleted');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete note';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & View Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs transition-colors">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Personal Study Notes</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personal notes are private to your account and help retain key concepts.
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 self-start sm:self-auto border border-slate-200 dark:border-slate-750 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('lesson')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'lesson'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Current Lesson
          </button>
          <button
            type="button"
            onClick={() => setViewMode('course')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'course'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Course Notes
          </button>
        </div>
      </div>

      {/* Note Creation Form (Always enabled for current lesson) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="new-note-text" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Add a Note {lessonTitle && <span className="text-slate-400 font-normal">for {lessonTitle}</span>}
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {content.length}/5,000
          </span>
        </div>

        <form onSubmit={handleCreateNote} className="space-y-2.5">
          <textarea
            id="new-note-text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your study notes, code snippets, or takeaways here... (Ctrl+Enter to save)"
            rows={3}
            maxLength={5000}
            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Enter</kbd> to save quickly
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs ml-auto cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>

      {/* Note List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-24" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <PencilSquareIcon className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {viewMode === 'lesson' ? 'No notes for this lesson yet' : 'No notes recorded in this course yet'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Take notes while watching or reading lessons to reinforce your understanding.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isEditing = editingId === note._id;
            const targetLesson = typeof note.lesson === 'object' ? note.lesson : null;

            return (
              <div
                key={note._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {viewMode === 'course' && targetLesson && (
                      <button
                        type="button"
                        onClick={() => onNavigateLesson?.(targetLesson._id)}
                        className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                      >
                        <span>Lesson {targetLesson.order}: {targetLesson.title}</span>
                        <span>↗</span>
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {formatDate(note.createdAt)}
                    </span>
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <span className="text-[10px] text-slate-400 italic">
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
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note._id)}
                        title="Delete note"
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2.5">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      maxLength={5000}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note._id)}
                        disabled={savingEdit || !editContent.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
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

export default LessonNotes;
