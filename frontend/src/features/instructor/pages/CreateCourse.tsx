// Instructor - Add Course Page (static UI)
import { useState } from 'react';

function CreateCourse() {
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnail(URL.createObjectURL(file));
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Add Course</h1>

            <form className="max-w-xl space-y-6">
                {/* Course Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                    <input
                        type="text"
                        placeholder="Type here"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Course Heading */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Heading</label>
                    <input
                        type="text"
                        placeholder="Type here"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Course Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Description</label>
                    <textarea
                        rows={4}
                        placeholder="Type here"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Price & Thumbnail */}
                <div className="flex items-end gap-6 flex-wrap">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Price</label>
                        <input
                            type="number"
                            defaultValue={0}
                            className="w-28 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Course Thumbnail</label>
                        <label className="cursor-pointer flex items-center gap-2">
                            <span className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailChange}
                            />
                        </label>
                        {thumbnail && (
                            <img src={thumbnail} alt="Thumbnail preview" className="w-16 h-10 rounded object-cover border border-gray-200" />
                        )}
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="button"
                    className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                    ADD
                </button>
            </form>
        </div>
    );
}

export default CreateCourse;
