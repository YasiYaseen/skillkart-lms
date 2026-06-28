# Notifications

Status: Not Started
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
- [ ] Enrollment creates notification
- [ ] Course completion creates notification
- [ ] Review creates instructor notification
- [ ] Unread notification count badge is visible
- [ ] User can mark notification as read

## Current Implementation Notes
- No notification model, routes, controller, or frontend notification UI was found.
