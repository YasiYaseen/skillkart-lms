# Instructor Earnings & Payout Requests

Status: Done
Priority: Later
Owner: Implemented

## Goal
Provide instructors with clear visibility into their course sales revenue, platform commission deductions, net take-home earnings, and payout withdrawal management.

## Requirements
- Aggregate total gross revenue from all student course purchases.
- Calculate platform commission splits (e.g. standard 20% platform fee, 80% instructor net take-home).
- Maintain available balance tracking deducting pending and completed payouts.
- Submit payout withdrawal requests via Bank Transfer, PayPal, or Stripe.
- Export detailed transaction sales ledger to CSV statements.

## Acceptance Checklist
- [x] Earnings calculation aggregated across completed orders
- [x] Payout withdrawal submission with balance check and validation
- [x] Ledger history with student name, date, price, and fee breakdown
- [x] CSV export of instructor earnings statement
