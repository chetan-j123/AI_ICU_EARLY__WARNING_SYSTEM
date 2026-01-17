# wsgi.py - SIMPLE VERSION
import sys
import os

# Add the project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Try to import
try:
    # Import from ml_service folder
    from ml_service.app import app
except ImportError:
    # Fallback if ml_service doesn't exist
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/')
    def home():
        return "Error: Could not import ml_service.app"
    
    @app.route('/health')
    def health():
        return {"status": "error", "message": "ml_service.app not found"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
