# SkillKart — Project Report Evidence & Implementation Document

**Purpose.** This is an evidence-based technical record for preparation of the IGNOU MCSP-232 final report. It was prepared from the repository source, configuration and Git history on 29 August 2026. Claims below describe code that exists, rather than feature-planning documents. “Not verified” means no confirming repository evidence was found.

## 1. Project overview

| Item | Verified finding |
|---|---|
| Approved title | **SkillKart** |
| Category | Web-based Learning Management System (LMS); separate React single-page client and Node.js REST API. |
| Purpose/problem | Enables instructors to author structured courses and learners to browse, enrol, consume lesson items, take quizzes, track progress, review courses and obtain/verify completion certificates. This addresses the need to organise learning content and learner progress in one system. |
| Target users | Students/learners, instructors, and administrators. |
| Main objectives | Secure account access; role-aware interface/API; course and curriculum management; published-course discovery; enrolment; lesson progress; quizzes; ratings/reviews; notifications; certificates and verification. |
| Current status | Core end-to-end features are implemented in code. Admin has authorization but no dedicated administration UI/API module. Payment processing, exports, formal tests, deployment manifests, and several planned enhancements are not implemented/verified. |

Evidence: `README.md`; `backend/src/server.ts`; `frontend/src/App.tsx`; `backend/src/models/*.ts`.

## 2. Actual technology stack

| Area | Technology and actual use |
|---|---|
| Frontend | React 19.2 with TypeScript. Vite 7 builds the SPA (`frontend/package.json`, `frontend/src/main.tsx`). |
| Routing/state | React Router DOM 7 browser routes (`frontend/src/App.tsx`). Authentication/session state is React Context, not Redux (`features/auth/AuthContext.tsx`). |
| UI/CSS | Tailwind CSS 4 through `@tailwindcss/vite`, Sass available and custom CSS/SCSS (`frontend/src/styles/`, `vite.config.ts`). React Toastify provides feedback. |
| Forms/API | Native React controlled forms; no dedicated form library. Axios instance with Bearer-token request interceptor (`frontend/src/lib/api.ts`). |
| OAuth | `@react-oauth/google` wraps the client; server calls Google UserInfo API using Axios (`main.tsx`, `controllers/auth/googleAuthController.ts`). |
| Backend | Node.js, Express 5.2, TypeScript; JSON REST-style endpoints mounted under `/api` (`backend/src/server.ts`). |
| Database | MongoDB through Mongoose 9.1.5. The connection string is `MONGO_URI`; no server version is declared (`config/db.ts`). |
| Auth/security libraries | `jsonwebtoken` JWTs, `bcryptjs` hashes, `cors`, `dotenv`, Zod 4 validation, Multer file upload, UUID certificate/file naming. |
| Development/build | npm package lockfiles; frontend Vite `dev/build/lint/preview`; backend `nodemon` + `tsx` development command. TypeScript configurations exist. No CI/CD/deployment manifest is present. |
| Testing/API testing | No test framework, test/spec files, Postman/Insomnia collection, or automated API tests found. |

Verification performed: `npm run build` in `frontend` completed successfully; `npx tsc --noEmit` in `backend` completed successfully. These compile/build checks are not functional test execution.

## 3. Architecture and request flow

SkillKart is a two-process client/server application with MongoDB persistence. The frontend calls the API with Axios. Controllers directly orchestrate Mongoose queries and business rules; there is no separate generic service layer (except controller-local shared helpers).

```text
Browser user
  ↓ React 19 SPA (React Router, AuthContext, Tailwind/Sass UI)
  ↓ Axios: VITE_API_BASE_URL + /api; Authorization: Bearer <JWT>
  ↓ Express 5 REST API
  ↓ protect → onboarding check → role authorization (where route applies)
  ↓ controller + Zod/manual validation + course-ownership/enrolment rules
  ↓ Mongoose schemas, indexes and MongoDB collections
  ↓ JSON response (and /uploads static files)
```

Authentication flow: register/login or Google client access token → API creates/finds user and signs a JWT → client stores `token` and a user record in `localStorage` → Axios injects the token → `protect` verifies it and re-resolves the user/role/onboarding state from MongoDB. The client fetches onboarding status when restoring its session. Evidence: `authController.ts`, `googleAuthController.ts`, `authMiddleware.ts`, `AuthContext.tsx`, `lib/api.ts`.

