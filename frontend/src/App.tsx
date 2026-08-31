import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout';
import { ProtectedRoute } from '@components/common';
import { CourseList, CourseDetailsPage } from '@pages/courses';
import { MyCourses as StudentMyCourses, LessonViewer, NotesAndBookmarksPage } from '@features/student';
import OnboardingPage from '@pages/OnboardingPage';
import Home from '@pages/Home';
import Profile from '@pages/Profile';
import MyCertificatesPage from '@pages/MyCertificatesPage';
import VerifyCertificatePage from '@pages/VerifyCertificatePage';
import InstructorPublicProfile from '@pages/InstructorPublicProfile';
import ResetPasswordPage from '@pages/auth/ResetPasswordPage';
import CartPage from '@pages/CartPage';
import PurchaseHistoryPage from '@pages/PurchaseHistoryPage';
import { CartProvider } from '@/context/CartContext';
import { WishlistPage } from '@features/wishlist';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import {
    InstructorLayout,
    Dashboard,
    MyCourses,
    CreateCourse,
    EditCourse,
    StudentsEnrolled,
    Announcements,
    Analytics,
    Assignments,
    Coupons,
    EarningsAndPayouts,
} from '@features/instructor';
import {
    AdminLayout,
    AdminDashboard,
    UserManagement,
    CourseModeration,
    EnrollmentList,
    AuditLogs,
    FinancialReports,
    SystemSettings,
    CourseGenerator,
    CategoryManagement,
    AdminCoupons,
} from '@features/admin';

/**
 * App Component
 * Main application with routing setup
 */
function App() {
    return (
        <BrowserRouter>
            <CartProvider>
                <OnboardingGuard>
                    <Routes>
                        {/* Student / Main App Layout */}
                        <Route element={<Layout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/courses" element={<CourseList />} />
                            <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CartPage />} />
                            <Route path="/instructors/:instructorId" element={<InstructorPublicProfile />} />
                            <Route path="/onboarding" element={<OnboardingPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/certificates/verify/:certificateId" element={<VerifyCertificatePage />} />

                            <Route element={<ProtectedRoute allowedRoles={['student', 'admin', 'instructor']} />}>
                                <Route path="/my-courses" element={<StudentMyCourses />} />
                                <Route path="/wishlist" element={<WishlistPage />} />
                                <Route path="/purchase-history" element={<PurchaseHistoryPage />} />
                                <Route path="/study-hub" element={<NotesAndBookmarksPage />} />
                                <Route path="/my-notes" element={<NotesAndBookmarksPage />} />
                                <Route path="/my-bookmarks" element={<NotesAndBookmarksPage />} />
                                <Route path="/learn/:courseId" element={<LessonViewer />} />
                                <Route path="/learn/:courseId/:lessonId" element={<LessonViewer />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/my-certificates" element={<MyCertificatesPage />} />
                                <Route path="/certificates" element={<MyCertificatesPage />} />
                            </Route>
                        </Route>

                        {/* Instructor Layout */}
                        <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
                            <Route element={<InstructorLayout />}>
                                <Route path="/instructor" element={<Dashboard />} />
                                <Route path="/instructor/courses" element={<MyCourses />} />
                                <Route path="/instructor/create-course" element={<CreateCourse />} />
                                <Route path="/instructor/courses/:courseId/edit" element={<EditCourse />} />
                                <Route path="/instructor/students" element={<StudentsEnrolled />} />
                                <Route path="/instructor/announcements" element={<Announcements />} />
                                <Route path="/instructor/assignments" element={<Assignments />} />
                                <Route path="/instructor/coupons" element={<Coupons />} />
                                <Route path="/instructor/analytics" element={<Analytics />} />
                                <Route path="/instructor/earnings" element={<EarningsAndPayouts />} />
                            </Route>
                        </Route>


                    {/* Admin Layout */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<UserManagement />} />
                            <Route path="/admin/categories" element={<CategoryManagement />} />
                            <Route path="/admin/courses" element={<CourseModeration />} />
                            <Route path="/admin/enrollments" element={<EnrollmentList />} />
                            <Route path="/admin/reports" element={<FinancialReports />} />
                            <Route path="/admin/coupons" element={<AdminCoupons />} />
                            <Route path="/admin/audit-logs" element={<AuditLogs />} />
                            <Route path="/admin/settings" element={<SystemSettings />} />
                            <Route path="/admin/generator" element={<CourseGenerator />} />
                        </Route>
                    </Route>
                </Routes>
            </OnboardingGuard>
        </CartProvider>
    </BrowserRouter>
    );
}

export default App;
