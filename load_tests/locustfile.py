from locust import HttpUser, task, between
import random

class QueueTaskUser(HttpUser):
    # Simulate a user waiting between 1 to 5 seconds before making the next request
    wait_time = between(1, 5)

    @task(3)
    def submit_task(self):
        """
        Simulate a user triggering a new background task.
        Weight is 3, meaning this task is 3 times more likely to be picked than weight 1 tasks.
        """
        # Random duration for the task between 1 and 5 seconds
        duration = random.randint(1, 5)
        
        self.client.post("/tasks", json={"duration": duration}, name="Submit Task")

    @task(1)
    def view_dashboard(self):
        """
        Simulate a user simply opening or refreshing the dashboard (hitting the GET endpoint).
        Weight is 1.
        """
        self.client.get("/tasks", name="View Tasks Dashboard")