External integration verified: Google OAuth UserInfo endpoint. Local disk upload is served as `/uploads`; no cloud storage, mail/SMS, payment gateway, caching service, or deployment provider is verified.

## 4. User roles and authorization

| Role | Verified access | Restrictions/evidence |
|---|---|---|
| Student | Browse public courses; enrol/cancel; My Courses; learning/progress; quiz access/submit; review enrolled published courses; certificates; profile; notifications. | Course creation/curriculum mutation is route-restricted to instructor/admin. Review route explicitly requires student. `courseRoutes.ts:32-35`, `lessonRoutes.ts:11-18`. |
| Instructor | Instructor dashboard; own course create/edit/publish/archive/delete; own student lists; curriculum, lesson item and quiz authoring. | Ownership is checked with `isCourseManager`: own instructor ID or admin. Instructors cannot enrol in their own course (`enrollmentController.ts:37-39`). |
| Admin | Included in most instructor/admin route allowlists and passes `isCourseManager`. Can access protected learner routes in the client. | No dedicated admin dashboard route, user-management API, or separate admin UI exists. The User model admits the role but public registration/onboarding only allow student/instructor. |

Backend role check is `authorize(...roles)` in `middleware/roleMiddleware.ts:4-16`; course ownership helper is `controllers/course/shared.ts:6-8`. Client route hiding is supplementary only (`components/common/ProtectedRoute.tsx`).

## 5. Functional modules

| Module | Implementation and evidence | Status |
|---|---|---|
| Authentication/onboarding | Registration, login, Google login, JWT issuance, three-step role/profile/interests onboarding; role-aware protected routes. `authRoutes.ts`, `authController.ts`, `OnboardingPage.tsx`. | Implemented |
| User profile | Get/update current user; client Profile screen only updates name. `userRoutes.ts`, `userController.ts`, `Profile.tsx`. | Partial |
| Course management | Instructor/admin create/read/update/publish/unpublish/archive/delete, ownership checks, paid metadata, curriculum creation. `courseRoutes.ts`, `courseController.ts`, instructor pages. | Implemented |
| Course discovery | Public published listing, full-text query, level filter, popular/free sorting; detail/curriculum and ratings. `courseController.ts:75-195`, `CourseList.tsx`, `CourseDetailsPage.tsx`. | Implemented |
| Curriculum/content | Sections, lessons and lesson items; ordering, locks/prerequisite fields, video/text/PDF/link/code/quiz-block item types. Create/edit operations exist; no item update/delete endpoint. | Partial |
| Enrolment | Enrol/reactivate/list/get/cancel, student lists, progress summary. Paid courses do not invoke payment processing despite price fields. | Partial |
| Learning/progress | Lesson viewer, lesson progress records and enrolment summary; completion auto-issues certificate/notification. `LessonViewer.tsx`, `progressController.ts`. | Implemented |
| Quiz/assessment | Instructor saves/replaces one quiz per lesson; learner receives questions without answers and submits attempts. | Implemented |
| Reviews | Enrolled students create once/update; listing and aggregate rating. | Implemented |
| Certificates | Auto-issue on completion, manual claim, My Certificates, public verification view. Downloadable PDF is not implemented. | Implemented (PDF download not implemented) |
| Notifications | In-app notification creation/list/read/read-all and header bell. No email/push/realtime delivery. | Implemented (in-app only) |
| File uploads | Authenticated single JPEG/PNG/WEBP/PDF upload, 15 MB max, local `uploads/` storage. | Implemented |
| Dashboards/reporting | Instructor dashboard calculates course/student/completion counts; student My Courses cards. No general reporting, analytics export, or admin dashboard. | Partial |

## 6. Database design

MongoDB is non-relational. Relationships are implemented by `ObjectId` references and `populate`, plus application-side cascading deletes; Mongoose does not enforce referential integrity automatically.

