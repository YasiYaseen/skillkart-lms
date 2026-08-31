import { useEffect, useState } from "react";
import { ChevronDownIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  order: number;
}

interface CourseFAQAccordionProps {
  courseId: string;
}

export default function CourseFAQAccordion({ courseId }: CourseFAQAccordionProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    async function loadFAQs() {
      try {
        setLoading(true);
        const res = await api.get(`/courses/${courseId}/faqs`);
        setFaqs(res.data.faqs || []);
      } catch (err) {
        console.error("Failed to load FAQs:", err);
      } finally {
        setLoading(false);
      }
    }
    if (courseId) {
      loadFAQs();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-2.5 animate-pulse">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 shadow-2xs border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-5">
        <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-2.5">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq._id}
              className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-3.5 text-left font-medium text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold">{faq.question}</span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="p-3.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs leading-relaxed border-t border-slate-100 dark:border-slate-800 whitespace-pre-line">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
