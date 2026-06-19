"""
API Routes.
Defines RESTful endpoints for task submission, status retrieval, and queue management.
"""

import redis
import datetime
import json
import os
from celery.result import AsyncResult
from flask import Blueprint, request, jsonify
from .tasks import simulate_heavy_computation

tasks_bp = Blueprint('tasks', __name__, url_prefix='/tasks')

# Connect to Redis for custom task metadata storage.
# We use db=1 to avoid conflicting with Celery's default broker which uses db=0.
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=1, decode_responses=True)

@tasks_bp.route('', methods=['POST'])
def submit_task():
    """
    Submits a new background task to the Celery queue.
    Payload: {"duration": int (optional, default 5)}
    """
    data = request.get_json() or {}
    duration = data.get('duration', 5)
    
    # Dispatch the task asynchronously
    task = simulate_heavy_computation.delay(duration)
    
    # Save the task ID to a custom Redis list for tracking recent tasks
    redis_client.lpush('recent_tasks', task.id)
    
    # Store metadata (duration, start time) associated with this task ID
    redis_client.hset(f'task_meta:{task.id}', mapping={
        "duration": f"{duration}s", 
        "start_time": datetime.datetime.now().isoformat()
    })
    
    return jsonify({
        "task_id": task.id,
        "status": "Accepted",
        "message": f"Task submitted to sleep for {duration} seconds"
    }), 202

@tasks_bp.route('', methods=['GET'])
def get_recent_tasks():
    """
    Retrieves the statuses and metadata of the 50 most recent tasks.
    """
    # Fetch the last 50 task IDs from Redis
    task_ids = redis_client.lrange('recent_tasks', 0, 49)
    tasks = []
    
    for task_id in task_ids:
        # Retrieve custom metadata (start time, duration)
        meta = redis_client.hgetall(f'task_meta:{task_id}')
        
        # Retrieve the current state from Celery's result backend
        result = AsyncResult(task_id)
        status = result.state
        
        # Parse the result payload safely
        payload = "-"
        if result.ready() and result.result:
            try:
                payload = json.dumps(result.result)
            except Exception:
                payload = str(result.result)
                
        tasks.append({
            "id": task_id,
            "status": status,
            "startTime": meta.get("start_time", datetime.datetime.now().isoformat()),
            "duration": meta.get("duration", "-"),
            "result": payload
        })
        
    return jsonify(tasks), 200

@tasks_bp.route('', methods=['DELETE'])
def clear_tasks():
    """
    Clears all tracked tasks and their metadata from Redis.
    Note: This does not stop tasks currently executing in Celery, but clears the monitoring UI.
    """
    # Retrieve all tracked task IDs
    task_ids = redis_client.lrange('recent_tasks', 0, -1)
    
    # Remove metadata keys for each task
    for task_id in task_ids:
        redis_client.delete(f'task_meta:{task_id}')
        
    # Remove the tracking list itself
    redis_client.delete('recent_tasks')
    
    return jsonify({"status": "success", "message": "All task tracking records cleared"}), 200
