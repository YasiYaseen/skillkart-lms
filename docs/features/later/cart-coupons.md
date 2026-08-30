# E-Commerce Shopping Cart & Coupon Subsystem

Status: Done
Priority: Later
Owner: Implemented

## Goal
Provide a complete cart, coupon promo code discounts, order history, invoice receipts, and multi-gateway payment simulator for course purchases.

## Requirements
- Multi-course shopping cart with persistent localStorage synchronization and header badge counter.
- Interactive coupon promo validation (fixed and percentage discounts, min purchase criteria, expiration, course-specific or global scope, max redemption caps).
- Realistic multi-provider payment checkout simulation (Card simulator with Luhn test cards, Apple Pay, Google Pay, PayPal, UPI QR code).
- Instant automatic course enrollment upon payment confirmation.
- Student purchase history and printable / PDF invoice modal (`window.print()`).
- Instructor coupon management dashboard with active toggles and redemption statistics.

## Acceptance Checklist
- [x] Cart provider manages cart additions, removals, and checkout flow
- [x] Coupon validation endpoint validates and applies percentage or fixed amount discounts
- [x] Checkout creates order record, increments coupon redemptions, and auto-enrolls student
- [x] Purchase history and receipt view with printable invoice styling
- [x] Instructor coupon creation and management studio
