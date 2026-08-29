# SkillKart — Database Implementation Audit

**Scope and method.** This audit records the current repository state, including uncommitted source files visible during inspection. It is based on the 11 Mongoose model files in `backend/src/models/` and database usage in controllers/middleware. No database connection, migration, seed data, or runtime CRUD workflow was executed. Therefore, schema declarations and intended persistence operations are verified from code; actual database contents and successfully created physical indexes are not verified.

**Collection naming.** No schema passes a `{ collection: ... }` option and no model calls `model()` with an explicit collection name. The collection names below are Mongoose's default derived plural names, verified against the installed Mongoose pluralizer. They must not be described as explicitly configured collection names in the report.

Every top-level model has Mongoose's default `_id: ObjectId` unless noted. All top-level schemas use `{ timestamps: true }`, so `createdAt` and `updatedAt` are stored timestamp fields created/maintained by Mongoose. The embedded `QuestionSchema` sets `{ _id: false }` and does not have timestamps.

## 1. Model-by-model schema audit

### 1.1 `User` model

- **Model / default collection:** `User` / `users`.
- **Schema source:** `backend/src/models/User.ts:24-48`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/other schema options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | default top-level document identifier | none |
| `name` | String | Yes | none | `trim: true` | scalar |
| `email` | String | Yes | none | `unique: true`, `lowercase: true`; no `trim`, regex/email validator, `minlength`, or `maxlength` in schema | scalar |
| `password` | String | No | none | no schema validation | scalar; password hash is assigned by the registration controller, not by schema middleware |
| `role` | String | No | `"student"` | enum `student`, `instructor`, `admin` | scalar |
| `googleId` | String | No | none | none | scalar |
| `avatar` | String | No | none | none | scalar |
| `onboardingCompleted` | Boolean | No | `false` | none | scalar |
| `bio` | String | No | none | `maxlength: 500` | scalar |
| `headline` | String | No | none | `maxlength: 120` | scalar |
| `interests` | Array of String | No | no explicit `default` option | no element validation | array, not a reference |
| `socialLinks.website` | String | No | none | none | nested object path |
| `socialLinks.linkedin` | String | No | none | none | nested object path |
| `socialLinks.twitter` | String | No | none | none | nested object path |
| `isActive` | Boolean | No | `true` | none | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** `email` has a field-level unique index. `unique` requests an index; it is not itself an application-level validator. No explicit ordinary/compound/text index is declared. `User` is referenced by several other models, but it stores no reverse-reference arrays.

**Database-related controller rules:** registration checks `findOne({ email })`, hashes `password` before `User.create`, and restricts registration role to student/instructor (`controllers/auth/authController.ts:16-36`). Google login creates a user with `password: ""` (`googleAuthController.ts:22-31`). Onboarding updates profile fields and can set only student/instructor role. `authMiddleware.ts:28-33` reads `isActive` and refuses authentication when it is `false`. The admin controller can update `isActive`; it does not validate that the request body value is Boolean (`controllers/admin/adminController.ts:38-55`).

### 1.2 `Course` model

- **Model / default collection:** `Course` / `courses`.
- **Schema source:** `backend/src/models/Course.ts:22-89`.
- **Middleware:** pre-`save` hook `normalizePaidPricing`; no post hooks or virtuals.

| Exact field | Type | Required | Explicit default | Validation/other schema options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `title` | String | Yes | none | `trim`, `minlength: 3`, `maxlength: 140` | scalar |
| `description` | String | Yes | none | `trim`, `minlength: 20` | scalar |
| `price` | Number | No | `null` | `min: 0` | scalar/null |
| `thumbnailUrl` | String | No | none | `trim: true`; no URL validator at schema layer | scalar |
| `level` | String | Yes | `"beginner"` | enum `beginner`, `intermediate`, `advanced` | scalar |
| `isPaid` | Boolean | Yes | `false` | none | scalar |
| `status` | String | No | `"draft"` | enum `draft`, `published`, `archived` | scalar |
| `publishedAt` | Date | No | none | none | scalar |
| `instructor` | ObjectId | Yes | none | `ref: "User"`, `index: true` | N:1 reference to `User` |
| `isActive` | Boolean | No | `true` | none | scalar |
| `isApproved` | Boolean | No | `true` | none | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** field index `{ instructor: 1 }`; explicit text index `{ title: "text", description: "text" }`; compound non-unique index `{ instructor: 1, status: 1 }`. The overlapping instructor field index and compound index are both declared.

