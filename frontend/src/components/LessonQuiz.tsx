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

interface QuestionResult {
  questionIndex: number;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

interface QuizData {
  questions: Question[];
  passingPercentage: number;
  latestAttempt: LatestAttempt | null;
  totalAttempts?: number;
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
  const [questionResults, setQuestionResults] = useState<QuestionResult[] | null>(null);
  const [attempts, setAttempts] = useState<number>(0);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setNoQuiz(false);
    try {
      const res = await api.get(`/lessons/${lessonId}/quiz`);
      const data: QuizData = res.data;
      setQuiz(data);
      setSelectedAnswers(new Array(data.questions.length).fill(-1));
      setAttempts(data.totalAttempts || 0);
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
    setResult(null);
    setQuestionResults(null);
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
      const { score, passed, passingPercentage, questionResults: qResults, totalAttempts: tAttempts } = res.data;
      setResult({ score, passed });
      setQuestionResults(qResults || null);
      if (typeof tAttempts === 'number') setAttempts(tAttempts);
      if (passed) {
        toast.success(`🎉 You passed with ${score}%!`);
        onQuizPassed?.();
      } else {
        toast.error(`You scored ${score}%. Need ${passingPercentage}% to pass. Review your answers below!`);
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
    setQuestionResults(null);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
  };

  if (loading) return null;
  if (noQuiz) return null;
  if (!quiz) return null;

  return (
    <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xs">
      <div className="bg-gray-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>⚡</span>
            <span>Lesson Assessment</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {quiz.questions.length} questions • Passing score: {quiz.passingPercentage}%
            {attempts > 0 && ` • Attempt #${attempts}`}
          </p>
        </div>
        {result && (
          <span
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 ${
              result.passed
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <span>{result.passed ? '✓' : '✕'}</span>
            <span>{result.passed ? `Passed • ${result.score}%` : `Score • ${result.score}%`}</span>
          </span>
        )}
      </div>

      <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-gray-800">
        {quiz.questions.map((q, qIdx) => {
          const qRes = questionResults?.find((r) => r.questionIndex === qIdx);
          return (
            <div key={qIdx} className="space-y-3.5 pb-6 border-b border-gray-100 dark:border-gray-700/60 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <p className="font-semibold text-gray-900 dark:text-white text-sm md:text-base leading-relaxed">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold mr-1.5">{qIdx + 1}.</span>
                  {q.question}
                </p>
                {qRes && (
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${
                    qRes.isCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}>
                    {qRes.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[qIdx] === oIdx;
                  const isCorrectOption = qRes && qRes.correctAnswer === oIdx;
                  const isWrongSelection = qRes && !qRes.isCorrect && isSelected;

                  let borderClass = 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-gray-700 dark:text-gray-300';
                  if (qRes) {
                    if (isCorrectOption) {
                      borderClass = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (isWrongSelection) {
                      borderClass = 'border-red-500 bg-red-50/70 dark:bg-red-900/20 text-red-900 dark:text-red-200 line-through';
                    }
                  } else if (isSelected) {
                    borderClass = 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 font-medium';
                  }

                  return (
                    <label
                      key={oIdx}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors text-sm ${borderClass} ${
                        result?.passed ? 'cursor-default' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`q-${qIdx}`}
                          value={oIdx}
                          checked={isSelected}
                          onChange={() => handleSelect(qIdx, oIdx)}
                          disabled={!!result?.passed}
                          className="accent-indigo-600"
                        />
                        <span>{opt}</span>
                      </div>
                      {isCorrectOption && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">Correct Answer</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-700">
          {!result?.passed && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? 'Evaluating...' : 'Submit Answers →'}
            </button>
          )}

          {result && !result.passed && (
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-colors"
            >
              🔄 Retake Quiz
            </button>
          )}

          {result?.passed && (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
              <span>🎉</span>
              <span>Quiz passed! You can now mark this lesson as completed.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LessonQuiz;
