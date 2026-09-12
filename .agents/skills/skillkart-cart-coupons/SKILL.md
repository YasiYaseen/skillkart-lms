---
name: skillkart-cart-coupons
description: E-Commerce Shopping Cart, Coupon Discounts, Order History, and Pluggable Payment Gateway Provider subsystem for SkillKart.
---

# SkillKart Cart, Checkout, Coupons & Invoices

## Architecture Overview
- **Models:**
  - `Coupon`: Promo codes with percentage/fixed discounts, expiration dates, course-specific or global scope, and usage limits.
  - `Order`: Purchase orders with unique `orderNumber` (`SK-YYYYMMDD-XXXX`), course line-items, coupon savings, payment status, transaction reference, and billing details.
- **Payment Service (`paymentService.ts`):**
  - Pluggable `IPaymentProvider` abstraction.
  - `SimulatedPaymentProvider`: Instant 1-click test checkout.
  - `StripePaymentProvider`: Plug-and-play adapter ready for live keys.
- **Student Front-End:**
  - `CartContext.tsx` (`useCart()`): LocalStorage synchronized cart items with count badge in `Header.tsx`.
  - `/cart` & `/checkout` (`CartPage.tsx`): Interactive coupon promo validation, order breakdown, and instant course auto-enrollment.
  - `/purchase-history` (`PurchaseHistoryPage.tsx`): Transaction log and printable/PDF invoice receipt modal (`window.print()`).
- **Instructor Front-End:**
  - `/instructor/coupons` (`Coupons.tsx`): Create percentage/$ discounts, toggle active state, and view redemption metrics.

---

## Checkout & Auto-Enrollment Invariants

- **Confirmed Payment Gating:** Course auto-enrollment only executes on confirmed payment (`paymentStatus: "completed" | "paid"`). Asynchronous gateways activate enrollments via payment webhook (`/api/orders/webhook`) upon clearance (AUDIT-103).
- **Course Status Guard:** Checkout rejects draft, unapproved, or disabled courses (AUDIT-03).
- **Self-Purchase Prevention:** Instructors cannot add or purchase their own courses (AUDIT-21).
- **Lesson Count Sync:** `activateOrderEnrollments` sets dynamic `totalLessonsCount` from live course lessons to prevent progress deadlocks (AUDIT-04).

