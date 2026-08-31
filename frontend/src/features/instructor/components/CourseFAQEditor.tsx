import React, { useState, useEffect, useCallback } from "react";
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/utils/errorUtils";

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  order: number;
}

interface CourseFAQEditorProps {
  courseId: string;
}

export default function CourseFAQEditor({ courseId }: CourseFAQEditorProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New FAQ form state
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit FAQ state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const loadFAQs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${courseId}/faqs`);
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error("Failed to load FAQs:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadFAQs();
    }
  }, [courseId, loadFAQs]);

  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Please fill in both question and answer");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/courses/${courseId}/faqs`, {
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
      });
      toast.success("FAQ added successfully");
      setFaqs((prev) => [...prev, res.data.faq]);
      setNewQuestion("");
      setNewAnswer("");
      setIsAdding(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to add FAQ"));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (faq: FAQItem) => {
    setEditingId(faq._id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const handleUpdateFAQ = async (faqId: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast.error("Question and answer cannot be empty");
      return;
    }

    try {
      const res = await api.patch(`/courses/${courseId}/faqs/${faqId}`, {
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
      });
      toast.success("FAQ updated");
      setFaqs((prev) => prev.map((f) => (f._id === faqId ? res.data.faq : f)));
      cancelEdit();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update FAQ"));
    }
  };

  const handleDeleteFAQ = async (faqId: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      await api.delete(`/courses/${courseId}/faqs/${faqId}`);
      toast.success("FAQ deleted");
      setFaqs((prev) => prev.filter((f) => f._id !== faqId));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete FAQ"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course FAQs</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Address common student questions about prerequisites, tools, or schedule.
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <PlusIcon className="w-4 h-4" /> Add FAQ
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddFAQ}
          className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50 space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. Do I need any prior programming experience?"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Provide a helpful and clear answer..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewQuestion("");
                setNewAnswer("");
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving..." : "Save FAQ"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-6 text-xs text-gray-400">Loading FAQs...</div>
      ) : faqs.length === 0 && !isAdding ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs">
          No FAQs created for this course yet. Click &quot;Add FAQ&quot; above to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isEditing = editingId === faq._id;
            if (isEditing) {
              return (
                <div
                  key={faq._id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-indigo-300 dark:border-indigo-600 space-y-3 shadow-sm"
                >
                  <input
                    type="text"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFAQ(faq._id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
                    >
                      <CheckIcon className="w-3.5 h-3.5" /> Update
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={faq._id}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {faq.question}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(faq)}
                    className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                    title="Edit FAQ"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFAQ(faq._id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    title="Delete FAQ"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