**Schema business rule:** before every `.save()`, if `isPaid` is true and `price` is `null` or `undefined`, `this.invalidate("price", "price is required when isPaid is true")` is called. If `isPaid` is false, the hook forces `price = null`. It does **not** require a strictly positive price; the controller separately rejects `price <= 0` on creation. `isActive` and `isApproved` are changed by the admin controller, but normal course listing, enrollment, and publication code filters/checks `status`, not these two fields. They are therefore stored flags whose system-wide effect is not consistently enforced.

### 1.3 `Section` model

- **Model / default collection:** `Section` / `sections`.
- **Schema source:** `backend/src/models/Section.ts:13-47`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `course` | ObjectId | Yes | none | `ref: "Course"`, `index: true` | N:1 to `Course` |
| `title` | String | Yes | none | `trim`, min 2, max 140 | scalar |
| `order` | Number | Yes | none | `min: 1` | ordering value |
| `isLocked` | Boolean | No | `false` | none | scalar |
| `prerequisiteSection` | ObjectId | No | none | `ref: "Section"` | optional self-reference |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** field index `{ course: 1 }`; unique compound `{ course: 1, order: 1 }`. The section-creation controller checks a supplied `prerequisiteSectionId` belongs to the same course, but the schema does not enforce this relationship. `isLocked` and `prerequisiteSection` are stored only; no database constraint enforces access sequencing.

### 1.4 `Lesson` model

- **Model / default collection:** `Lesson` / `lessons`.
- **Schema source:** `backend/src/models/Lesson.ts:17-63`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `section` | ObjectId | Yes | none | `ref: "Section"`, `index: true` | N:1 to `Section` |
| `title` | String | Yes | none | `trim`, min 3, max 160 | scalar |
| `type` | String | Yes | `"video"` | enum `video`, `article`, `quiz`, `assignment` | scalar |
| `order` | Number | Yes | none | `min: 1` | ordering value |
| `durationMinutes` | Number | Yes | `0` | `min: 0` | scalar |
| `isPreview` | Boolean | No | `false` | none | scalar |
| `isMandatory` | Boolean | No | `true` | none | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** field index `{ section: 1 }`; unique compound `{ section: 1, order: 1 }`. **Inconsistency:** the request Zod validator permits `video`, `text`, `quiz`, `pdf`, `link`, whereas this schema permits `video`, `article`, `quiz`, `assignment`. The report should state the model enum exactly; it must not list the validator values as stored Lesson values.

### 1.5 `LessonItem` model

- **Model / default collection:** `LessonItem` / `lessonitems`.
- **Schema source:** `backend/src/models/LessonItem.ts:14-43`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `lesson` | ObjectId | Yes | none | `ref: "Lesson"`, `index: true` | N:1 to `Lesson` |
| `type` | String | Yes | none | enum `video`, `text`, `pdf`, `link`, `code`, `quiz_block` | scalar |
| `content` | `Schema.Types.Mixed` | Yes | `{}` | no shape/content-type validation in schema | arbitrary object/value; implemented TypeScript interface says `Record<string, unknown>` |
| `order` | Number | Yes | none | `min: 1` | ordering value |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** field index `{ lesson: 1 }`; unique compound `{ lesson: 1, order: 1 }`. The API Zod schema additionally rejects an empty object for `content`, but MongoDB/Mongoose schema itself permits its default empty object. This is a related content record, not an embedded Lesson array.

### 1.6 `Enrollment` model

- **Model / default collection:** `Enrollment` / `enrollments`.
- **Schema source:** `backend/src/models/Enrollment.ts:28-65`.
- **Virtuals:** `completedLessonsCount`, `progressPercentage`; no hooks.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `student` | ObjectId | Yes | none | `ref: "User"`, `index: true` | N:1 to `User`; comment says name retained for backwards compatibility |
| `course` | ObjectId | Yes | none | `ref: "Course"`, `index: true` | N:1 to `Course` |
| `status` | String | No | `"active"` | enum `active`, `completed`, `cancelled`, `expired`, `pending_payment` | scalar |
| `enrolledAt` | Date | No | `Date.now` | none | scalar |
| `completedAt` | Date | No | none | none | scalar |
| `expiresAt` | Date | No | none | none | scalar |
| `completedLessonIds` | ObjectId array | No | no explicit `default` option | each element `ref: "Lesson"` | denormalised reference array |
| `totalLessonsCount` | Number | No | `0` | none | denormalised count |
| `lastAccessedLessonId` | ObjectId | No | none | `ref: "Lesson"` | last lesson reference |
| `paymentStatus` | String | No | `"none"` | enum `none`, `pending`, `paid`, `failed` | scalar |
| `paymentId` | String | No | none | none | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Virtual/computed fields (not stored):** `completedLessonsCount` returns `completedLessonIds.length`; `progressPercentage` returns 0 if `totalLessonsCount` is 0, otherwise `Math.round(completedLessonIds.length / totalLessonsCount * 100)`. These are only included in responses where the controller calls `toJSON({ virtuals: true })`; do **not** place them in a report table as stored MongoDB fields.

