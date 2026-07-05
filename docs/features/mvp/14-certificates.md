# Certificates

Status: Done
Priority: MVP
Owner: Unassigned

## Goal
Generate a simple completion record when a student finishes a course.

## Requirements
- Generate a simple completion certificate
- Certificate includes student name, course name, instructor name, and completion date
- Student can view completed course certificate
- Admin or instructor can verify certificate details

## Backend Scope
- Create certificate model
- Generate certificate after course completion
- Add certificate lookup API

## Frontend Scope
- Build certificate view
- Link completed courses to certificate page

## Acceptance Checklist
- [x] Certificate is generated at course completion
- [x] Certificate includes correct details
- [x] Student can view certificate
- [x] Certificate can be verified by ID

## Current Implementation Notes
- Created `Certificate` model with auto-generated unique IDs.
- Added `/api/certificates` routes for fetching user certificates, claiming certificates, and verifying certificates publicly.
- `progressController` automatically issues certificates when course progress reaches 100%.
- Created `MyCertificatesPage` to list a student's certificates.
- Created `VerifyCertificatePage` as a beautiful public page for verification.
- Added `My Certificates` link to the main navigation header for students.
