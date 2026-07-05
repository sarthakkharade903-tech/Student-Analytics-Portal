# Student Analytics Portal - SaaS Project Overview

This document describes everything built so far. Share it in a new conversation for full context.

---

## What Is This?

A SaaS platform for coaching institutes (JEE/NEET/CET classes) in India.
A coaching center owner signs up, manages students, tracks fees, attendance, and test performance.
Parents get a separate read-only portal to view their child's progress.
A Super Admin (product owner) manages all coaching centers from a hidden panel.

---

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Database + Auth: Supabase (PostgreSQL + Row Level Security)
- Styling: Tailwind CSS v4 + CSS variables
- PDF Generation: jsPDF + jspdf-autotable
- AI: Groq SDK
- Charts: Recharts
- CSV Parsing: PapaParse

---

## User Roles

### 1. Super Admin (product owner)
- Hidden URL: /super-admin-panel-8472
- Creates, manages, suspends, deletes coaching centers
- Sets plan type (Trial/Standard), subscription end date, feature toggles
- Views all institutes and demo leads

### 2. Coaching Admin (coaching center owner)
- Signs up at /signup, logs in at /login
- Full dashboard at /dashboard
- Manages students, fees, tests, attendance, resources for their own institute

### 3. Parent
- Token-based login (phone + PIN) at /parent/login
- Read-only portal at /parent
- Views child's attendance, fees, test performance, and resources

---

## Portals Built

### A. Landing Page (/)
- Marketing page with features list, hero section, testimonials
- Request Demo modal that captures leads
- Contact section

### B. Admin Dashboard (/dashboard)

Sidebar with these modules:

| Module | Route | Purpose |
|---|---|---|
| Home | /dashboard | Overview cards: student count, recent activity |
| Students | /dashboard/students | List, add, edit, delete students; class-wise |
| Student Import | /dashboard/students/import | Bulk import via CSV |
| Attendance | /dashboard/attendance | Mark daily attendance batch-wise; calendar view |
| Tests | /dashboard/tests | Create tests, enter marks, view analytics |
| Analytics | /dashboard/analytics | Charts for performance trends, topper lists |
| Fee Management | /dashboard/fee-management | Full fee tracking system |
| Resources | /dashboard/resources | Upload/manage study materials |
| Settings | /dashboard/settings | Institute profile, logo, feature toggles, plan info |

### Fee Management Module (detailed)
Route: /dashboard/fee-management/[classId] with tabs:

| Tab | Purpose |
|---|---|
| Records | Full student list with fee status; student detail modal |
| Quick Entry | Search student, record a payment fast |
| Structure | Set class-level total fee and installment schedule |
| Batches | Fee status by batch |
| CSV Upload | Bulk import fee records |
| Notifications | Send fee reminders to parents |

Features inside Records tab:
- Stat cards: Total Students, Paid, No Payment, Total Collected, Total Discount Given
- Per-student modal: view/edit total fee, adjust discount, payment history
- Delete individual payments
- Download Fee Receipt PDF (coaching name, discount, cumulative history, fee summary)
- Download Audit Report PDF (full class fee table with discount in summary)

### C. Parent Portal (/parent)
JWT cookie-based auth. Parents log in with phone + PIN.

| Section | Purpose |
|---|---|
| Home | Child performance overview and attendance summary |
| Fees | Fee dashboard: total, paid, remaining, installments, payment history |
| Attendance | Calendar view of daily attendance |
| Resources | Download study materials |
| Profile | View student info |

Parent Fee Receipt:
- Download button per payment in history
- PDF includes: coaching name, student details, this payment, cumulative history, fee summary with discount (always uses live values so admin changes reflect immediately)

### D. Super Admin Panel (/super-admin-panel-8472)
- Separate login page
- Lists all coaching centers
- Add new institute (plan type, end date, feature toggles)
- Suspend / delete institutes
- Leads section: view all demo requests

---

## Key Business Logic

### Subscription System
- Every coaching center has: is_active, account_status, end_date, plan_type
- Expired/suspended centers see a BlockedAccess screen instead of the dashboard
- Trial plan = 3 days, then blocked
- Expiration banner shows days remaining before block

### Feature Lock System
- Super admin can lock specific modules per institute (e.g., lock Resources or Analytics)
- Locked modules show a PIN prompt
- Cookie-based unlock (session scoped)

### Class System
- Two classes: Class 11 and Class 12
- Batches are string names (e.g., "JEE 12", "NEET 11", "CET-A")
- Class 12 = batch name contains "12"
- Class 11 = all other batches

### Fee Logic
- Global fee set per class in class_fee_settings table
- Individual student fee can override (stored in fees table)
- Discount = class_base_fee minus student_total_fee
- Payment history stored as JSONB array: [{amount, date, receipt_number}]
- Receipt number format: REC-{timestamp}-{random}

---

## Supabase Tables (Key)

| Table | Purpose |
|---|---|
| users | Admin user accounts linked to coaching_center |
| coaching_centers | One row per institute; subscription info, features JSON |
| students | Student records (name, roll_no, batch, phone, etc.) |
| fees | One row per student; total_fee, amount_paid, payment_history JSONB |
| class_fee_settings | Global fee and installments per class per coaching center |
| tests | Test metadata (name, date, subject, max marks) |
| test_results | Per-student marks per test |
| attendance | Daily attendance records |
| resources | Study material metadata (file URL, title, batch target) |

---

## APIs Built (/api)

| Route | Purpose |
|---|---|
| /api/auth | Auth helpers |
| /api/parent | Parent token generation and validation |
| /api/coaching | Coaching center data operations |
| /api/ai | AI features (Groq-powered performance summaries) |
| /api/demo | Captures demo request leads |
| /api/superadmin | Super admin operations |
| /api/std-data | Student data operations |
| /api/portal | Portal-specific endpoints |

---

## Latest Features Added (Most Recent)

1. Fee Audit PDF - Admin downloads full PDF of class fee records with total discount in summary
2. Fee Receipt PDF (Admin) - From student payment history modal, download receipt per payment
3. Fee Receipt PDF (Parent) - Parents download receipts; shows coaching name, discount, cumulative history
4. Total Discount Stat Card - "Discount Given" card in fee management showing total discount for the class

---

## How to Add Next Features

Create a new file: NEXT_FEATURES.md in this same directory.
Paste the plan for what to build next there, then share both files in a new conversation.

---

Last updated: July 2026
