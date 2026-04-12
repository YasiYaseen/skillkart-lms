import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

interface Question {
  question: string;
  options: string[];
}

interface LatestAttempt {
  score: number;
  passed: boolean;
}

interface QuizData {
  questions: Question[];
  passingPercentage: number;
  latestAttempt: LatestAttempt | null;
}

interface LessonQuizProps {
  lessonId: string;
  onQuizPassed?: () => void;
}

export function LessonQuiz({ lessonId, onQuizPassed }: LessonQuizProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noQuiz, setNoQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LatestAttempt | null>(null);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setNoQuiz(false);
    try {
      const res = await api.get(`/lessons/${lessonId}/quiz`);
      const data: QuizData = res.data;
      setQuiz(data);
      setSelectedAnswers(new Array(data.questions.length).fill(-1));
      if (data.latestAttempt) setResult(data.latestAttempt);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNoQuiz(true);
      } else {
        toast.error('Failed to load quiz');
      }
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchQuiz();
    // Reset result when lesson changes
    setResult(null);
  }, [fetchQuiz]);

  const handleSelect = (qIndex: number, oIndex: number) => {
    if (result?.passed) return;
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = oIndex;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    if (selectedAnswers.some((a) => a === -1)) {
      toast.warn('Please answer all questions before submitting');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/lessons/${lessonId}/quiz/submit`, {
        answers: selectedAnswers,
      });
      const { score, passed, passingPercentage } = res.data;
      setResult({ score, passed });
      if (passed) {
        toast.success(`You passed with ${score}%!`);
        onQuizPassed?.();
      } else {
        toast.error(`You scored ${score}%. Need ${passingPercentage}% to pass. Try again!`);
      }
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (!quiz) return;
    setResult(null);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
  };

  if (loading) return null;
  if (noQuiz) return null;
  if (!quiz) return null;

  return (
    <div className="mt-8 border border-gray-200 rounded-2xl overflow-hidden">
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Lesson Quiz</h2>
        {result && (
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              result.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {result.passed ? `Passed - ${result.score}%` : `Failed - ${result.score}%`}
          </span>
        )}
      </div>

      <div className="p-6 space-y-6 bg-white">
        {quiz.questions.map((q, qIdx) => (
          <div key={qIdx} className="space-y-3">
            <p className="font-semibold text-gray-800">
              {qIdx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[qIdx] === oIdx;
                return (
                  <label
                    key={oIdx}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    } ${result?.passed ? 'cursor-default' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`q-${qIdx}`}
                      value={oIdx}
                      checked={isSelected}
                      onChange={() => handleSelect(qIdx, oIdx)}
                      disabled={!!result?.passed}
                      className="accent-blue-600"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-2 flex items-center gap-4">
          {!result?.passed && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}

          {result && !result.passed && (
            <button
              onClick={handleRetry}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Try Again
            </button>
          )}

          {result?.passed && (
            <p className="text-green-700 font-medium text-sm">
              Quiz passed - you can now mark this lesson complete
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
