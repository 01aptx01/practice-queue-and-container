"""
Flask API Entrypoint.
Runs the Flask application server on port 5000.
"""

# Must monkey-patch early if running directly via python
try:
    import gevent.monkey
    gevent.monkey.patch_all()
except ImportError:
    pass

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    # Host '0.0.0.0' makes the server accessible externally (required for Docker)
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
