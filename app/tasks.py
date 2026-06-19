"""
Celery Background Tasks.
Defines all asynchronous tasks that are executed by the Celery worker.
"""

from celery import shared_task
import time

@shared_task(bind=True, 
    ignore_result=False, 
    autoretry_for=(Exception,),
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
