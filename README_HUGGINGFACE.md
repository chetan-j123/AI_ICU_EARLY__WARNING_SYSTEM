# ICU Early Warning ML Service

This Hugging Face Space runs the Python ML layer for the ICU Early Warning System.

## Runtime

- SDK: Docker or Python Space
- App file: `app.py`
- Start command: `uvicorn app:app --host 0.0.0.0 --port 7860`

## Endpoints

- `GET /health`
- `POST /predict`
- `POST /predict/current`
- `POST /predict/lstm`

The Render Node backend should call this service. The frontend should not call this Space directly.

## Model Artifacts

The service reuses the existing artifacts under `ml/model_store/`:

- `xgb_model.pkl`
- `xgb_features.pkl`
- `lstm_model - Copy.keras`
- `lstm_scaler - Copy.pkl`
- `lstm_features - Copy.pkl`
- `top_features - Copy.pkl`

No model retraining is performed during deployment.

## Environment Variables

- `MODEL_DIR`: optional override for the model artifact directory.
- `CORS_ORIGINS`: optional comma-separated origins. Defaults to `*`.
- `LOG_LEVEL`: optional Python logging level. Defaults to `INFO`.
