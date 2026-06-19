"""
Flask API Entrypoint.
Runs the Flask application server on port 5000.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    # Host '0.0.0.0' makes the server accessible externally (required for Docker)
    app.run(host="0.0.0.0", port=5000, debug=True)
