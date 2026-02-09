import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { CourseList } from './pages/courses';
import './styles/main.scss';

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
