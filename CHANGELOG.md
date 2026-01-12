# Changelog - Subliminal Software Improvements

## [Unreleased] - 2026-01-12

### Security & Authentication
- **Fixed Status Mismatch**: Updated `AudioGeneration` status from `'pending'` to `'draft'` in `src/lib/supabase.ts` to align with database constraints.
- **API Authentication**: Secured `/api/generate`, `/api/tts`, and `/api/affirmations/generate` routes with Supabase auth checks.
- **Admin Access**: Replaced hardcoded admin email checks with a centralized `isAdminEmail` utility (`src/lib/config.ts`).
- **Role-Based Access**: Created SQL script to add `role` column to `users` table (`supabase/add_admin_role.sql`).

### User Experience (UX)
- **Toast Notifications**: Replaced all native `alert()` calls with a modern, non-blocking Toast notification system (`src/components/ui/Toast.tsx`).
- **Confirmation Modals**: Replaced native `confirm()` dialogs with a styled, animated modal (`src/components/ui/ConfirmModal.tsx`).
- **Studio Loading State**: Added a premium skeleton loader (`src/components/studio/StudioSkeleton.tsx`) for the Studio page.
- **Keyboard Shortcuts**: Added a help modal accessible via `?` key, and implemented shortcuts for Undo, Redo, Delete, Play/Pause, and Export (`Ctrl+E`).
- **Dashboard Feedback**: Improved dashboard UI to show specific reasons when session creation is blocked (draft limit or plan limit).

### Bug Fixes
- **Drag-and-Drop**: Fixed a serialization error when dragging assets within the Studio (Files cannot be serialized to JSON).
- **Session Initialization**: Fixed potential duplicate session creation by adding a ref check in `StudioPage`.
- **Reference Errors**: Resolved `Cannot access 'handleDeleteTrack' before initialization` by reordering hook definitions in `StudioPage`.

### Database
- **Storage Metrics**: Created `storage_metrics` table script for better file usage tracking (`supabase/add_storage_metrics.sql`).

### Accessibility
- **ARIA Labels**: Added strict ARIA labels to all Studio header controls and key interactive elements for better screen reader support.

## SQL Scripts to Run
1. `supabase/add_storage_metrics.sql`
2. `supabase/add_admin_role.sql`
