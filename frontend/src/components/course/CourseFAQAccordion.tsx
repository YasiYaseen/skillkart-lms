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
      <div className="space-y-3 animate-pulse">
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <QuestionMarkCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq._id}
              className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-base font-semibold">{faq.question}</span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="p-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-700/60 whitespace-pre-line">
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