| Collection | Fields (type; constraints/defaults) | Indexes/relationships |
|---|---|---|
| User | `name` String required trimmed; `email` String required unique lowercase; `password` String optional; `role` enum student/instructor/admin default student; `googleId`, `avatar` String optional; `onboardingCompleted` Boolean false; `bio` String max 500; `headline` String max 120; `interests` String[]; embedded `socialLinks` website/linkedin/twitter Strings; timestamps. | Unique email. Referenced by Course.instructor, Enrollment.student, Review.student, progress user, attempts user, notification recipient, certificate student. |
| Course | `title` String required trimmed 3–140; `description` required trimmed min 20; `thumbnailUrl` optional String; `level` enum beginner/intermediate/advanced default beginner; `isPaid` Boolean false; `price` Number min 0 default null; `status` enum draft/published/archived default draft; `publishedAt` Date; `instructor` required User ObjectId; timestamps. | text `{title,description}`, `{instructor,status}`; pre-save makes free price null and requires paid price. |
| Section | `course` required Course ObjectId; `title` required trimmed 2–140; `order` required Number min 1; `isLocked` Boolean false; optional self-reference `prerequisiteSection`; timestamps. | unique `{course,order}`. |
| Lesson | `section` required Section ObjectId; `title` required trimmed 3–160; `type` enum video/article/quiz/assignment default video; `order` required Number min 1; `durationMinutes` required Number min 0 default 0; `isPreview` false; `isMandatory` true; timestamps. | unique `{section,order}`. Note API validator uses `text`, `pdf`, `link`, which conflict with model enum; invalid values fail at model save. |
| LessonItem | `lesson` required Lesson ObjectId; `type` enum video/text/pdf/link/code/quiz_block; required Mixed `content` default `{}`; `order` required Number min 1; timestamps. | unique `{lesson,order}`. |
| Enrollment | `student` User ObjectId; `course` Course ObjectId; `status` enum active/completed/cancelled/expired/pending_payment default active; dates; `completedLessonIds` Lesson ObjectId[]; `totalLessonsCount` 0; `lastAccessedLessonId`; `paymentStatus` none/pending/paid/failed default none; optional paymentId; timestamps. | unique `{student,course}`; virtual completed count/progress percentage. |
| LessonProgress | user User ObjectId; lesson Lesson ObjectId; completed Boolean false; progressPercentage Number 0–100 default 0; dates; timestamps. | unique `{user,lesson}`. |
| Quiz | `lesson` Lesson ObjectId required unique; `questions` embedded array required min 1: question required trimmed String, options required String[] min 2, correctAnswer Number min 0; `passingPercentage` Number 0–100 default 60; timestamps. | unique lesson (one quiz per lesson). |
| QuizAttempt | user User ObjectId; lesson Lesson ObjectId; answers Number[]; score Number 0–100; passed required Boolean; timestamps. | Single-field indexes on user and lesson; attempts are retained. |
| Review | course Course ObjectId; student User ObjectId; rating required Number 1–5; comment required trimmed String 5–1000; timestamps. | unique `{course,student}`, `{course,createdAt:-1}`. |
| Certificate | student User, course Course, enrollment Enrollment ObjectIds; `certificateId` required unique 16-character uppercase UUID-derived String; `issuedAt` Date now; timestamps. | single indexes student/course; unique `{student,course}`. |
| Notification | recipient User ObjectId; title/message required String; `type` info/success/warning default info; optional link; `read` false; timestamps. | recipient index. |

One-to-many: User→Courses/Enrollments/etc.; Course→Sections/Enrollments/Reviews; Section→Lessons; Lesson→Items/Progress/Attempts. Many-to-many learner-course is represented by Enrollment. No schema migrations or seed data are present. Evidence: `backend/src/models/*.ts`.

## 7. API inventory

All API paths below are prefixed by `/api`; error cases generally include 400 invalid input/ID, 401 missing/invalid token, 403 authorization/enrolment/onboarding failure, 404 missing record, and 500 server error where applicable.

