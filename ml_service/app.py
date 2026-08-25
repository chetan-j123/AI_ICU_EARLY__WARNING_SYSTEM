import os
import sys
import traceback

from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from predict import predict_single

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        return jsonify({"success": True, "prediction": predict_single(data)})
    except Exception as exc:
        return jsonify({
            "error": str(exc),
            "trace": traceback.format_exc()
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_SERVICE_PORT", "5001"))
    app.run(host="0.0.0.0", port=port)
