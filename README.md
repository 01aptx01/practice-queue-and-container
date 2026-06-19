# Asynchronous Task Architecture

## Overview
This repository contains a production-grade, containerized asynchronous backend architecture. The system is designed to demonstrate distributed task processing using Flask, Celery, and Redis, accompanied by a real-time Next.js telemetry console for monitoring.

## Architecture
The application follows a microservices architecture, orchestrated via Docker Compose:

- **api**: A Flask-based REST API responsible for accepting task requests and providing queue status.
- **worker**: A Celery worker process that listens to the message broker and executes background tasks.
- **redis**: An in-memory data store acting as both the message broker for Celery and the state database for task metadata.
- **frontend**: A Next.js web application functioning as a real-time telemetry console.

## Key Features
- **Real-Time Polling**: The frontend continuously synchronizes with the backend to display live task states.
- **Data Sorting**: Tabular data supports bidirectional sorting across multiple properties (Task ID, Status, Start Time, Duration).
- **State Management**: Dedicated endpoints to flush queue history and cleanly reset the environment.
- **Containerization**: Fully decoupled environment requiring no local dependencies other than Docker.

## Prerequisites
- Docker
- Docker Compose

## Installation & Usage

1. **Initialize the Environment**
   Start the services in detached mode:
   ```bash
   docker-compose up --build -d
   ```

2. **Access the Telemetry Console**
   Navigate to `http://localhost:3000` in your web browser.

3. **Monitor Worker Logs**
   To observe task execution in real-time:
   ```bash
   docker-compose logs -f worker
   ```

4. **Teardown**
   To stop and remove all associated containers and networks:
   ```bash
   docker-compose down
   ```

## API Reference
The backend API is exposed on port `5000`.

### 1. Submit a Task
Creates a simulated background task.
- **Endpoint**: `POST /tasks`
- **Headers**: `Content-Type: application/json`
- **Body**: `{"duration": <int>}` (Defaults to 5 seconds if omitted)
- **Response**: `202 Accepted`
  ```json
  {
    "task_id": "uuid",
    "status": "Accepted",
    "message": "Task submitted to sleep for 5 seconds"
  }
  ```

### 2. Retrieve Task Status
Fetches the metadata and current state of the 50 most recent tasks.
- **Endpoint**: `GET /tasks`
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "status": "SUCCESS",
      "startTime": "2026-06-20T05:00:00.000Z",
      "duration": "5s",
      "result": "{\"status\": \"success\"}"
    }
  ]
  ```

### 3. Clear Task Queue
Flushes the task history from the Redis store.
- **Endpoint**: `DELETE /tasks`
- **Response**: `200 OK`

## Directory Structure
```text
.
├── app/                    # Flask application core
│   ├── __init__.py         # Application factory
│   ├── celery_utils.py     # Celery integration
│   ├── routes.py           # API endpoints
│   └── tasks.py            # Celery task definitions
├── frontend/               # Next.js application
├── docker-compose.yml      # Service orchestration
├── Dockerfile              # Python environment specification
├── make_celery.py          # Celery worker entrypoint
├── run.py                  # Flask server entrypoint
└── requirements.txt        # Python dependencies
```