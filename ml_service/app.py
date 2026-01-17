from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import traceback
import os
import sys

# Add the current directory to Python path to find predict.py
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from predict import predict_single
except ImportError as e:
    print(f"Error importing predict_single: {e}")
    # Fallback for development
    predict_single = lambda x: {"error": "Prediction module not loaded"}

# Create Flask app with correct static and template folders
app = Flask(__name__, 
            static_folder='../static' if os.path.exists('../static') else None,
            template_folder='../templates' if os.path.exists('../templates') else None)
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

        return jsonify({
            "success": True,
            "prediction": result
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)



  # Only one ) at the end

