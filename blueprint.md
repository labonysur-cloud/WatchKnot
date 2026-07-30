# WatchKnot - Project Blueprint & Developer Log

This document serves as a living blueprint and memory for AI agents and developers working on **WatchKnot**, ensuring continuous understanding of the project's state, past actions, and future roadmap.

## Project Overview
WatchKnot is a full-stack Next.js social platform and virtual movie theater. It allows users to collect, review, and watch movies together, with a focus on a cozy, vintage-aesthetic design.
**Key Tech Stack**: Next.js 16 (App Router), Neon (PostgreSQL), Prisma, Firebase Auth/Firestore/Storage, PeerJS (WebRTC voice), Groq API, Cloudinary, Tailwind CSS + shadcn/ui.

---

## 🛠️ Developer Log (Recent Actions)

### 1. Project Hardening (June 2026)
*   **Security**: Authenticated `/api/upload/signature`; validated `/api/user/sync` against Firebase token; admin emails configurable via `ADMIN_EMAILS` env var.
*   **API consistency**: Standardized error responses to `{ error: string }` via `src/lib/apiResponse.ts`.
*   **Auth profile**: `AuthContext` exposes `profile.isAdmin` and `profile.ticketCount` for Navbar and admin gating.
*   **Watch rooms**: Integrated `ReactionOverlay` and `VoiceChat`; fixed countdown timer leak and missing `Check` icon import.
*   **Cleanup**: Removed unused `ChatOverlay`, `ThemeProvider`, `page.module.css`, and UploadThing dependencies.
*   **UX**: Added global `error.tsx` and `not-found.tsx` boundaries.

### 2. PWA & Logo Integration
*   **Action**: Integrated `gemini-svg.svg` as the core application logo.
*   **Implementation**: Copied to `src/app/icon.svg` and `public/icon.svg`.
*   **Manifest**: Updated `public/manifest.json` for Android/iOS homescreens.
*   **Metadata**: Apple Web App meta tags in `src/app/layout.tsx`.

### 3. Offline Mode Support (Service Worker)
*   **Action**: Ensured the web app UI loads offline so users can access downloaded videos.
*   **Implementation**: `public/sw.js` — **Network First** for navigation, **Cache First** for static assets, plus `watchknot-media-v1` for video range requests.

### 4. Security & Git History Purge
*   Renamed `.env` to `.env.local`; scrubbed leaked secrets from git history.

---

## 🗺️ The Blueprint (Guidelines)

### 1. Design & Aesthetics
*   **Styling**: Tailwind CSS with custom vintage theme variables in `globals.css` (rose/cream/gold palette). shadcn/ui for components.
*   **Typography**: Playfair Display, Nunito, Caveat via Google Fonts.
*   **Vintage Vibe**: Retro ticket designs, gingham patterns, soft pinks/creams.

### 2. PWA & Offline Experience
*   **Always Test Offline**: New routes must be cacheable by `sw.js`.
*   **Downloads**: Media saved to `watchknot-media-v1` via `offlineManager`.

### 3. Security & Secrets
*   **NEVER Commit `.env`**: Use `.env.local` (in `.gitignore`).
*   **Client vs Server**: Firebase Admin only in `/api` routes. Client uses Firebase Client SDK.
*   **Admin**: Set `ADMIN_EMAILS` (comma-separated) or `user.isAdmin` in database.
*   **Uploads**: Cloudinary signatures require authenticated user.

### 4. Real-time & Watch Rooms
*   **Firestore**: Room state, chat (`messages` subcollection), voice peer discovery (`peerIds`).
*   **PeerJS**: Voice chat mesh via WebRTC; Firestore for signaling only.
*   **Video sync**: Countdown overlay prompts synchronized manual play (iframe embeds cannot be programmatically controlled).

### 5. Next.js Considerations
*   **Async Params**: Always `await params` before usage.
*   **Vercel Timeouts**: Restrict external fetch timeouts (Groq, scraping) to prevent 504 errors.
*   **Read `node_modules/next/dist/docs/`** before writing Next.js code — APIs differ from older versions.

---

## Environment Variables

```
DATABASE_URL
GROQ_API_KEY
ADMIN_EMAILS                    # Optional, comma-separated admin emails
FIREBASE_PROJECT_ID             # Optional, defaults to watchknot
FIREBASE_SERVICE_ACCOUNT_KEY    # Optional JSON string for production auth
NEXT_PUBLIC_FIREBASE_*
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_API_KEY
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```
