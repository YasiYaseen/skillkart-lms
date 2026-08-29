# Wishlist

Status: Done
Priority: Later
Owner: Unassigned

## Goal
Allow students to save courses they may want to enroll in later.

## Requirements
- Students can save courses to wishlist
- Students can remove courses from wishlist
- Show wishlist page

## Acceptance Checklist
- [x] Student can add course to wishlist
- [x] Student can remove course from wishlist
- [x] Wishlist page shows saved courses
- [x] Duplicate wishlist entries are blocked

## Current Implementation Notes
- Created Mongoose `Wishlist` model in `backend/src/models/Wishlist.ts` with compound unique index on `{ student: 1, course: 1 }`.
- Created Zod validation schema in `backend/src/validators/wishlistValidator.ts`.
- Created `wishlistController.ts` in `backend/src/controllers/wishlist/` providing `getWishlist`, `addToWishlist`, `removeFromWishlist`, and `checkWishlistStatus`.
- Created Express router in `backend/src/routes/wishlistRoutes.ts` and mounted at `/api/wishlist` in `server.ts`.
- Created frontend feature at `frontend/src/features/wishlist/`:
  - `WishlistButton.tsx`: Animated heart icon/button component supporting inline card overlays and full button modes.
  - `WishlistPage.tsx`: Dedicated wishlist dashboard with grid layout, empty state CTA, and quick removal controls.
  - `api/wishlist.ts`: Axios client service.
- Integrated `WishlistButton` into `CourseCard.tsx` and `CourseDetailsPage.tsx`.
- Added "Wishlist" link to student header navigation in `Header.tsx`.
- Registered `/wishlist` route in `App.tsx`.
