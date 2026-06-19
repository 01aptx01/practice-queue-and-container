"""
Application Factory for the Flask API.
Initializes the Flask application, configures CORS, and sets up Celery.
"""

from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

from .celery_utils import celery_init_app
from .routes import tasks_bp

# Load environment variables from .env file if present
load_dotenv()

def create_app() -> Flask:
    """
    Creates and configures the Flask application.
    Returns:
        Flask: The initialized Flask app.
    """
    app = Flask(__name__)
    
    # Enable Cross-Origin Resource Sharing (CORS) for frontend interaction
    CORS(app)
    
    # Configure Celery using environment variables or defaults
    app.config.from_mapping(
        CELERY=dict(
            broker_url=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
            result_backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
            task_ignore_result=False,  # Essential for polling task statuses
        ),
    )
    
    # Load any additional config from environment variables prefixed with FLASK_
    app.config.from_prefixed_env()
    
    # Initialize Celery with the Flask app context
    celery_init_app(app)
    
    # Register API routes
    app.register_blueprint(tasks_bp)
    
    return app
