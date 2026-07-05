# Notifications

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Show important platform events to users inside the app.

## Requirements
- Notify student after successful enrollment
- Notify student when a course is completed
- Notify instructor when a student enrolls
- Notify instructor when a review is added
- Show notifications inside the app

## Backend Scope
- Create notification model
- Add notification creation helper
- Add notification list and mark-read APIs

## Frontend Scope
- Build notification dropdown or page
- Show unread count
- Add mark as read action

## Acceptance Checklist
- [x] Enrollment creates notification
- [x] Course completion creates notification
- [x] Review creates instructor notification
- [x] Unread notification count badge is visible
- [x] User can mark notification as read

## Current Implementation Notes
- Created `Notification` model with fields like recipient, title, message, type, and read status.
- Implemented `/api/notifications` for fetching notifications, marking them as read, or marking all as read.
- Hooked up `enrollmentController`, `progressController`, and `reviewController` to dispatch notifications on key events.
- Created `NotificationBell` React component with a dropdown to view and manage notifications.
- Polling implemented every minute to fetch new notifications.
