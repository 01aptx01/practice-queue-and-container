# Load Testing (Locust)

This directory contains the user simulation scripts used to stress test the queue architecture.

## Overview

We use [Locust](https://locust.io/), a modern load testing framework, to simulate massive spikes of concurrent users interacting with the API. 

The primary objective of these tests is to prove the resilience of the architecture: demonstrating that the Flask/Gunicorn API can instantly accept and buffer hundreds of requests into the Redis queue without dropping connections, while the Celery workers sequentially process the backlog at a sustainable pace.

## Executing Tests

The Locust service is automatically orchestrated via `docker-compose`. 

1. Access the Locust Web UI at `http://localhost:8089`.
2. Set the **Number of users** (e.g., 200).
3. Set the **Spawn rate** (e.g., 20 users per second).
4. Click **Start swarming**.

## Monitoring the Chaos

While the load test runs, open the Telemetry Console (`http://localhost:3000`) and the Flower Dashboard (`http://localhost:5555`). You will observe the "Pending" tasks skyrocket while the "Active" tasks remain strictly locked to the maximum worker concurrency limit.
