# SkillKart – Learning Platform

SkillKart is a comprehensive learning platform that manages courses, sections, lessons, quizzes, enrollments, and user progress. 

This repository contains both the frontend (React + Vite) and backend (Node.js + Express).

---

## Tech Stack

### Backend
- **Core:** Node.js + Express
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Validation:** Zod
- **Auth:** JWT + bcryptjs
- **Dev Tools:** nodemon, tsx

### Frontend
- **Core:** React + Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS v4 + Sass
- **Routing:** React Router 7
- **Auth:** Google OAuth (@react-oauth/google)
- **API Client:** Axios

---

## Core Features

### 1. Course Management
- Create, update, delete, and fetch courses.
- Course status management (draft / published / archived).

### 2. Content Organization
- **Sections:** Groups of lessons within a course.
- **Lessons:** Video, text, or file-based learning content.
- **Quizzes:** Assessment items associated with courses.

### 3. Enrollment System
- Enroll users in courses.
- Track active enrollments.

### 4. Learning Progress System (Critical)
- Track completion of individual lesson items.
- Real-time progress percentage calculation.
- Resume functionality (last accessed item).

---

## Project Structure

```text
/
├── backend/            # Express API
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # Express routes
│   │   ├── middleware/  # Auth & validation
│   │   └── server.ts    # Entrance point
│   └── package.json
│
├── frontend/           # React App
│   ├── src/
│   │   ├── features/    # Module-based components
│   │   ├── components/  # Shared UI
│   │   ├── pages/       # Route pages
│   │   └── main.tsx     # Entrance point
│   └── package.json
│
└── docs/               # Documentation
```

---

## Setup & Running

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Documentation for AI Agents

For detailed architectural patterns and coding standards, refer to [.agent/SKILL.md](file:///c:/Users/user/projects/skillkart/.agent/SKILL.md).
