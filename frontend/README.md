# Telemetry Console (Frontend)

## Overview
This directory contains the **Next.js** frontend for the asynchronous task architecture. It serves as a "Telemetry Console," providing a real-time, dynamic dashboard to monitor, trigger, and manage Celery background tasks executing on the backend.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Dark/Terminal aesthetic)
- **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`)

## Core Features
1. **Real-time Polling Engine (`page.tsx`)**
   - Automatically queries the backend (`GET /tasks`) every 2 seconds.
   - Dynamically updates the statistics cards (Pending, Success, Failed) and the main data table without requiring manual page reloads.
2. **Interactive Data Table**
   - Clickable column headers (Task ID, Status, Start Time, Duration) to sort data bidirectionally.
   - Status badges with conditional color styling based on the strict Celery states (`PENDING`, `STARTED`, `SUCCESS`, `FAILURE`).
3. **Task Triggering Mechanism (`useTaskStatus.ts`)**
   - A robust custom React hook designed to dispatch a `POST /tasks` request.
   - Contains a localized polling loop isolated to a newly generated task, providing granular status feedback (e.g., loading spinner) in the UI header.
   - Safely cleans up polling intervals upon task completion or component unmount to prevent memory leaks.
4. **Queue Management**
   - "Clear Queue" functionality sends a `DELETE` request to wipe the Redis tracking state and instantly resets the frontend view.

## Project Structure
```text
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind configuration & global styles
│   │   ├── layout.tsx       # Root layout defining HTML structure
│   │   └── page.tsx         # Main dashboard component
│   └── hooks/
│       └── useTaskStatus.ts # Custom hook for task triggering/polling
├── public/                  # Static assets
├── next.config.ts           # Next.js configuration
├── package.json             # NPM dependencies
└── tailwind.config.ts       # Tailwind theme configuration
```

## Running Locally (Without Docker)
If you wish to test the frontend independently:
1. Ensure the Flask backend is running on `http://localhost:5000`.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the dashboard at `http://localhost:3000`.
