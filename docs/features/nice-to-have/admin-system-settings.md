# Admin Platform System Settings & Diagnostics

Status: Done
Priority: Nice-To-Have
Owner: SkillKart Team

## Goal
Provide a centralized system configuration and control center for platform administrators to manage branding, financial commission splits, user registration and moderation policies, maintenance downtime mode, and outbound SMTP email diagnostics.

## Requirements
- Singleton `SystemSettings` schema with database defaults
- Public configuration endpoint `GET /api/settings/public` for client branding and maintenance awareness
- Admin configuration endpoint `GET /api/admin/settings` and `PUT /api/admin/settings` with Zod validation
- Immutable logging of configuration changes in `AuditLog`
- Interactive revenue commission split controller (platform fee % + instructor share % = 100%)
- Maintenance mode toggle with scheduled completion time and live public banner alerts
- SMTP mail transport diagnostic endpoint `POST /api/admin/settings/test-email` with latency and handshake feedback
- Full-featured Admin frontend settings interface with tabs, live previews, and dark mode support

## Acceptance Checklist
- [x] Singleton system settings model with timestamps and defaults
- [x] Input validation using Zod
- [x] Revenue split synchronization
- [x] Maintenance mode alert banners
- [x] SMTP diagnostics test dispatcher
- [x] Audit logging on settings update
- [x] Admin UI with tabbed control panels