| Module | Method/path | Auth/role | Request and purpose/controller |
|---|---|---|---|
| Auth | POST `/auth/register` | Public | `{name,email,password,role?}`; validates, hashes password, creates student/instructor, returns JWT. `register` |
|  | POST `/auth/login` | Public | `{email,password}`; validates credentials, returns JWT. `login` |
|  | POST `/auth/google` | Public | `{access_token}`; obtains Google user info, creates/fetches user, returns JWT. `googleLogin` |
|  | GET `/auth/onboarding/status` | JWT | Gets current onboarding/user state. |
|  | POST `/auth/onboarding/complete` | JWT | headline min 3, ≥1 interest; role student/instructor and profile data. |
| Courses | GET `/courses?q=&level=&mine=true&sort=` | Optional JWT | Published catalog, or instructor-owned list for `mine=true`; query/level filters and computed rating/duration/enrolment count. |
|  | POST `/courses` | JWT, instructor/admin | title, description, URL thumbnail, level, paid/price → draft course. |
|  | GET `/courses/:courseId` | Optional JWT | Detail; unpublished only manager; lesson items only enrolled learner or manager. |
|  | PATCH `/courses/:courseId` | JWT, manager/admin | Whitelisted course fields. |
|  | PATCH `/courses/:courseId/publish` | JWT, manager/admin | Requires at least one section. |
|  | PATCH `/courses/:courseId/unpublish` | JWT, manager/admin | Changes to draft. |
|  | PATCH `/courses/:courseId/archive` | JWT, manager/admin | Archives course. |
|  | DELETE `/courses/:courseId` | JWT, manager/admin | Deletes course and associated sections, lessons, items, progress, enrolments, reviews. Does **not** delete Quiz, QuizAttempt, Certificate or Notification records. |
| Curriculum | POST `/courses/:courseId/sections` | JWT, manager/admin | title, optional order/lock/prerequisite; creates section. |
|  | PATCH/DELETE `/sections/:sectionId` | JWT, manager/admin | Whitelisted section update / cascades lessons, items and progress on deletion. |
|  | POST `/sections/:sectionId/lessons` | JWT, manager/admin | title/type/order/duration/preview/mandatory; creates lesson and synchronises enrolment lesson counts. |
|  | PATCH `/lessons/:lessonId` | JWT, manager/admin | Whitelisted lesson fields. |
|  | POST `/lessons/:lessonId/items` | JWT, manager/admin | item type/content/order; creates content item. |
|  | GET `/courses/:courseId/curriculum` | Optional JWT | Returns sections/lessons; unpublished only manager. |
| Enrolment | POST `/enrollments` | JWT + onboarding | `{courseId}`; only published, prevents own-instructor enrolment; creates/reactivates. No payment handling. |
|  | GET `/enrollments/me` and GET `/me/courses` | JWT + onboarding | Paginated own enrolments (`status,page,limit`) and populated course. |
|  | GET `/enrollments/:courseId/enrollment` | JWT + onboarding | Current user’s course enrolment. |
|  | PATCH `/enrollments/:id/progress` | JWT + onboarding | `{lessonId,completed}`; syncs Enrollment and LessonProgress and completion status. |
|  | DELETE `/enrollments/:id` | JWT + onboarding | Marks own enrolment cancelled. |
|  | GET `/courses/:courseId/students` | JWT, manager/admin | Paginated active/completed enrolled users. |
| Progress | POST `/lessons/:lessonId/progress` | JWT + onboarding; route allows all roles | `{completed?,progressPercentage?,lastWatchedAt?}`; requires active/completed enrolment, upserts progress, quiz gate, completion/certificate/notification. |
|  | GET `/me/courses/:courseId/progress` | JWT + onboarding | Current learner snapshot/completed IDs. |
| Quiz | POST `/lessons/:lessonId/quiz` | JWT, instructor/admin | questions/options/correct answers/passing percentage; creates/replaces quiz. **Missing ownership check** after finding lesson. |
|  | GET `/lessons/:lessonId/quiz` | JWT + onboarding | Quiz minus answers, plus latest attempt; does not enforce enrolment. |
|  | POST `/lessons/:lessonId/quiz/submit` | JWT + onboarding | `{answers}`; grades and stores attempt; does not enforce enrolment. |
| Review | GET `/courses/:courseId/reviews` | Public | Published course reviews/rating aggregate. |
|  | POST `/courses/:courseId/reviews` | JWT + onboarding, student | `{rating,comment}`; enrolled active/completed; one review. |
|  | PATCH `/courses/:courseId/reviews/me` | JWT + onboarding, student | Updates own enrolled-course review. |
| Certificates | GET `/certificates/verify/:certificateId` | Public | Verifies/populates certificate. |
|  | GET `/certificates/me` | JWT + onboarding | Current user certificates. |
|  | POST `/certificates/claim` | JWT + onboarding | `{courseId}`; only completed enrolment, returns/creates one certificate. |
| Notifications | GET `/notifications` | JWT | Current user max 50 and unread count. |
|  | PATCH `/notifications/read-all` | JWT | Marks all own unread records read. |
|  | PATCH `/notifications/:id/read` | JWT | Marks own notification read. |
| Profile/upload | GET/PUT `/users/me` | JWT | Get profile without password; update accepts name (body `bio` is read but ignored). |
|  | POST `/upload` | JWT | Multipart field `file`, JPEG/PNG/WEBP/PDF ≤15 MB; returns local URL. |

