"""
Celery Background Tasks.
Defines all asynchronous tasks that are executed by the Celery worker.
"""

from celery import shared_task
from celery.signals import task_prerun, task_success, task_failure
import time
import redis
import os

REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=1, decode_responses=True)

from celery.signals import task_prerun, task_success, task_failure, task_revoked

@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, **kwargs):
    if task_id:
        redis_client.sadd('metrics:active_tasks', task_id)

@task_success.connect
def task_success_handler(sender=None, **kwargs):
    task_id = sender.request.id if sender and hasattr(sender, 'request') else None
    if task_id:
        redis_client.srem('metrics:active_tasks', task_id)
    redis_client.incr('metrics:total_success')

@task_failure.connect
def task_failure_handler(sender=None, task_id=None, **kwargs):
    if task_id:
        redis_client.srem('metrics:active_tasks', task_id)
    redis_client.incr('metrics:total_failed')

@task_revoked.connect
def task_revoked_handler(sender=None, request=None, **kwargs):
    task_id = request.id if request else None
    if task_id:
        redis_client.srem('metrics:active_tasks', task_id)

class TransientError(Exception):
    """Custom exception to simulate a transient failure that should be retried."""
    pass

@shared_task(bind=True, 
    ignore_result=False, 
    track_started=True,
    autoretry_for=(TransientError,),
    retry_kwargs={'max_retries': 3, 'countdown': 5}
)
def simulate_heavy_computation(self, duration: int):
    """
    Simulates a heavy computation or long-running process by sleeping.
    
    Args:
        duration (int): The number of seconds the task should sleep.
        
    Returns:
        dict: A payload containing the final status and message.
    """
    time.sleep(duration)
    return {"status": "success", "message": f"Slept for {duration} seconds"}
