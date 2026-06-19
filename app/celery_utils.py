"""
Celery Initialization Utilities.
Handles the integration of Celery with the Flask application context.
"""

from celery import Celery, Task
from flask import Flask

def celery_init_app(app: Flask) -> Celery:
    """
    Initializes a Celery application using the configurations from the Flask app.
    It binds Celery tasks to the Flask application context so they can access Flask resources.
    
    Args:
        app (Flask): The Flask application instance.
        
    Returns:
        Celery: The configured Celery application.
    """
    class FlaskTask(Task):
        """Custom Celery Task that runs within the Flask application context."""
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    # Initialize Celery app with the custom task class
    celery_app = Celery(app.name, task_cls=FlaskTask)
    
    # Apply configurations defined in Flask's config["CELERY"]
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    
    # Attach the Celery app to the Flask extensions dictionary for global access
    app.extensions["celery"] = celery_app
    
    return celery_app
