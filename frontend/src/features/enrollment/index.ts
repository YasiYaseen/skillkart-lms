/**
 * Enrollment Feature Module
 *
 * Provides enrollment state management, UI components, and API integration
 * for the SkillKart learning platform's enrollment system.
 */

// Components
export { EnrollButton } from './components/EnrollButton';
export { ProgressBar } from './components/ProgressBar';
export { EnrollmentCard } from './components/EnrollmentCard';
export type { EnrollmentCardProps } from './components/EnrollmentCard';

// Hooks
export { useEnrollment } from './hooks/useEnrollment';
export type { IEnrollment, EnrollmentStatus } from './hooks/useEnrollment';

// Service
export { enrollmentService } from './services/enrollmentService';
