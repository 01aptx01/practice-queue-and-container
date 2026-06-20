# Asynchronous Task Queue System (Enterprise-Grade)

A containerized, production-ready application demonstrating distributed background task processing, real-time WebSockets monitoring, and load testing. This project decouples the client-facing API from long-running tasks to maintain high responsiveness under concurrent user loads.

## Architecture

The system is composed of the following microservices orchestrated via Docker Compose:

- **API (`flask`)**: Handles incoming REST requests and broadcasts real-time queue states via **WebSockets** (Socket.IO). Served by Gunicorn using `GeventWebSocketWorker` for high-concurrency non-blocking I/O.
- **Worker (`celery`)**: Consumes tasks from the message broker, executes simulated workloads, and implements retry policies for transient failures.
- **Broker & Backend (`redis`)**:
  - `db=0`: Celery message broker and result backend.
  - `db=1`: Application metadata storage for fast API querying.
- **Frontend (`next.js`)**: Real-time telemetry dashboard. Built using a Docker **Multi-stage build** with standalone output for minimal container size (~67MB).
- **Monitoring (`flower`)**: Administrative web interface for monitoring Celery workers and task history.
- **Load Testing (`locust`)**: Framework to simulate concurrent user traffic and validate system scaling limits.

## Key Features & Optimizations

- **Single Broadcaster Pattern**: Replaced traditional SSE with WebSockets. A single background thread queries Redis and broadcasts to all connected clients (O(1) database queries regardless of user count).
- **Bulk Operations**: "Clear Queue" leverages bulk task revocation and pipelined Redis deletions to prevent API freeze when dealing with 10,000+ tasks.
- **Pagination Blindspot Fixed**: Individual task status checks are available via `GET /tasks/<id>` (O(1) lookup), guaranteeing UI accuracy even under heavy queue pressure.
- **Memory Leak Protection**: Implemented `LTRIM` on Redis lists (max 10,000 tasks) and 24-hour TTL on metadata keys to prevent out-of-memory errors over long uptimes.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1. **Start the application**
   ```bash
   docker compose up --build -d
   ```

2. **Access the services**
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Flower (Celery Monitor)**: [http://localhost:5555](http://localhost:5555)
   - **Locust (Load Testing)**: [http://localhost:8089](http://localhost:8089)

3. **Stop the application**
   ```bash
   docker compose down
   ```

## API Reference

### 1. Submit a Task
Dispatch a new background task.
- **POST** `/tasks`
- **Body**: `{"duration": 5}` (Optional. Defaults to 5)

### 2. Get Recent Tasks
Fetch a limited list of the most recent tasks.
- **GET** `/tasks?limit=50`

### 3. Get Specific Task Status
Fetch the state of a single specific task.
- **GET** `/tasks/<task_id>`

### 4. Clear Queue
Revoke all executing/pending tasks and flush task history in bulk.
- **DELETE** `/tasks`

### 5. WebSocket Stream
Connect via Socket.IO client to receive broadcasted events on the `task_update` channel.