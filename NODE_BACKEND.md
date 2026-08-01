# Node.js Backend

This project has a Node.js backend at `backend/`.

The frontend is unchanged. Node serves the existing HTML/CSS/JS and exposes the same API paths:

- `GET /health`
- `POST /predict/current`
- `POST /predict/temporal`
- `POST /predict/combined`
- `POST /stream/vitals`
- `GET /patient/state?patient_id=ICU-DEFAULT`

Python ML inference now runs as a separate FastAPI service, intended for Hugging Face Spaces. The Node backend calls it over HTTP through `ML_SERVICE_URL`; it no longer starts Python with `child_process.spawn()`.

The FastAPI app in `app.py` reuses `backend/python/ml_bridge.py` to load and run the Python-native `.pkl` / `.keras` artifacts. The bridge automatically checks both:

- `ml/models_store`
- `ml/model_store`

It also accepts the current `- Copy` LSTM artifact filenames.

## Run Node Backend

```bash
cd "C:\Users\Lenovo\Desktop\aiml_project"
npm start
```

Open:

```text
http://localhost:8000/
```

## Run ML Service Locally

In a Python environment with `requirements.txt` installed:

```bash
uvicorn app:app --host 0.0.0.0 --port 7860
```

Then point Node to it:

```powershell
$env:ML_SERVICE_URL="http://127.0.0.1:7860"
npm start
```

The server still returns rule-based fallback predictions if the ML service or model loading fails.