**Indexes/constraints:** field indexes `{ student: 1 }`, `{ course: 1 }`; unique compound `{ student: 1, course: 1 }`. This prevents more than one enrollment document per user/course pair. Enrollment is both the N:M bridge between User and Course and a progress/payment-status record. Controllers synchronize `completedLessonIds`, `totalLessonsCount`, `lastAccessedLessonId` and a separate `LessonProgress` collection; this duplicates progress data.

### 1.7 `LessonProgress` model

- **Model / default collection:** `LessonProgress` / `lessonprogresses`.
- **Schema source:** `backend/src/models/LessonProgress.ts:14-50`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `user` | ObjectId | Yes | none | `ref: "User"`, `index: true` | N:1 to `User` |
| `lesson` | ObjectId | Yes | none | `ref: "Lesson"`, `index: true` | N:1 to `Lesson` |
| `completed` | Boolean | No | `false` | none | scalar |
| `progressPercentage` | Number | No | `0` | min 0, max 100 | scalar |
| `lastWatchedAt` | Date | No | none | none | scalar |
| `completedAt` | Date | No | none | none | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** field indexes `{ user: 1 }`, `{ lesson: 1 }`; unique compound `{ user: 1, lesson: 1 }`. This creates at most one progress document per user/lesson. It is upserted by both `controllers/enrollment/enrollmentController.ts:262-274` and `controllers/course/progressController.ts:127-138`, which can create consistency risk because they calculate/completion-update differently.

### 1.8 `Quiz` model and embedded `QuestionSchema`

- **Model / default collection:** `Quiz` / `quizzes`.
- **Schema source:** `backend/src/models/Quiz.ts:17-50`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `lesson` | ObjectId | Yes | none | `ref: "Lesson"`, `unique: true`, `index: true` | 0..1 Quiz per Lesson |
| `questions` | Array of embedded `QuestionSchema` | Yes | none | custom validator requires length ≥1 | embedded, not a `Question` collection |
| `questions.question` | String | Yes | none | `trim: true` | embedded field |
| `questions.options` | String array | Yes | none | custom validator requires array length ≥2 | embedded field |
| `questions.correctAnswer` | Number | Yes | none | `min: 0`; schema does not enforce `< options.length` | embedded field |
| `passingPercentage` | Number | No | `60` | min 0, max 100 | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

`QuestionSchema` has `_id: false`; questions have no individual stored ObjectId. The quiz controller additionally validates `correctAnswer < q.options.length`, but this bound is not a schema rule.

**Indexes/constraints:** `lesson` declares both `unique: true` and `index: true`; effectively the intent is a unique single-field lesson index. No compound/text index is declared.

### 1.9 `QuizAttempt` model

- **Model / default collection:** `QuizAttempt` / `quizattempts`.
- **Schema source:** `backend/src/models/QuizAttempt.ts:13-45`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `user` | ObjectId | Yes | none | `ref: "User"`, `index: true` | N:1 to `User` |
| `lesson` | ObjectId | Yes | none | `ref: "Lesson"`, `index: true` | N:1 to `Lesson` |
| `answers` | Number array | Yes | none | no array-length or answer-range schema validation | stored submitted values |
| `score` | Number | Yes | none | min 0, max 100 | stored calculated score |
| `passed` | Boolean | Yes | none | none | stored calculated flag |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** normal field indexes `{ user: 1 }`, `{ lesson: 1 }`; no unique/compound index. One user may have multiple attempts at the same lesson. The `submitQuiz` controller computes and stores `score`/`passed`; those fields are not virtual.

### 1.10 `Review` model

