# Backend API & Worker Architecture

## Overview
This directory contains the Python-based backend for the distributed task processing system. It leverages **Flask** for exposing RESTful API endpoints and **Celery** for asynchronous task execution, using **Redis** as both the message broker and state backend.

## System Components
1. **Flask API (`routes.py`, `__init__.py`)**
   - Handles incoming HTTP requests.
   - Dispatches long-running tasks to the Celery queue.
   - Provides an endpoint to poll task states.
   - CORS is enabled to allow frontend communication.
2. **Celery Worker (`tasks.py`, `celery_utils.py`, `make_celery.py`)**
   - Runs in a separate process/container.
   - Listens to the Redis broker for incoming task messages.
   - Executes `simulate_heavy_computation` asynchronously.
3. **Redis Integration**
   - Acts as the Celery Message Broker (stores tasks waiting to be processed).
   - Acts as the Celery Result Backend (stores task completion states).
   - Serves as a custom cache (`db=1`) to persist custom metadata (e.g., duration, start time) that Celery does not natively track in an easily queryable list.

## API Reference
The API is accessible at `http://localhost:5000` when running locally or via Docker.

### 1. Submit a Task (`POST /tasks`)
Triggers a new asynchronous background task.
- **Payload:** `{"duration": 5}` (Optional. Default is 5).
- **Response:**
  ```json
  {
    "task_id": "uuid-string",
    "status": "Accepted",
    "message": "Task submitted to sleep for 5 seconds"
  }
  ```

### 2. Retrieve All Tasks (`GET /tasks`)
Fetches the 50 most recent tasks stored in the Redis cache and queries Celery for their live status.
- **Response:**
  ```json
  [
    {
      "id": "uuid-string",
      "status": "SUCCESS",
      "startTime": "2026-06-20T12:00:00.000Z",
      "duration": "5s",
      "result": "{\"status\": \"success\", \"message\": \"Slept for 5 seconds\"}"
    }
  ]
  ```

### 3. Clear Queue (`DELETE /tasks`)
Deletes the tracked history of tasks from the custom Redis cache (`db=1`). This clears the frontend UI but does not terminate executing Celery processes.

## Running Locally (Without Docker)
If you wish to test the backend outside of the Docker environment:
1. Install dependencies: `pip install -r ../requirements.txt`
2. Start a local Redis server on `localhost:6379`.
3. Start the Flask server: `python run.py`
4. Start the Celery worker (in a new terminal): `celery -A make_celery worker --loglevel=info`
