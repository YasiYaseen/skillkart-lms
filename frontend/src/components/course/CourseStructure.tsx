import React, { useState } from 'react';
import { ChevronDownIcon, PlayIcon } from '@heroicons/react/20/solid';

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
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Curriculum</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            {totalSections} section{totalSections !== 1 ? 's' : ''} • {totalLectures} lesson{totalLectures !== 1 ? 's' : ''} • {totalDuration} total length
          </p>
        </div>
        {sections.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 self-start sm:self-auto py-1 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 transition-colors cursor-pointer"
          >
            {allOpen ? 'Collapse all sections' : 'Expand all sections'}
          </button>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
        {sections.map((section, secIdx) => {
          const isOpen = openSections.includes(section.id);
          return (
            <div key={section.id} className="group">
              {/* Section Header */}
              <div
                className="bg-slate-50 dark:bg-slate-850 p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`transform transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
                    <ChevronDownIcon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Section {secIdx + 1}: {section.title.replace(/^Section\s*\d+\s*:\s*/i, '')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                  {section.lectureCount} lesson{section.lectureCount !== 1 ? 's' : ''} • {section.duration}
                </div>
              </div>

              {/* Section Content (Lectures) */}
              {isOpen && section.lectures.length > 0 && (
                <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {section.lectures.map((lecture, idx) => (
                    <div
                      key={idx}
                      className="p-3 pl-8 sm:pl-10 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlayIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                          {lecture.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {lecture.duration}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isOpen && section.lectures.length === 0 && (
                <div className="p-3.5 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-white dark:bg-slate-900">
                  No lessons in this section yet.
                </div>
              )}
            </div>
          );
        })}
        {sections.length === 0 && (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
            Curriculum content is being prepared by the instructor.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStructure;
