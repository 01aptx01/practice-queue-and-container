"""
Celery Worker Entrypoint.
This file is executed by the Celery CLI to start the worker process.
"""

from app import create_app

# Instantiate the Flask app to establish the application context
flask_app = create_app()

# Extract the initialized Celery application object.
# The Celery CLI expects to find an object named 'celery' or 'celery_app' in this file.
celery_app = flask_app.extensions["celery"]
