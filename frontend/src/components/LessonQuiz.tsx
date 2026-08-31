import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/20/solid';

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
  passingPercentage: number;
  questions: Question[];
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
    try {
      setLoading(true);
      const res = await api.get(`/lessons/${lessonId}/quiz`);
      if (res.data.hasQuiz && res.data.quiz) {
        setQuiz(res.data.quiz);
        setNoQuiz(false);
        setSelectedAnswers(new Array(res.data.quiz.questions.length).fill(-1));
        if (res.data.latestAttempt) {
          setResult(res.data.latestAttempt);
        }
        if (typeof res.data.totalAttempts === 'number') {
          setAttempts(res.data.totalAttempts);
        }
      } else {
        setNoQuiz(true);
      }
    } catch {
      setNoQuiz(true);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleSelect = (qIdx: number, oIdx: number) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = oIdx;
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
        toast.success(`Assessment passed with ${score}%!`);
        onQuizPassed?.();
      } else {
        toast.error(`You scored ${score}%. Need ${passingPercentage}% to pass. Review your answers below.`);
      }
    } catch {
      toast.error('Failed to submit assessment');
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

  const answeredCount = selectedAnswers.filter((a) => a !== -1).length;
  const totalQuestions = quiz.questions.length;
  const answeredPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const correctCount = questionResults?.filter((r) => r.isCorrect).length ?? 0;

  return (
    <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-400" />
            <span>Lesson Assessment</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {quiz.questions.length} questions &bull; Passing score: {quiz.passingPercentage}%
            {attempts > 0 && ` &bull; Attempt #${attempts}`}
          </p>
        </div>
        {result && (
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1.5 ${
              result.passed
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {result.passed ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
            <span>{result.passed ? `Passed (${result.score}%)` : `Score (${result.score}%)`}</span>
          </span>
        )}
      </div>

      {/* Question Progress Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/40 px-5 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {result ? "Assessment Breakdown" : "Progress"}
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {result
              ? `${correctCount} of ${totalQuestions} Correct (${result.score}%)`
              : `${answeredCount} of ${totalQuestions} Answered (${answeredPercentage}%)`}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              result
                ? result.passed
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
                : 'bg-blue-600'
            }`}
            style={{
              width: `${result ? (correctCount / totalQuestions) * 100 : answeredPercentage}%`,
            }}
          />
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {quiz.questions.map((q, qIdx) => {
          const qRes = questionResults?.find((r) => r.questionIndex === qIdx);
          const isEvaluated = qRes !== undefined;

          return (
            <div
              key={qIdx}
              className={`p-4 rounded-lg border transition-all ${
                isEvaluated
                  ? qRes.isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  <span className="text-slate-400 font-normal mr-1.5">{qIdx + 1}.</span>
                  {q.question}
                </p>
                {isEvaluated && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 ${
                      qRes.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {qRes.isCorrect ? <CheckIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                    <span>{qRes.isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[qIdx] === oIdx;
                  const isCorrectOption = isEvaluated && qRes.correctAnswer === oIdx;
                  const isWrongSelection = isEvaluated && isSelected && !qRes.isCorrect;

                  let optStyles = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200';
                  if (isSelected && !isEvaluated) {
                    optStyles = 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-semibold';
                  } else if (isCorrectOption) {
                    optStyles = 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 font-semibold';
                  } else if (isWrongSelection) {
                    optStyles = 'border-rose-500 bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-100';
                  }

                  return (
                    <label
                      key={oIdx}
                      className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${optStyles}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name={`q-${qIdx}`}
                          value={oIdx}
                          checked={isSelected}
                          onChange={() => handleSelect(qIdx, oIdx)}
                          disabled={!!result?.passed}
                          className="accent-blue-600"
                        />
                        <span>{opt}</span>
                      </div>
                      {isCorrectOption && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">Correct Answer</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          {!result?.passed && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Evaluating...' : 'Submit Answers'}
            </button>
          )}

          {result && !result.passed && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </button>
          )}

          {result?.passed && (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Assessment completed successfully. You may continue to the next lesson.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LessonQuiz;
