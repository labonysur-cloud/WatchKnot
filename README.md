# WatchKnot

WatchKnot is a comprehensive, full-stack social platform and virtual movie theater. It allows users to collect, review, share, and watch movies together in real-time. Built with a cozy, vintage-aesthetic design language, WatchKnot merges the features of a private movie tracking journal with synchronized group streaming and social media mechanics.

Live Deployment: https://watchknot.vercel.app

## Core Features

### 1. Social Feed and Movie Journal
A fully persisted, algorithmic social feed where users can write journal entries about movies.
*   **Media Integration**: Users can attach images and short video clips to their posts.
*   **Algorithmic Feed**: Features a pull-to-refresh mechanism with content ranked based on engagement (reactions and comments) and recency.
*   **Custom Reactions**: A bespoke reaction system allowing users to respond with specialized sentiments (Wow, Care, Like, etc.) rather than standard emojis.
*   **Privacy Controls**: Post visibility can be finely tuned to "Only Me", "Specific Friends", or "All Friends".
*   **Moderation**: Users maintain full control over their content, including the ability to delete posts, hide comments, and block malicious accounts.

### 2. Progressive Web App and Offline Downloads
WatchKnot is designed as a standalone, installable Progressive Web App (PWA).
*   **Device Caching**: Utilizes a custom Service Worker and the browser Cache API to securely download large video blobs directly to the user's device.
*   **TV Show Support**: The database architecture natively supports Seasons and Episodes, allowing users to download individual episodes or binge entire seasons offline.
*   **Offline Hub**: A dedicated downloads management page where users can access, view, and delete their cached media without an active internet connection.

### 3. Interactive Digital Ticketing
Before accessing a Watch Room, users must acquire a virtual ticket.
*   **CSS Architecture**: Tickets are rendered dynamically using pure HTML and CSS, featuring a vintage film-strip aesthetic, accurate typography, and generated barcodes.
*   **Seat Allocation**: Users select specific rows and seats, which are locked transactionally to prevent double-booking.
*   **AI Personalization**: Integrated AI generates personalized, context-aware messages on the ticket based on the specific movie's genre and mood.

### 4. Administrative Control Panel
A robust admin dashboard ensuring platform safety and content standards.
*   **User Management**: Administrators can view user statistics, track movie uploads, and instantly revoke access by banning accounts.
*   **Content Moderation**: Global privileges to edit or permanently delete any movie or post on the platform.
*   **Banned User Handling**: Banned users are securely intercepted at the layout layer and trapped on a dedicated restriction screen, severing all access to the API and feed.

## Technology Stack

*   **Frontend Framework**: Next.js 16 (App Router, Server Components)
*   **Styling**: Tailwind CSS + shadcn/ui with custom vintage theme (CSS variables in `globals.css`)
*   **Database**: Neon (Serverless PostgreSQL)
*   **ORM**: Prisma
*   **Authentication**: Firebase Authentication and Firebase Admin SDK
*   **Media Storage**: Firebase Storage for user-uploaded media
*   **AI Integration**: Groq SDK for natural language processing and ticket personalization
*   **Icons**: Lucide React

## Project Architecture

The application follows a modern serverless architecture utilizing Next.js Server Components for optimal data fetching and SEO, while offloading interactive elements to Client Components.

1.  **Data Layer**: Prisma acts as the bridge to a Neon Postgres database. The schema is highly relational, connecting Users to Movies, Tickets, Posts, Friendships, and nested media structures (Seasons and Episodes).
2.  **Authentication Layer**: Authentication is handled purely through Firebase. The frontend maintains the session via the Firebase Client SDK, while the backend API routes securely verify identity using the Firebase Admin SDK by extracting and decoding the Bearer token from the request headers.
3.  **Media and PWA Layer**: Video playback relies on HTML5 video elements. For offline capabilities, a custom Service Worker intercepts `fetch` requests. When a user downloads a movie, the file is streamed into the browser's Cache API, while metadata is stored in LocalStorage.

## Local Development Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Create a `.env.local` file in the root directory and provide your keys:
    *   `DATABASE_URL` (Neon Postgres Connection String)
    *   Firebase Client Configuration (`NEXT_PUBLIC_FIREBASE_*`)
    *   Firebase Admin (`FIREBASE_PROJECT_ID`, optional `FIREBASE_SERVICE_ACCOUNT_KEY`)
    *   `GROQ_API_KEY`
    *   Cloudinary (`NEXT_PUBLIC_CLOUDINARY_*`, `CLOUDINARY_API_SECRET`)
    *   `ADMIN_EMAILS` (optional, comma-separated admin emails)
4.  Initialize the database schema:
    ```bash
    npx prisma db push
    npx prisma generate
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```
6.  Open `http://localhost:3000` in your browser.

## Production Build

To build the application for production deployment:

```bash
npm run build
npm start
```

WatchKnot is optimized for serverless deployment platforms such as Vercel. Ensure all environment variables are properly configured in your deployment platform's dashboard before triggering a build.