- **Model / default collection:** `Review` / `reviews`.
- **Schema source:** `backend/src/models/Review.ts:12-25`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `course` | ObjectId | Yes | none | `ref: "Course"`, `index: true` | N:1 to `Course` |
| `student` | ObjectId | Yes | none | `ref: "User"`, `index: true` | N:1 to `User` |
| `rating` | Number | Yes | none | min 1, max 5 | scalar |
| `comment` | String | Yes | none | `trim`, min 5, max 1000 | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** normal field indexes `{ course: 1 }`, `{ student: 1 }`; unique compound `{ course: 1, student: 1 }`; non-unique compound `{ course: 1, createdAt: -1 }`. It represents the user-course review association and limits it to one review per pair. Average rating/review count are aggregation results in controllers, not stored Course fields.

### 1.11 `Certificate` model

- **Model / default collection:** `Certificate` / `certificates`.
- **Schema source:** `backend/src/models/Certificate.ts:14-33`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `student` | ObjectId | Yes | none | `ref: "User"`, `index: true` | N:1 to `User` |
| `course` | ObjectId | Yes | none | `ref: "Course"`, `index: true` | N:1 to `Course` |
| `enrollment` | ObjectId | Yes | none | `ref: "Enrollment"` | N:1 to specific Enrollment |
| `certificateId` | String | Yes | function default | `unique: true` | default uses UUID v4, removes hyphens, first 16 chars, uppercases |
| `issuedAt` | Date | No | `Date.now` | none | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** normal field indexes `{ student: 1 }`, `{ course: 1 }`; field unique index on `certificateId`; unique compound `{ student: 1, course: 1 }`. The compound constraint ensures one certificate per student/course, independently of `enrollment`; a cancelled/re-enrolled user cannot receive a second certificate for the same course. Certificate records are created through an upsert in the progress controller or idempotently claimed after an Enrollment has status `completed`.

### 1.12 `Notification` model

- **Model / default collection:** `Notification` / `notifications`.
- **Schema source:** `backend/src/models/Notification.ts:14-26`.
- **Hooks/virtuals:** none declared.

| Exact field | Type | Required | Explicit default | Validation/options | Reference or structure |
|---|---|---:|---|---|---|
| `_id` | ObjectId | generated | Mongoose generated | document identifier | none |
| `recipient` | ObjectId | Yes | none | `ref: "User"`, `index: true` | N:1 to `User` |
| `title` | String | Yes | none | no length/trim rule | scalar |
| `message` | String | Yes | none | no length/trim rule | scalar |
| `type` | String | No | `"info"` | enum `info`, `success`, `warning` | scalar |
| `link` | String | No | none | no URL/path validation | scalar |
| `read` | Boolean | No | `false` | none | scalar |
| `createdAt`, `updatedAt` | Date | automatic | timestamps option | Mongoose-managed | scalar |

**Indexes/constraints:** normal field index `{ recipient: 1 }`; no unique, compound, text index, hook, or virtual. Notifications are created during enrollment/reactivation, review, and completion workflows. They are persisted records, not external email/push messages.

## 2. Relationship audit

All cross-model associations use referenced ObjectIds; no top-level model embeds its child collection. MongoDB itself does not enforce existence of a referenced document. `populate()` in controllers resolves selected references for responses.

