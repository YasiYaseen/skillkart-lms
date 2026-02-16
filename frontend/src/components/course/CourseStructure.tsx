import { useState } from "react";

interface Lecture {
  title: string;
  duration: string;
}

interface Section {
  id: number;
  title: string;
  lectureCount: number;
  duration: string;
  lectures: Lecture[];
}

interface Props {
  sections: Section[];
  totalSections: number;
  totalLectures: number;
  totalDuration: string;
}

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
    </svg>
);



function CourseStructure({
  sections,
  totalSections,
  totalLectures,
  totalDuration,
}: Props) {
  const [openSections, setOpenSections] = useState<number[]>([]);

    const toggleSection = (id: number) => {
        console.log(id)
        setOpenSections(prev =>
            prev.includes(id)
            ? prev.filter(sectionId => sectionId !== id)
            : [...prev, id]
        );
    };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Course Structure
      </h2>

      <p className="text-gray-500 text-sm mb-6">
        {totalSections} sections • {totalLectures} lectures • {totalDuration} total duration
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
        {sections.map(section => {
          const isOpen = openSections.includes(section.id);

          return (
            <div key={section.id}>
              {/* Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full bg-gray-50 p-4 flex items-center justify-between hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                 
                  <span
                    className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    >
                    <ChevronDownIcon />
                    </span>

                  <span className="font-semibold text-gray-800">
                    {section.title}
                  </span>
                </div>

                <span className="text-sm text-gray-500">
                  {section.lectureCount} lectures • {section.duration}
                </span>
              </button>

              {/* Content */}
              {isOpen && section.lectures.length > 0 && (
                <div className="bg-white">
                  {section.lectures.map((lecture, idx) => (
                    <div
                      key={idx}
                      className="p-3 pl-10 flex items-center justify-between hover:bg-gray-50"
                    >
                    <div className="flex item-centre gap-3">
                      <PlayIcon />
                      <span className="text-gray-700 text-sm">
                        {lecture.title}
                      </span>
                    </div>

                      <span className="text-sm text-gray-500">
                        {lecture.duration}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourseStructure;