Routes/controllers: `backend/src/routes/*.ts`, `backend/src/controllers/**/*.ts`. An unused controller `controllers/course/enrollmentController.ts` contains functions not mounted by current routes; it is not counted as an API.

## 8. Authentication, security, validation and error handling

Implemented: bcrypt cost 10 password hash; signed JWT (7 days register/Google, 1 day password login); server-side token verification plus current-user database lookup; CORS limited to `CLIENT_URL` with credentials; role middleware; onboarding gate on many operations; Zod validation for register/login/course-create/section/lesson/item/enrolment/review; Mongoose field/enum/index validation; ObjectId checks; Multer MIME allowlist and file size cap. Sensitive password is omitted by profile endpoint.

Important limitations observed: tokens/user data are stored in `localStorage` (XSS exposure); no refresh/revocation/HTTP-only cookie mechanism; no rate limiter, Helmet/security headers, CSRF protection, global Express error middleware, password reset/email verification, sanitisation library, antivirus/content scan, or upload directory creation/configuration found. Error responses are controller-local and generally JSON `{message}`; `console.error` is used for some 500 paths. `frontend/src/main.tsx:9` logs the Google client ID to the console; do not describe this as a secret, but it is unnecessary output. Env values verified by code/docs: `MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`, `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`. Actual values were not inspected or recorded.

## 9. Frontend implementation

Application routes are in `frontend/src/App.tsx:27-57`: public Home, catalog, course detail, onboarding and certificate verification; protected learner routes for My Courses, learn, profile and certificates; instructor/admin routes for dashboard, course list/create/edit and student list. `OnboardingGuard` redirects an authenticated incomplete user to onboarding. `ProtectedRoute` checks local context role; API authorization remains server-enforced.

Major screens: Home (landing/auth entry), CourseList (search/level/sort/list), CourseDetailsPage (course/curriculum/enrol/reviews), student MyCourses and LessonViewer, Profile, MyCertificates/VerifyCertificatePage, OnboardingPage, instructor Dashboard/MyCourses/CreateCourse/EditCourse/StudentsEnrolled. Reusable elements include layout Header/Footer, Button/Input/Select/Modal, CourseCard/Rating/SearchBar, enrolment components, FileUpload, LessonQuiz and NotificationBell.

Axios is centralised in `lib/api.ts`; components use React state/effects and React Toastify for loading/error/success feedback. Responsive utility classes are used throughout. No Redux, React Query, form library, server-side rendering, accessibility audit, or automated frontend test evidence is present.

## 10. Backend implementation and key workflows

Folder responsibilities are supported by source: `routes` mount HTTP endpoints; `middleware` authenticates/authorizes/uploads; `validators` contain Zod schemas; `controllers` implement actions; `models` define schemas; `config/db.ts` connects MongoDB. `server.ts` mounts routes and static uploads.

Key workflow traces:

1. **Registration/login:** Auth modal → Axios `/auth/register` or `/auth/login` → Zod → bcrypt/create or compare → JWT → AuthContext/localStorage → subsequent Bearer headers.
2. **Course authoring/publishing:** Instructor create page → POST course → draft Course → section POST → lesson POST (updates `totalLessonsCount`) → item/quiz posts → publish validates at least one section → `status=published`.
3. **Enrolment:** Course detail enrol button → POST enrolments → published/ownership/duplicate checks → Enrollment and two Notifications → My Courses refresh. Paid metadata does not cause payment capture.
4. **Learning/progress:** LessonViewer fetches course + progress → learner selects/marks lesson → POST lesson progress → enrolled-course lookup, optional quiz-pass gate, `LessonProgress` upsert and Enrollment sync → all counted lessons complete causes status completed, Certificate upsert and Notification → UI refreshes progress.
5. **Quiz:** Instructor modal POSTs questions → Quiz upsert; learner GET receives answer-stripped questions → submit calculates score/passed and inserts QuizAttempt → progress endpoint requires latest attempt passed before completion.
6. **Review/certificate:** enrolled student posts review after Zod/duplicate checks; instructor notification created. On completion certificate is auto-created; certificate claim is idempotent; public verification looks up certificate ID.