| Source field | Target | Relationship | Actual MongoDB representation |
|---|---|---|---|
| `Course.instructor` | `User` | Course N:1 User; User 1:N Course | single ObjectId with `ref: "User"`; no reverse course array |
| `Section.course` | `Course` | Section N:1 Course; Course 1:N Section | single ObjectId; sections retrieved by query |
| `Section.prerequisiteSection` | `Section` | optional recursive N:1 | single self-referencing ObjectId; no cycle/schema constraint |
| `Lesson.section` | `Section` | Lesson N:1 Section; Section 1:N Lesson | single ObjectId |
| `LessonItem.lesson` | `Lesson` | Item N:1 Lesson; Lesson 1:N Item | single ObjectId; items queried separately |
| `Enrollment.student` + `Enrollment.course` | `User`, `Course` | User N:M Course through Enrollment; one Enrollment per pair | two ObjectIds plus unique compound index; enrollment stores state/progress/payment fields |
| `Enrollment.completedLessonIds` | `Lesson` | Enrollment 1:N completed lessons | array of Lesson ObjectIds; denormalised progress summary |
| `Enrollment.lastAccessedLessonId` | `Lesson` | Enrollment N:1 last lesson | single ObjectId |
| `LessonProgress.user` + `LessonProgress.lesson` | `User`, `Lesson` | User N:M Lesson progress records; one record per pair | two ObjectIds plus unique compound index |
| `Quiz.lesson` | `Lesson` | Lesson 1:0..1 Quiz | ObjectId with unique single-field constraint |
| `Quiz.questions` | embedded question values | Quiz 1:N questions | embedded subdocuments, `_id: false`, not a separate model/collection |
| `QuizAttempt.user` + `QuizAttempt.lesson` | `User`, `Lesson` | User 1:N attempts; Lesson 1:N attempts | two ObjectIds; no pair uniqueness, so repeated attempts allowed |
| `Review.course` + `Review.student` | `Course`, `User` | Course/User N:M review relation, constrained to 0..1 review per pair | two ObjectIds plus unique compound index |
| `Certificate.student`, `Certificate.course`, `Certificate.enrollment` | `User`, `Course`, `Enrollment` | Certificate belongs to one user/course/enrollment; max one per user/course | three ObjectIds; unique certificateId plus unique student/course pair |
| `Notification.recipient` | `User` | User 1:N notifications | single ObjectId |

## 3. Index, constraint, computed-field and denormalisation inventory

### Unique indexes

| Model | Declared index/field |
|---|---|
| `User` | `email` (`unique: true`) |
| `Enrollment` | `{ student: 1, course: 1 }` |
| `Lesson` | `{ section: 1, order: 1 }` |
| `LessonItem` | `{ lesson: 1, order: 1 }` |
| `LessonProgress` | `{ user: 1, lesson: 1 }` |
| `Quiz` | `lesson` (`unique: true`) |
| `Review` | `{ course: 1, student: 1 }` |
| `Certificate` | `certificateId` (`unique: true`) and `{ student: 1, course: 1 }` |
| `Section` | `{ course: 1, order: 1 }` |

### Normal non-unique indexes

`Course.instructor`; `Certificate.student`, `Certificate.course`; `Enrollment.student`, `Enrollment.course`; `Lesson.section`; `LessonItem.lesson`; `LessonProgress.user`, `LessonProgress.lesson`; `Notification.recipient`; `QuizAttempt.user`, `QuizAttempt.lesson`; `Review.course`, `Review.student`; `Section.course`; and explicit compounds `{ Course.instructor: 1, status: 1 }` and `{ Review.course: 1, createdAt: -1 }`. Some fields are covered by both a single-field and compound index as declared.

### Text index

Only `Course` declares a text index: `{ title: "text", description: "text" }`. `getCourses` uses it for `$text: { $search: q }`. No other full-text index is declared.

### Computed rather than stored

- `Enrollment.completedLessonsCount` — count of stored `completedLessonIds`.
- `Enrollment.progressPercentage` — rounded formula using stored `completedLessonIds` and `totalLessonsCount`.
- Course list/detail `durationMinutes`, `averageRating`, `reviewCount`, `enrollmentCount` are controller-calculated response values, not Course schema fields.
- Progress controller response `totalMandatoryLessons`, `completedMandatoryLessons`, `completionPercentage` is query-calculated, not stored.
- Quiz `score` and `passed` are **stored** on `QuizAttempt`, not computed virtual fields.

### Denormalisation/redundancy and constraint risks

- Lesson completion is represented twice: per-lesson `LessonProgress` documents and `Enrollment.completedLessonIds` / `totalLessonsCount` / `lastAccessedLessonId`. Controllers attempt synchronization, but MongoDB transactions are not used.
- The current completion-status transition uses `completedLessonIds.length >= totalLessonsCount` (all counted lessons), while `getCourseProgressSnapshot` counts only `isMandatory: true` lessons. The two calculations can disagree.
- `Course.isActive` and `Course.isApproved` are newly stored/admin-updatable flags but catalogue, enrollment and publication controllers use `status`; their effect is not consistently enforced.
- `Enrollment.paymentStatus`/`paymentId` are persisted but there is no payment service/controller/provider in the repository.
- Course/section deletion manually removes selected descendants. The deletion code does not delete `Quiz`, `QuizAttempt`, `Certificate` or `Notification` documents associated with that course/its lessons; references can become orphaned.
- `Section.isLocked` and `prerequisiteSection` are stored but static inspection found no database-level or mounted-route enforcement of prerequisite/lock access.
- ObjectId refs provide a model relationship and enable `populate`, but they do not provide relational foreign-key enforcement or automatic cascade behavior.

