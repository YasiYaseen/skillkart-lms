Read the synopsis
folder Structure for Backend
Design basic Database
Choose between template or  a good design
Database models basic
Authentication
Backend basic
Frontend Design
Then start feature Implementations


# SkillKart – Feature Scope

## Overview
SkillKart is a MERN-based Learning Management System (LMS) designed to help instructors
create and manage self-paced online courses, and enable students to enroll, learn, and
track their progress.

This document defines the functional scope of the project.

---

## Core Features (Must-Have)

### 1. User & Role Management
- User registration and login
- Role-based access:
  - Student
  - Instructor
  - Admin
- Access rules:
  - Students cannot create courses
  - Instructors cannot manage users
  - Admin oversees all system operations

---

### 2. Course Management (Instructor)
- Create, edit, and delete courses
- Publish and unpublish courses
- Assign categories
- Upload course content (video links, PDFs, text)

Note: Course content is self-paced. Live streaming is not supported.

---

### 3. Lesson Structure
- Courses contain multiple lessons
- Each lesson includes:
  - Title
  - Content (URL or text)
  - Display order

---

### 4. Enrollment System (Student)
- Browse available courses
- Enroll in courses
- Maintain student–course relationships

---

### 5. Progress Tracking
- Track completed lessons
- Display course completion percentage
- Mark courses as completed

---

### 6. Admin Controls
- View all users
- View all courses
- Enable or disable users and courses

---

## Optional Features (Good-to-Have)

- Course ratings (1–5 stars)
- Course reviews and comments
- Instructor dashboard statistics:
  - Total enrollments
  - Number of students
- Course search and filtering:
  - By category
  - By title

---

## Out of Scope
- Live virtual classrooms
- Real-time chat
- Payment gateway integration
- Mobile application
