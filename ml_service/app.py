
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import traceback
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

sys.path.insert(0, BASE_DIR)

from predict import predict_single

app = Flask(
    __name__,
    static_folder=os.path.join(ROOT_DIR, "static"),
    template_folder=os.path.join(ROOT_DIR, "templates")
)

CORS(app)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "service": "ICU Cortex AI Backend",
        "endpoints": ["/predict"]
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        input_data = request.get_json()
        result = predict_single(input_data)

        return jsonify({"success": True, "prediction": result})

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500



print(f"Static folder path: {app.static_folder}")
print(f"Template folder path: {app.template_folder}")
