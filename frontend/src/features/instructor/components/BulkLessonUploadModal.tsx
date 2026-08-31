import React, { useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon, ArrowUpTrayIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from 'sonner';
import { api } from "@/lib/api";
import { getErrorMessage } from "@/utils/errorUtils";

export interface BulkLessonDraft {
  title: string;
  type: "video" | "text" | "quiz" | "pdf" | "link";
  durationMinutes: number;
  isPreview: boolean;
  isMandatory: boolean;
}

interface BulkLessonUploadModalProps {
  sectionId: string;
  sectionTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkLessonUploadModal({
  sectionId,
  sectionTitle = "Section",
  isOpen,
  onClose,
  onSuccess,
}: BulkLessonUploadModalProps) {
  const [mode, setMode] = useState<"table" | "csv">("table");
  const [csvText, setCsvText] = useState("");
  const [lessons, setLessons] = useState<BulkLessonDraft[]>([
    { title: "", type: "video", durationMinutes: 10, isPreview: false, isMandatory: true },
    { title: "", type: "video", durationMinutes: 15, isPreview: false, isMandatory: true },
  ]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const addRow = () => {
    setLessons((prev) => [
      ...prev,
      { title: "", type: "video", durationMinutes: 10, isPreview: false, isMandatory: true },
    ]);
  };

  const removeRow = (index: number) => {
    setLessons((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = <K extends keyof BulkLessonDraft>(index: number, field: K, value: BulkLessonDraft[K]) => {
    setLessons((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const parseCsvText = () => {
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.warn("CSV input is empty");
      return;
    }

    const parsed: BulkLessonDraft[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 1 && parts[0]) {
        const title = parts[0];
        const typeRaw = parts[1]?.toLowerCase() as "video" | "text" | "quiz" | "pdf" | "link";
        const type = ["video", "text", "quiz", "pdf", "link"].includes(typeRaw) ? typeRaw : "video";
        const durationMinutes = Number(parts[2]) > 0 ? Number(parts[2]) : 10;
        const isPreview = parts[3]?.toLowerCase() === "true";

        parsed.push({
          title,
          type,
          durationMinutes,
          isPreview,
          isMandatory: true,
        });
      }
    }

    if (parsed.length === 0) {
      toast.warn("Could not parse any lessons from CSV format");
      return;
    }

    setLessons(parsed);
    setMode("table");
    toast.success(`Imported ${parsed.length} lessons into table`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validLessons = lessons.filter((l) => l.title.trim().length > 0);
    if (validLessons.length === 0) {
      toast.error("Please enter at least one valid lesson with a title");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/sections/${sectionId}/lessons/bulk`, {
        lessons: validLessons,
      });

      toast.success(res.data.message || `Successfully added ${validLessons.length} lessons`);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to bulk upload lessons"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowUpTrayIcon className="w-5 h-5 text-indigo-600" />
              Bulk Upload Lessons
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Section: <span className="font-semibold text-gray-700 dark:text-gray-300">{sectionTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/60">
          <button
            type="button"
            onClick={() => setMode("table")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              mode === "table"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Table Entry
          </button>
          <button
            type="button"
            onClick={() => setMode("csv")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              mode === "csv"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            CSV Quick Paste
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {mode === "csv" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Paste Lesson CSV lines (one lesson per line):
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Format: <code>Title, Type (video|text|quiz|pdf|link), Duration (mins), IsPreview (true|false)</code>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Introduction to Functions, video, 12, true\nAdvanced Closures, video, 20, false\nKnowledge Check 1, quiz, 10, false`}
                  rows={8}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={parseCsvText}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Parse & Populate Table
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2 min-w-[200px]">
                        Lesson Title <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2 px-2 min-w-[110px]">Type</th>
                      <th className="py-2 px-2 min-w-[90px]">Duration (m)</th>
                      <th className="py-2 px-2 text-center">Preview?</th>
                      <th className="py-2 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {lessons.map((lesson, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                        <td className="py-2.5 px-2 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateRow(idx, "title", e.target.value)}
                            placeholder="e.g. Setting up Environment"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <select
                            value={lesson.type}
                            onChange={(e) =>
                              updateRow(idx, "type", e.target.value as BulkLessonDraft["type"])
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white capitalize"
                          >
                            <option value="video">Video</option>
                            <option value="text">Article / Text</option>
                            <option value="quiz">Quiz</option>
                            <option value="pdf">PDF Document</option>
                            <option value="link">External Link</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            min="0"
                            max="600"
                            value={lesson.durationMinutes}
                            onChange={(e) =>
                              updateRow(idx, "durationMinutes", parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={lesson.isPreview}
                            onChange={(e) => updateRow(idx, "isPreview", e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            disabled={lessons.length <= 1}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 rounded transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4" /> Add Another Row
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {lessons.filter((l) => l.title.trim()).length} lessons ready to add
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || lessons.filter((l) => l.title.trim()).length === 0}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? "Uploading..." : "Add Lessons"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkLessonUploadModal;
