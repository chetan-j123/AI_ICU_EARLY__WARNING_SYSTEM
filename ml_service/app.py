from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

# Import your prediction function
from predict import predict_single

app = Flask(__name__)
CORS(app)  # allow frontend / Streamlit / React access


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "service": "ICU Cortex AI Backend",
        "endpoints": ["/predict"]
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Validate JSON
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        input_data = request.get_json()

        # Call your existing ML pipeline
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
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
