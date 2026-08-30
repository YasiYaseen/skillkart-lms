import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { Modal } from '@/components/common';

interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface QuizEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: string | null;
}

export function QuizEditorModal({ isOpen, onClose, lessonId }: QuizEditorModalProps) {
    const [questions, setQuestions] = useState<Question[]>([
        { question: '', options: ['', ''], correctAnswer: 0 }
    ]);
    const [passingPercentage, setPassingPercentage] = useState<number>(60);
    const [saving, setSaving] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);

    useEffect(() => {
        if (!isOpen || !lessonId) return;
        setLoadingExisting(true);
        api.get(`/lessons/${lessonId}/quiz`)
            .then((res) => {
                if (res.data?.questions && res.data.questions.length > 0) {
                    setQuestions(res.data.questions);
                    setPassingPercentage(res.data.passingPercentage ?? 60);
                } else {
                    setQuestions([{ question: '', options: ['', ''], correctAnswer: 0 }]);
                    setPassingPercentage(60);
                }
            })
            .catch(() => {
                // If 404 or no quiz yet, initialize fresh template
                setQuestions([{ question: '', options: ['', ''], correctAnswer: 0 }]);
                setPassingPercentage(60);
            })
            .finally(() => setLoadingExisting(false));
    }, [isOpen, lessonId]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: '', options: ['', ''], correctAnswer: 0 }]);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleQuestionChange = <K extends keyof Question>(index: number, field: K, value: Question[K]) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const updated = [...questions];
        updated[qIndex].options[oIndex] = value;
        setQuestions(updated);
    };

    const handleAddOption = (qIndex: number) => {
        const updated = [...questions];
        updated[qIndex].options.push('');
        setQuestions(updated);
    };

    const handleRemoveOption = (qIndex: number, oIndex: number) => {
        const updated = [...questions];
        updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
        if (updated[qIndex].correctAnswer >= updated[qIndex].options.length) {
            updated[qIndex].correctAnswer = 0;
        }
        setQuestions(updated);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lessonId) return;

        // Validation
        if (questions.length === 0) {
            toast.warn('Add at least one question');
            return;
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) {
                toast.warn(`Question ${i + 1} is empty`);
                return;
            }
            if (q.options.length < 2) {
                toast.warn(`Question ${i + 1} needs at least 2 options`);
                return;
            }
            for (let j = 0; j < q.options.length; j++) {
                if (!q.options[j].trim()) {
                    toast.warn(`Option ${j + 1} in Question ${i + 1} is empty`);
                    return;
                }
            }
        }

        setSaving(true);
        try {
            await api.post(`/lessons/${lessonId}/quiz`, {
                questions,
                passingPercentage,
            });
            toast.success('Quiz saved successfully');
            
            // Reset state
            setQuestions([{ question: '', options: ['', ''], correctAnswer: 0 }]);
            setPassingPercentage(60);
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save quiz';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Quiz">
            {loadingExisting ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-500">Loading quiz questions...</span>
                </div>
            ) : (
            <form onSubmit={handleSave} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                
                {/* Passing Percentage */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Passing Percentage (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={passingPercentage}
                        onChange={(e) => setPassingPercentage(Number(e.target.value))}
                        className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-6">
                    {questions.map((q, qIdx) => (
                        <div key={qIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-800">Question {qIdx + 1}</h4>
                                {questions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(qIdx)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove Question
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Enter your question"
                                    required
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Options (Select correct answer using radio button)
                                    </label>
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`correct-${qIdx}`}
                                                checked={q.correctAnswer === oIdx}
                                                onChange={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                                                className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder={`Option ${oIdx + 1}`}
                                                required
                                                value={opt}
                                                onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            {q.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOption(qIdx, oIdx)}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                    title="Remove Option"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {q.options.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => handleAddOption(qIdx)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-2"
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        + Add Another Question
                    </button>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Quiz'}
                        </button>
                    </div>
                </div>
            </form>
            )}
        </Modal>
    );
}
