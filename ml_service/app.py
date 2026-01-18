import os
import sys
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import traceback

# Get the absolute path to the directory where app.py lives (ml_service)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from predict import predict_single

# EXPLICIT PATHS: Tell Flask exactly where to look inside ml_service
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "static"),
    template_folder=os.path.join(BASE_DIR, "templates")
)

CORS(app)

@app.route("/", methods=["GET"])
def home():
    # This will now look inside ml_service/templates/index.html
    return render_template("index.html")

# ... rest of your routes ...

# This will verify the fix in your Render logs
print(f"DEBUG: BASE_DIR is {BASE_DIR}")
print(f"DEBUG: Static folder is {app.static_folder}")
print(f"DEBUG: Template folder is {app.template_folder}")