## 4. Database usage in controllers/services

There is no separate backend `services/` directory; controllers perform database actions directly. `controllers/course/shared.ts` is a helper module.

| Area | Actual database behavior |
|---|---|
| Authentication/onboarding/admin | Finds/creates/updates `User`; active-user gate reads `isActive`; admin counts, lists, toggles users; admin writes `Course.isActive`/`isApproved`. |
| Courses/curriculum | Creates/updates Course, Section, Lesson, LessonItem; computes rating by `Review.aggregate`; finds child records by ObjectId; publication checks only for existence of a Section; deletion uses multiple independent `deleteMany`/`deleteOne` calls. |
| Enrollment/progress | Creates/reuses Enrollment; calculates `totalLessonsCount` from lesson queries; paginates Enrollment; uses `$addToSet`/`$pull` in one route and document mutation in another; upserts LessonProgress. |
| Quiz/reviews | Quiz is `findOneAndUpdate(..., { upsert: true })`; QuizAttempt is append-only `create`; Review aggregates calculate rating and unique course/student prevents duplicate persisted reviews. |
| Certificates/notifications | Certificate claim checks completed Enrollment then creates or returns one; completion uses `findOneAndUpdate` `$setOnInsert`; Notification records are created/read/updated directly. |

No code uses Mongoose transactions/sessions, schema migration tooling, database-level JSON schema validation, soft-delete fields (except the unrelated active flags), TTL indexes, geospatial indexes, or database seeding. None should be claimed in Chapters 7 or 8.

## 5. REPORT CONSISTENCY CHECK

**Availability of Chapters 7 and 8:** No separately identifiable Chapter 7/Chapter 8 report files were found in the repository. The check below therefore compares the database-related claims in the existing `SKILLKART_PROJECT_REPORT_EVIDENCE.md` against the **current** source tree. Any wording in your external academic report that differs cannot be marked claim-by-claim until those chapters are supplied.

| Existing report claim/location | Result | Current source-based correction |
|---|---|---|
| Section 6 says the project has “11 Mongoose models.” | CORRECT | Current tree has 11 top-level models; `QuestionSchema` is embedded and not a model/collection. |
| Section 6 `User` fields list ends at `socialLinks` plus timestamps. | INCORRECT | Add stored Boolean `isActive` with default `true` (`models/User.ts:45`). |
| Section 6 `Course` fields list ends at `instructor` plus timestamps. | INCORRECT | Add stored Boolean `isActive` default `true` and `isApproved` default `true` (`models/Course.ts:71-72`). |
| Section 6 says `Course` uses text `{title, description}` and `{instructor,status}` indexes. | CORRECT | It should also list the field index on `instructor`. |
| Section 6 says `Enrollment.completedLessonsCount` and `Enrollment.progressPercentage` are virtuals. | CORRECT | They are computed/non-stored fields; they appear only when virtuals are enabled in serialization. |
| Section 6 describes `Quiz.questions` as embedded. | CORRECT | Questions use `QuestionSchema` with `_id: false`; no `Question` collection exists. |
| Section 6 says MongoDB references use ObjectIds and application-side cascading deletes. | PARTIALLY CORRECT | ObjectId refs are correct. Cascades are manual and incomplete; course/section deletion leaves some dependent documents. |
| Section 6 lists `Lesson.type` enum as `video`, `article`, `quiz`, `assignment`. | CORRECT | Do not replace it with API validator values `text`, `pdf`, `link`. |
| Section 6 describes `totalLessonsCount` / `completedLessonIds` as stored Enrollment data. | CORRECT | These are persisted fields, not virtuals; they duplicate LessonProgress state. |
| Section 6 omits User/Course active/approval flags and their admin writes. | INCORRECT | Include them and explain static enforcement limitation. |
| Section 8 says active/inactive authorization is not present. | INCORRECT if stated | Current `authMiddleware` rejects `user.isActive === false`; this source is presently uncommitted. |
| Section 13/14 says no user-management API or admin database actions exist. | INCORRECT if stated | Current uncommitted `adminRoutes.ts`/`adminController.ts` expose admin counts, user status, course status and enrollment list actions. Runtime availability is still unverified until these files are committed/deployed. |
| Any claim that relationships are foreign keys, relational joins, or automatic cascades. | INCORRECT | Use “ObjectId references with Mongoose `populate` and controller-side queries”; MongoDB foreign keys/automatic cascades are not implemented. |
| Any claim that `Enrollment.progressPercentage`, `completedLessonsCount`, course `averageRating`, `reviewCount`, `durationMinutes`, or `enrollmentCount` are stored fields. | INCORRECT | They are computed virtual/controller response values as detailed in section 3. |
| Any claim that `Question` is a separate collection/model. | INCORRECT | It is the embedded `QuestionSchema`, with `_id: false`. |
| Any claim about actual collection contents, physical indexes in production, migrations, backup, or executed database tests. | NOT VERIFIABLE FROM CODE | No runtime database inspection or test evidence was supplied. |