## 11. Modelling/diagram inputs

**Context DFD actors:** Student, Instructor, Administrator, Google OAuth service. **System:** SkillKart. **Data stores:** User, Course, Section, Lesson, LessonItem, Enrollment, LessonProgress, Quiz, QuizAttempt, Review, Certificate, Notification collections; local uploaded-file store.

**Level 1 processes:** account/onboarding; course/catalog management; curriculum authoring; enrolment; learning/progress; quiz assessment; reviews; certificate verification; notifications; uploads. Use only the flows in section 10. Suitable ER diagram entities/relations are the ObjectId links in section 6. Use cases derive from section 4. Suggested sequence diagrams: login, publish course, enrol, update progress/certificate, submit quiz. States supported by code: Course `draft→published→draft/archived`; Enrollment `active↔completed`, `active→cancelled→active` on re-enrolment; Notification unread/read. Do not model payment state transitions as a working payment workflow.

## 12. SDLC, testing, performance and quality

The repository documents a feature-oriented development workflow and has Git commits labelled feature/fix; this supports an iterative/incremental development approach, not proof of a formal Agile/Scrum process. Evidence: `docs/DEVELOPMENT_WORKFLOW.md`, `git log` (recent commits include feature and bug-fix entries). Requirements/planning docs exist in `docs/features/`; they are not proof that planned features are complete.

No automated test files or test runner configuration were found, hence unit/integration/E2E/API test results and pass/fail evidence are **not verified**. Recommended manual cases for the report (do not claim executed): invalid/duplicate registration; login failures; role/ownership access denial; course draft→publish; duplicate/cancel/reactivate enrolment; quiz fail/pass completion gate; progress completion/certificate; review duplication; certificate verification; invalid/oversize upload.

Implemented optimisations: schema indexes listed in section 6; pagination for enrolment/student lists (max 50); notification list limit 50; MongoDB text search; course-card image lazy loading; selected `lean()` reads; parallel promises in selected controllers. Observed issues: course catalog enriches each course with separate duration/rating/enrolment queries (N+1 pattern); no catalog pagination; review list has no pagination; static upload and asset URL deployment details need configuration; cascades are manual/non-transactional; current course deletion leaves quiz/attempt/certificate/notification orphans; progress auto-completion counts all lessons rather than only mandatory lessons although one snapshot counts mandatory lessons; some endpoints lack ownership/enrolment checks noted in the API table.

## 13. Reports/outputs and deployment/execution

Verified outputs: public course catalog/search/filter/sort; course details/curriculum; learner My Courses/progress; instructor dashboard (course/student/completion figures calculated client-side); instructor student lists; in-app notifications; certificate list and verification screen. No CSV/PDF/report export, downloadable certificate PDF, data export, administrative reporting, or analytics export is implemented.

Prerequisites documented: Node.js 18+ recommended and MongoDB. Backend: `cd backend`, `npm install`, `npm run dev`; frontend: `cd frontend`, `npm install`, `npm run dev`; production client: `npm run build`; backend package `start` is `node src/server.js`, which is inconsistent with TypeScript source unless compiled JavaScript exists (not verified). Required variables are listed in section 8. No Dockerfile, Compose, hosting configuration, CI workflow, or production process manager was found.

## 14. Feature status matrix and synopsis comparison

No approved synopsis file was found by repository-wide search. The comparison below therefore uses the repository’s feature tracker (`docs/FEATURES.md`) as planning evidence, not as the approved IGNOU synopsis.

