# Marriot Bonvoy Copenhagen – Recruitment Portal TODO

## Phase 1: Database Schema & Project Structure
- [x] Define full database schema (jobs, applications, messages, notifications, documents, announcements)
- [x] Run migrations and apply SQL
- [x] Set up server-side query helpers in db.ts
- [x] Set up tRPC routers for all features
- [x] Configure global CSS theme (white, dark green, gold)
- [x] Set up Google Fonts and index.html

## Phase 2: Landing Page
- [x] Hero section with hotel background image, title, Apply Now & Login CTAs
- [x] Departments & Categories overview with icons
- [x] Job listings section with category filter
- [x] Hotel benefits section (6 benefit cards)
- [x] How to Apply 4-step process
- [x] FAQ accordion section (8 questions)
- [x] Contact section (email, phone, location)
- [x] Footer with navigation links
- [x] Responsive layout (mobile, tablet, desktop)
- [x] Sticky navigation bar with auth-aware buttons

## Phase 3: Auth & Applicant Dashboard
- [x] OAuth login/register flow via Manus
- [x] Applicant dashboard layout with sidebar navigation
- [x] Profile view (name, email, login method, member since)
- [x] Application history list with status badges
- [x] Application status tracking with timeline (Submitted → Under Review → Interview Scheduled → Accepted)
- [x] Notifications panel with mark-read and mark-all-read
- [x] Messages tab linking to application conversations
- [x] Logout
- [x] Mobile bottom navigation

## Phase 4: Multi-Step Application Form
- [x] Step 1: Personal details (name, gender, DOB, nationality, phone, email, country)
- [x] Step 2: Job details (position, education, experience, cover letter)
- [x] Step 3: Document uploads (CV/resume, passport photo, national ID/passport, certificates)
- [x] Step 4: Review & submit
- [x] N/A fallback for missing fields
- [x] Application fee info page (252 DKK, no payment gateway)
- [x] Form validation and progress indicator
- [x] Draft auto-save on each step

## Phase 5: In-App Messaging
- [x] Messaging UI for applicants (per-application thread)
- [x] Unread message count badge in sidebar
- [x] Message timestamps
- [x] Reply to admin messages
- [x] Admin messaging inbox (all conversations)
- [x] Admin reply to applicants
- [x] Real-time polling (5s interval)

## Phase 6: Admin Panel
- [x] Admin-only route guard (role === "admin")
- [x] Admin overview with stats (total, pending, interviews, accepted)
- [x] Job postings management (create, edit, deactivate)
- [x] Applicant list with search and status filter
- [x] Applicant profile view with documents
- [x] Secure document download links (S3 signed via /manus-storage/)
- [x] Update application status with admin notes
- [x] Announcements management (create, toggle active/inactive)

## Phase 7: Notifications & Email
- [x] In-app notifications on application submission
- [x] In-app notifications on status change (with admin notes)
- [x] In-app notifications on new admin message
- [x] Owner push notification on new application submission (via notifyOwner)
- [x] Notification read/unread state with badge counts

## Phase 8: Polish & Delivery
- [x] Brand CSS variables and utility classes (btn-green, btn-gold, brand-gradient, gold-gradient)
- [x] Smooth animations and transitions (fadeInUp, delay classes)
- [x] Loading and empty states throughout
- [x] 28 vitest unit tests passing
- [x] All routes registered in App.tsx
- [x] Final checkpoint and delivery
