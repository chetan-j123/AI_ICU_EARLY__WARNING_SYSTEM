# Node.js Backend

This project has a Node.js backend at `backend/`.

The frontend is unchanged. Node serves the existing HTML/CSS/JS and exposes the same API paths:

- `GET /health`
- `POST /predict/current`
- `POST /predict/temporal`
- `POST /predict/combined`
- `POST /stream/vitals`
- `GET /patient/state?patient_id=ICU-DEFAULT`

Python is only used by `backend/python/ml_bridge.py` to load and run the Python-native `.pkl` / `.keras` artifacts. The bridge automatically checks both:

- `ml/models_store`
- `ml/model_store`

It also accepts the current `- Copy` LSTM artifact filenames.

## Run

```bash
cd "C:\Users\Lenovo\Desktop\aiml_project"
npm start
```

Open:

```text
http://localhost:8000/
```

## Python Used For ML

By default the bridge uses `python` from your PATH because the local `venv` does not currently contain the ML packages. To force another Python executable:

```powershell
$env:ML_PYTHON="C:\Path\To\python.exe"
npm start
```

The server still returns rule-based fallback predictions if the bridge or model loading fails.
