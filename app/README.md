# Backend Core (Flask & Celery)

This directory contains the Python core of the Asynchronous Task Queue System.

## Component Overview

- `__init__.py`: The application factory. It initializes the Flask application, configures Cross-Origin Resource Sharing (CORS), and sets up the Celery integration.
- `celery_utils.py`: Contains the `init_celery` utility function to bind the Celery worker process with the Flask application context.
- `routes.py`: Defines all RESTful API endpoints:
  - `POST /tasks`: Submit new workloads to the queue.
  - `GET /tasks/stream`: The Server-Sent Events (SSE) stream yielding real-time queue states.
  - `DELETE /tasks`: Flush the queue and revoke all executing tasks.
- `tasks.py`: Defines the asynchronous background tasks (e.g., `simulate_heavy_computation`). 

## Real-Time Metrics Tracking

To provide 100% accurate global metrics without blocking API threads, the backend heavily utilizes **Redis (`db=1`)** and **Celery Signals**.
Whenever a worker changes state, signals (`@task_prerun`, `@task_success`, `@task_failure`) automatically update tracking counters in Redis. The API then serves these numbers to the frontend dashboard.
