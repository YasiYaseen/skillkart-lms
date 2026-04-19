---
name: SkillKart Agent Guide
description: Architectural patterns and coding standards for the SkillKart project.
---

# SkillKart Agent Guide

This guide describes the core architectural patterns and coding standards for the SkillKart project. AI agents should follow these patterns to maintain consistency and quality.

## Backend Patterns (Express + TypeScript)

### 1. Separation of Concerns
- **Routes (`src/routes/`):** Define API endpoints and apply middleware (auth, validation).
- **Controllers (`src/controllers/`):** Handle HTTP requests and responses. Business logic should be delegated to shared utility functions or kept minimal in controllers if they are simple CRUD.
- **Models (`src/models/`):** Mongoose schemas for MongoDB data structure. Use timestamps and proper indexing on `userId`, `courseId`, and `sectionId`.
- **Validators (`src/validators/`):** Use **Zod** for request body and query parameter validation.

### 2. Error Handling
- Use the unified error handling patterns.
- Ensure all endpoints return consistent JSON error objects.

### 3. Authentication & Authorization
- Use `authMiddleware` to protect routes that require authentication.
- Access the current user from `req.user` after auth.

## Frontend Patterns (React + Vite + Tailwind)

### 1. Feature-Based Architecture
- Modules are grouped by feature in `src/features/` (e.g., `student`, `instructor`, `auth`, `enrollment`).
- Each feature directory should contain its own components, hooks, and services if specific to that feature.

### 2. Styling (TailwindCSS v4)
- Use Tailwind utility classes for most styling.
- Use Sass for complex custom styles in `src/styles/`.
- Maintain the "premium" aesthetic: use subtle gradients, glassmorphism effects, and smooth transitions.

### 3. State Management & API Calls
- Use **Axios** (pre-configured in `src/lib/axios.ts` if it exists, or standard axios).
- Preference for React hooks (`useEffect`, `useState`) for local state management.

## Coding Standards

- **TypeScript:** Strict typing is required. Avoid `any`.
- **Consistency:** Follow existing naming conventions (camelCase for variables/functions, PascalCase for components).
- **Documentation:** Comment complex logic and use JSDoc for exported functions.
- **Testing:** New features should ideally include unit or integration tests (using Vitest/Jest).

## Common Tasks for Agents

### Adding a New Course Component
1. Create the component in `src/features/instructor/components/`.
2. Add necessary types in `backend/src/types/`.
3. Implement the controller logic in `backend/src/controllers/course/`.
4. Register the route in `backend/src/routes/courseRoutes.ts`.
