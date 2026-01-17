# wsgi.py
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Try to import from ml_service
try:
    from ml_service.app import app
except ImportError as e:
    # Fallback: create a simple app for debugging
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/')
    def home():
        return f"Error: Could not import ml_service.app. Details: {str(e)}"
    
    @app.route('/health')
    def health():
        return {"status": "ERROR", "message": str(e)}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port))
