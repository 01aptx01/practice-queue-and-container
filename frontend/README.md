# Telemetry Console (Next.js)

This directory contains the real-time React frontend dashboard for monitoring the task queue system.

## Key Features

- **WebSockets (Socket.IO) Integration**: Subscribes to the backend's broadcast stream to receive instantaneous updates, completely eliminating the overhead of traditional HTTP polling and avoiding N+1 connection issues.
- **Global Metrics Dashboard**: Displays 100% accurate, system-wide metrics including Total Received, Pending (pre-fetched + in-broker), Active Processing, and Completed/Failed tasks.
- **Interactive Data Table**: View task execution history. Supports configurable display limits (e.g., 10, 50, 100 items) and client-side sorting by clicking on column headers.
- **Queue Management**: Trigger new background tasks or clear the entire queue directly from the user interface.
- **Docker Multi-stage Optimization**: The `Dockerfile` uses a Next.js `standalone` build to strip development dependencies, resulting in a tiny, fast, and production-ready Docker container (~67MB).

## Local Development

If you wish to run the frontend independently of Docker:

```bash
npm install
npm run dev
```
The application will start on `http://localhost:3000`.
