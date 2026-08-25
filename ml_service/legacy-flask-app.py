
import os
import sys
import traceback
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

# --------------------------------------------------
# Base directory (absolute path of this file)
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# --------------------------------------------------
# Import prediction logic
# --------------------------------------------------
from predict import predict_single   # make sure this exists

# --------------------------------------------------
# Flask app configuration
# --------------------------------------------------
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "static"),
    template_folder=os.path.join(BASE_DIR, "templates")
)

CORS(app)

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        result = predict_single(data)
        return jsonify({"success": True, "prediction": result})

    except Exception as e:
        return jsonify({
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# --------------------------------------------------
# Debug info (shows in HF logs)
# --------------------------------------------------
print("DEBUG: BASE_DIR =", BASE_DIR)
print("DEBUG: Static folder =", app.static_folder)
print("DEBUG: Template folder =", app.template_folder)

# --------------------------------------------------
# Hugging Face entry point
# --------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)

