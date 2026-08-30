import React, { useState } from 'react';

// Icons
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-500 dark:text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
  </svg>
);

interface Lecture {
  title: string;
  duration: string;
  items?: unknown[];
}

interface Section {
  id: string | number;
  title: string;
  lectureCount: number;
  duration: string;
  lectures: Lecture[];
}

interface CourseStructureProps {
  sections: Section[];
  totalSections: number;
  totalLectures: number;
  totalDuration: string;
}

const CourseStructure: React.FC<CourseStructureProps> = ({ sections, totalSections, totalLectures, totalDuration }) => {
  // Start with first section open by default
  const [openSections, setOpenSections] = useState<(string | number)[]>(() => {
    return sections.length > 0 ? [sections[0].id] : [];
  });

  const toggleSection = (id: string | number) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const allOpen = sections.length > 0 && sections.every((s) => openSections.includes(s.id));

  const toggleAll = () => {
    if (allOpen) {
      setOpenSections([]);
    } else {
      setOpenSections(sections.map((s) => s.id));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Curriculum</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
            {totalSections} section{totalSections !== 1 ? 's' : ''} • {totalLectures} lesson{totalLectures !== 1 ? 's' : ''} • {totalDuration} total length
          </p>
        </div>
        {sections.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 self-start sm:self-auto py-1 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 transition-colors"
          >
            {allOpen ? 'Collapse all sections' : 'Expand all sections'}
          </button>
        )}
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
        {sections.map((section, secIdx) => {
          const isOpen = openSections.includes(section.id);
          return (
            <div key={section.id} className="group">
              {/* Section Header */}
              <div
                className="bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors select-none"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                    Section {secIdx + 1}: {section.title}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {section.lectureCount} lesson{section.lectureCount !== 1 ? 's' : ''} • {section.duration}
                </div>
              </div>

              {/* Section Content (Lectures) */}
              {isOpen && section.lectures.length > 0 && (
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700/50">
                  {section.lectures.map((lecture, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 pl-10 md:pl-12 flex items-center justify-between hover:bg-gray-50/75 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <PlayIcon />
                        <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                          {lecture.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {lecture.duration}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isOpen && section.lectures.length === 0 && (
                <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs italic bg-white dark:bg-gray-800">
                  No lessons in this section yet.
                </div>
              )}
            </div>
          );
        })}
        {sections.length === 0 && (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
            Curriculum content is being prepared by the instructor.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStructure;
