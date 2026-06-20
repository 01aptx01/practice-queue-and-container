"""
API Routes.
Defines RESTful endpoints for task submission, status retrieval, and queue management.
"""

import redis
import datetime
import json
import os
import time
from celery.result import AsyncResult
from flask import Blueprint, request, jsonify, Response, current_app
from .tasks import simulate_heavy_computation

tasks_bp = Blueprint('tasks', __name__, url_prefix='/tasks')

# Connect to Redis for custom task metadata storage.
# We use db=1 to avoid conflicting with Celery's default broker which uses db=0.
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=1, decode_responses=True)
redis_client_celery = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

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
    
    # Increment global received counter
    redis_client.incr('metrics:total_received')
    
    return jsonify({
        "task_id": task.id,
        "status": "Accepted",
        "message": f"Task submitted to sleep for {duration} seconds"
    }), 202

def _get_tasks_data(limit=50):
    """Helper function to fetch and format task data optimally."""
    task_ids = redis_client.lrange('recent_tasks', 0, limit - 1)
    if not task_ids:
        return []
        
    # Use pipeline to batch hgetall queries
    pipeline = redis_client.pipeline()
    for task_id in task_ids:
        pipeline.hgetall(f'task_meta:{task_id}')
    meta_results = pipeline.execute()
    
    tasks = []
    for task_id, meta in zip(task_ids, meta_results):
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
        
    # Fetch global metrics
    total_received = int(redis_client.get('metrics:total_received') or 0)
    total_success = int(redis_client.get('metrics:total_success') or 0)
    total_failed = int(redis_client.get('metrics:total_failed') or 0)
    active = int(redis_client.get('metrics:active') or 0)
    
    # Negative active tasks can happen if queue was cleared while tasks were running. Fix it.
    if active < 0:
        redis_client.set('metrics:active', 0)
        active = 0
        
    # Calculate pending mathematically to account for tasks prefetched into worker memory
    # Total = Pending + Active + Success + Failed
    # Pending = Total - Active - Success - Failed
    pending = max(0, total_received - active - total_success - total_failed)
    
    return {
        "metrics": {
            "total_received": total_received,
            "total_success": total_success,
            "total_failed": total_failed,
            "active": active,
            "pending": pending
        },
        "tasks": tasks
    }

@tasks_bp.route('', methods=['GET'])
def get_recent_tasks():
    """
    Retrieves the statuses and metadata of the most recent tasks.
    """
    limit = int(request.args.get('limit', 50))
    tasks = _get_tasks_data(limit=limit)
    return jsonify(tasks), 200

@tasks_bp.route('/stream', methods=['GET'])
def stream_tasks():
    """
    SSE endpoint to push task queue updates to the client in real-time.
    """
    limit = int(request.args.get('limit', 50))
    
    def generate():
        while True:
            tasks = _get_tasks_data(limit=limit)
            yield f"data: {json.dumps(tasks)}\n\n"
            time.sleep(2)
            
    return Response(generate(), mimetype='text/event-stream')

@tasks_bp.route('', methods=['DELETE'])
def clear_tasks():
    """
    Clears all tracked tasks and their metadata from Redis.
    Also revokes any executing tasks in Celery.
    """
    # Retrieve all tracked task IDs
    task_ids = redis_client.lrange('recent_tasks', 0, -1)
    
    # Get celery app instance
    celery_app = current_app.extensions["celery"]
    
    # Remove metadata keys and revoke tasks
    for task_id in task_ids:
        # Revoke the task (terminate if already running)
        celery_app.control.revoke(task_id, terminate=True)
        redis_client.delete(f'task_meta:{task_id}')
        
    # Remove the tracking list itself
    redis_client.delete('recent_tasks')
    
    # Reset all metrics
    redis_client.set('metrics:total_received', 0)
    redis_client.set('metrics:total_success', 0)
    redis_client.set('metrics:total_failed', 0)
    redis_client.set('metrics:active', 0)
    
    return jsonify({"status": "success", "message": "All task tracking records cleared and tasks revoked"}), 200
