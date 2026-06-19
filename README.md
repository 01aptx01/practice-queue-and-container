# Asynchronous Task Queue System

A containerized application demonstrating distributed background task processing, real-time monitoring, and load testing. This project decouples the client-facing API from long-running tasks to maintain high responsiveness under concurrent user loads.

## Architecture

The system is composed of the following microservices orchestrated via Docker Compose:

- **API (`flask`)**: Handles incoming REST requests and streams real-time queue states via Server-Sent Events (SSE). Served by Gunicorn using thread-based concurrency.
- **Worker (`celery`)**: Consumes tasks from the message broker, executes simulated workloads, and implements retry policies for transient failures.
- **Broker & Backend (`redis`)**:
  - `db=0`: Celery message broker and result backend.
  - `db=1`: Application metadata storage for fast API querying.
- **Frontend (`next.js`)**: Real-time telemetry dashboard to monitor queue health and task execution.
- **Monitoring (`flower`)**: Administrative web interface for monitoring Celery workers and task history.
- **Load Testing (`locust`)**: Framework to simulate concurrent user traffic and validate system scaling limits.

## Features

- **Asynchronous Execution**: Offloads blocking operations to background workers.
- **Real-Time Updates**: Utilizes SSE to push queue metrics to the client, eliminating polling overhead.
- **Optimized Data Retrieval**: Implements Redis pipelining to resolve N+1 query bottlenecks.
- **Failure Handling**: Custom retry mechanisms for transient errors during task execution.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1. **Start the application**
   ```bash
   docker-compose up --build -d
   ```

2. **Access the services**
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Flower (Celery Monitor)**: [http://localhost:5555](http://localhost:5555)
   - **Locust (Load Testing)**: [http://localhost:8089](http://localhost:8089)

3. **View worker logs**
   ```bash
   docker-compose logs -f worker
   ```

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## API Reference

### 1. Submit a Task
Dispatch a new background task.
- **POST** `/tasks`
- **Body**: `{"duration": 5}` (Optional. Defaults to 5)
- **Response**:
  ```json
  {
    "task_id": "c1a6b0c2-...",
    "status": "Accepted",
    "message": "Task submitted to sleep for 5 seconds"
  }
  ```

### 2. Stream Task Status
Subscribe to the SSE stream for real-time task updates.
- **GET** `/tasks/stream`
- **Response**: `text/event-stream`

### 3. Clear Queue
Revoke all executing/pending tasks and flush task history.
- **DELETE** `/tasks`
- **Response**: `200 OK`

## Load Testing

The Locust service is pre-configured to stress-test the API and background workers.

1. Navigate to `http://localhost:8089`.
2. Specify the **Number of users** (e.g., 100) and **Spawn rate** (e.g., 10).
3. Start the test and observe the queue behavior via the Frontend Dashboard and Flower.