| Feature | Planned tracker status | Found in code | Evidence/status |
|---|---|---|---|
| Authentication/RBAC | Pending | Yes | Implemented; JWT/middleware/routes. |
| Student dashboard | Pending | Yes | Partial: My Courses/Lesson Viewer; no separate named dashboard route. |
| Instructor dashboard | Pending | Yes | Implemented. |
| Admin dashboard | Not Started | No | Not implemented. |
| Course/curriculum/browsing/enrolment | Pending | Yes | Implemented, with paid-course payment gap. |
| Learning/progress | Pending/Done | Yes | Implemented. |
| Quiz/reviews | Pending/Review | Yes | Implemented. |
| Certificates/notifications/file handling | Not Started | Yes | Implemented in code; tracker is stale relative to source. |
| Validation/security essentials | Pending | Yes | Partial: validation/auth/CORS/uploads exist; hardening gaps in section 8. |
| Wishlist, announcements, discussions, advanced search/analytics, notes/bookmarks, email notifications | Not Started | No | Not implemented. |
| Dark mode, tags, public instructor profile, streaks, recommendations, recently viewed, certificate PDF, audit log, bulk lesson upload, FAQ | Not Started | No | Not implemented. |

Technology/architecture differences from a synopsis: **Not verified** because no synopsis exists. Additional differences between tracker and code: tracker labels several source-implemented modules pending/not started; it should not be used alone as implementation status.

## 15. Screenshot and diagram checklist

Capture (using working data): Login/register modal; Google sign-in option; onboarding; public Home; Course catalog filters/search; course detail/curriculum/enrol; My Courses; Lesson Viewer/progress; quiz/pass/fail; review form/list; Profile; My Certificates; public certificate verification; notification bell/list; instructor dashboard; instructor course list; create course/curriculum builder; students enrolled. Admin dashboard and downloadable certificate must not be captured as implemented screens.

Required report diagrams: architecture diagram from section 3; context/Level 0 DFD; Level 1 DFD with section 11 processes; Level 2 for enrolment/progress or course authoring only; MongoDB ER/reference diagram; use-case diagram with three roles; class diagram from the 11 Mongoose models; activity diagrams for enrolment/progress; sequence diagrams for login, course publishing, quiz submission, progress/certificate; Course/Enrollment/Notification state diagrams; optional deployment diagram showing browser, frontend host, Express API, MongoDB, Google OAuth and local upload storage. Exclude unimplemented payment, email and admin-reporting components.

## 16. Executive summary and unverified information

SkillKart is a TypeScript MERN-style LMS with a React/Vite client, Express REST API and MongoDB/Mongoose models. It supports student/instructor/admin roles, browser-based authentication including Google access-token sign-in, onboarding, instructor-authored course structures, public published-course browsing, enrolment, item-based learning, progress tracking, quizzes, reviews, local file upload, in-app notifications and verifiable completion certificates. The code compiles/builds successfully in the inspected workspace. The strongest report evidence is the route/controller/model chain listed above.

Not verified from this repository: an approved IGNOU synopsis; deployed URL/environment; production MongoDB/version/data; actual users or screenshots; executed manual tests; automated tests/test reports; payment processing; email/push notifications; admin management UI; downloadable certificate PDF; performance measurements; security audit; deployment/CI/CD; data backup/recovery; accessibility testing; maintenance/support process. Do not claim these in the final report without separate evidence.

## 17. Static-inspection classification: evidence, uncertainty and rework signals

### Implemented and reasonably evident from code

- The mounted Express routes, Mongoose schemas/indexes, React routes, JWT middleware, role checks, Zod validators, and client-to-route Axios calls are present and internally traceable. See sections 4–10.
- The intended persistence path for course creation, curriculum records, enrolments, progress, reviews, quiz attempts, notifications and certificates is present in controllers and models.
- The frontend build and backend TypeScript type check completed in this workspace. This establishes build/type-check evidence only—not successful database, browser, API or user-workflow execution.

### Implemented but unverified at runtime

- MongoDB connection, actual CRUD persistence, static `/uploads` serving and upload-directory availability require a configured runtime environment and were not exercised.
- Password/JWT/role checks, Google sign-in, the `CLIENT_URL` CORS policy, certificate issuance/verification, quiz grading/progress gating, and notification delivery were inspected statically only.
- UI pages/components are present and call the stated API paths, but successful rendering with real data, responsive behaviour, browser compatibility and accessibility were not verified.

### Partially implemented or internally inconsistent

