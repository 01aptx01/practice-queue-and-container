"""
Celery Background Tasks.
Defines all asynchronous tasks that are executed by the Celery worker.
"""

from celery import shared_task
import time

@shared_task(ignore_result=False)
def simulate_heavy_computation(duration: int):
    """
    Simulates a heavy computation or long-running process by sleeping.
    
    Args:
        duration (int): The number of seconds the task should sleep.
        
    Returns:
        dict: A payload containing the final status and message.
    """
    time.sleep(duration)
    return {"status": "success", "message": f"Slept for {duration} seconds"}
