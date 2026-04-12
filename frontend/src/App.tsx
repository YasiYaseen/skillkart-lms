import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout';
import { ProtectedRoute } from '@components/common';
import { CourseList, CourseDetailsPage } from '@pages/courses';
import { MyCourses as StudentMyCourses, LessonViewer } from '@features/student';
import OnboardingPage from '@pages/OnboardingPage';
import Home from '@pages/Home';
import { OnboardingGuard } from '@/components/OnboardingGuard';
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
            <OnboardingGuard>
                <Routes>
                    {/* Student / Main App Layout */}
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/courses" element={<CourseList />} />
                        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
                        <Route path="/onboarding" element={<OnboardingPage />} />

                        <Route element={<ProtectedRoute allowedRoles={['student', 'admin', 'instructor']} />}>
                            <Route path="/my-courses" element={<StudentMyCourses />} />
                            <Route path="/learn/:courseId" element={<LessonViewer />} />
                            <Route path="/learn/:courseId/:lessonId" element={<LessonViewer />} />
                        </Route>
                    </Route>

                    {/* Instructor Layout */}
                    <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
                        <Route element={<InstructorLayout />}>
                            <Route path="/instructor" element={<Dashboard />} />
                            <Route path="/instructor/courses" element={<MyCourses />} />
                            <Route path="/instructor/create-course" element={<CreateCourse />} />
                            <Route path="/instructor/students" element={<StudentsEnrolled />} />
                        </Route>
                    </Route>
                </Routes>
            </OnboardingGuard>
        </BrowserRouter>
    );
}

export default App;