- The public profile API returns model fields, but `updateProfile` only saves `name`; it reads `bio` without saving it. The onboarding screen says profile data can be changed later, but the Profile screen exposes only name editing. Evidence: `backend/src/controllers/user/userController.ts:17-40`, `frontend/src/pages/Profile.tsx`.
- `Lesson.type` model values are `video/article/quiz/assignment`, while `createLessonSchema` accepts `video/text/quiz/pdf/link`. Requests using `text`, `pdf` or `link` pass Zod then fail Mongoose enum validation; `article`/`assignment` cannot pass the request validator. Evidence: `models/Lesson.ts:3,32-36`; `validators/content.validator.ts:25-32`.
- Course completion counts all lessons in `Enrollment.completedLessonIds`, while another progress snapshot counts only `isMandatory` lessons. The intended completion rule is therefore inconsistent. Evidence: `controllers/course/progressController.ts:39-63,152-190`.
- Section locking and prerequisite fields are stored but not enforced by the learner UI or progress/lesson-access backend flow. `checkEnrollment` middleware exists but is not mounted on the lesson-progress or quiz routes.
- Paid course fields and payment-status values exist, but enrolment sets `paymentStatus: "none"` and no payment route/provider/workflow exists.
- Curriculum API/UI supports creation and selected updates but no mounted lesson-item update/delete route; no mounted lesson delete route. Course/section deletion also does not delete associated Quiz, QuizAttempt, Certificate or Notification records.
- Quiz authoring only applies role middleware; `createOrReplaceQuiz` does not prove that the requesting instructor owns the course containing the lesson. Quiz read/submit also do not verify that the requester is enrolled.
- The `courses?mine=true` controller adds an instructor filter only for the `instructor` role; an admin request is not restricted to an owned/managed set.

### Placeholder-like or incomplete frontend material

- `frontend/src/pages/Onboarding.tsx` is an unreferenced, mock onboarding form: it logs data and explicitly labels its API action “Mock API call.” The routed page is `OnboardingPage.tsx`.
- `frontend/src/pages/Home.tsx` declares mock data; it is presentation content, not evidence of real course/company data.
- `frontend/src/components/layout/Footer.tsx` contains a TODO for newsletter subscription; no subscription endpoint exists.
- `frontend/src/components/common/CourseStructure.tsx` includes an “empty mock data” comment. Its actual use in the routed UI is not verified here.
- `NotificationBell.tsx` imports `@heroicons/react`, but it is not declared in `frontend/package.json`; `npm ls @heroicons/react --depth=0` reported no top-level package. The previously completed Vite build used the current workspace installation state, so a clean install may not reproduce that result unless the dependency is added or the import is replaced.
- Several request/response shapes use `any`, and duplicated/unused course-enrolment controller functions exist in `backend/src/controllers/course/enrollmentController.ts`; those functions are not mounted by the current route files.

### Missing from the current repository

- Dedicated admin dashboard/management flows; payment provider; email/push/realtime notifications; exports; certificate PDF generation/download; content discussion/comments; wishlist/bookmarks; audit logs; advanced search/analytics; course tags/FAQ/recommendations; automated tests; API collection; CI/CD and deployment configuration.

These are static-review findings, not proof that a defect will reproduce at runtime. They should be presented in the report as current MVP limitations or verification/rework items—not as completed capabilities.

## Appendix A–K quick summaries

- **A Technology:** React 19/Vite/Tailwind/Sass/Axios/React Router/React Context; Node/Express/TypeScript/MongoDB/Mongoose/Zod/JWT/bcrypt/Multer.
- **B Modules:** auth/onboarding, profile, courses/curriculum, catalog, enrolment, learning/progress, quizzes, reviews, certificates, notifications, upload, instructor reporting.
- **C Database:** 11 Mongoose models in section 6, with ObjectId references and indexes.
- **D API:** Complete mounted route inventory in section 7.
- **E Security:** JWT/bcrypt/CORS/Zod/RBAC/Multer implemented; hardening limitations in section 8.
- **F Testing:** frontend build and backend type check passed; no automated test suite found.
- **G Feature matrix:** section 14.
- **H Synopsis differences:** unavailable; only tracker-to-code differences documented.
- **I Screenshot checklist:** section 15.
- **J Diagram checklist:** section 15.
- **K Cannot verify:** final paragraph of section 16.