## 6. RECOMMENDED CORRECTIONS

Apply these exact changes to Chapters 7 and 8 (or equivalent database-design tables) if they do not already contain them:

1. **Collection-name wording:** replace “collection explicitly named …” with: “The model does not set an explicit collection option; Mongoose derives the default collection name (`users`, `courses`, `sections`, `lessons`, `lessonitems`, `lessonprogresses`, `quizzes`, `quizattempts`, `reviews`, `certificates`, `notifications`).”
2. **User table:** add `isActive | Boolean | optional | default true | no enum/validation | used by auth middleware to reject inactive users`. Keep the exact camelCase spelling.
3. **Course table:** add `isActive | Boolean | optional | default true` and `isApproved | Boolean | optional | default true`. Add: “Current admin code can update these flags; normal catalogue/enrollment/publication logic is not shown enforcing them.”
4. **Course constraints:** state exact pre-save wording: “If `isPaid` is true and `price` is `null`/`undefined`, the pre-save hook invalidates `price`; if `isPaid` is false, the hook sets `price` to `null`.” Do not state price must be positive at schema level.
5. **Lesson table:** set `type` enum to exactly `video`, `article`, `quiz`, `assignment`. Add a note that the request validator has conflicting values; do not report `text`, `pdf` or `link` as valid stored Lesson values.
6. **Enrollment table:** keep `completedLessonIds`, `totalLessonsCount`, `lastAccessedLessonId`, `paymentStatus`, and `paymentId` as stored fields. Put `completedLessonsCount` and `progressPercentage` in a separate **virtual/computed fields** row, not the stored-field table.
7. **Quiz/Question table:** write “`questions` is an embedded array; `QuestionSchema` has `{ _id: false }`; there is no Question model or collection.” State schema `correctAnswer` is only min 0; the option-index upper bound is controller validation.
8. **Relationship diagram/table:** depict `Enrollment` as the User–Course N:M bridge with unique `{ student, course }`; depict `LessonProgress` as User–Lesson N:M progress with unique `{ user, lesson }`; depict Quiz–Question as embedded 1:N, not a collection relationship.
9. **Indexes table:** include every unique compound index from section 3 and the Course full-text index. Label `unique` declarations as unique indexes, not generic “unique validation.” Include `Review { course: 1, createdAt: -1 }` and `Course { instructor: 1, status: 1 }` as normal compound indexes.
10. **Cascade/consistency wording:** replace any “automatic cascade delete/referential integrity” statement with: “Controllers issue selected manual delete queries; no MongoDB foreign keys, transactions, or automatic cascade middleware are implemented. Some related quiz, attempt, certificate and notification records are not removed by the current course/section deletion code.”
11. **Payment wording:** state “payment-status fields are stored, but no payment service/provider/transaction flow is implemented in this repository.” Do not call payments implemented.
12. **Status/lock wording:** state “`Course.status` is operationally checked; `Course.isActive`, `Course.isApproved`, `Section.isLocked`, and `Section.prerequisiteSection` are stored fields/relationships whose full runtime enforcement is not established by static inspection.”

## 7. What cannot be verified from source alone

- Existence/names/data of actual MongoDB collections in a deployed database; collection names above are Mongoose defaults.
- Successful physical creation of declared indexes in a particular database instance.
- Current deployed schema versus the present working tree, particularly the uncommitted User/Course active/approval and admin additions.
- Real referential consistency, orphan records, migrations, backups, replication, sharding, database permissions, performance, or test execution.
- Whether external Chapters 7 and 8 contain claims beyond the existing evidence document; provide their text/files for a literal claim-by-claim comparison.
