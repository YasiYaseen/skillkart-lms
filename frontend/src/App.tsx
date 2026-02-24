import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout';
import { CourseList, CourseDetailsPage } from '@pages/courses';
import Onboarding from '@pages/Onboarding';
import Home from '@pages/Home';
import {
    InstructorLayout,
    Dashboard,
    MyCourses,
    CreateCourse,
    StudentsEnrolled,
} from '@features/instructor';

/**
 * App Component
 * Main application with routing setup
 */
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Student / Main App Layout */}
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/courses" element={<CourseList />} />
                    <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                </Route>

                {/* Instructor Layout */}
                <Route element={<InstructorLayout />}>
                    <Route path="/instructor" element={<Dashboard />} />
                    <Route path="/instructor/courses" element={<MyCourses />} />
                    <Route path="/instructor/create-course" element={<CreateCourse />} />
                    <Route path="/instructor/students" element={<StudentsEnrolled />} />
                </Route>

                </Routes>

        </BrowserRouter>
    );
}

export default App;
