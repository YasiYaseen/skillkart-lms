import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout';
import { CourseList, CourseDetailsPage } from '@pages/courses';
import Onboarding from '@pages/Onboarding';

/**
 * App Component
 * Main application with routing setup
 */
function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    {/* Course Routes */}
                    <Route path="/" element={<CourseList />} />
                    <Route path="/courses" element={<CourseList />} />
                    <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
                    <Route path="/onboarding" element={<Onboarding />} />

                    {/* Placeholder routes for future modules */}
                    {/* Student routes will go under /student/* */}
                    {/* Instructor routes will go under /instructor/* */}
                    {/* Admin routes will go under /admin/* */}
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
