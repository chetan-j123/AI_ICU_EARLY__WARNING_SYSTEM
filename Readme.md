---
title: AI ICU Early Warning System
sdk: docker
---

# AI ICU Early Warning System

This project now uses a Spring Boot backend as the main web/API server and keeps Python as a dedicated ML inference service for the existing scikit-learn/joblib models.

## Architecture

```text
Frontend dashboard
  -> Spring Boot REST API on port 7860
  -> Python ML inference service on port 5001
  -> joblib/scikit-learn model artifacts
```

The Python service is intentionally retained because the trained models are Python scikit-learn pickle/joblib artifacts:

- `logistic_model.pkl`
- `random_forest_model.pkl`
- `scaler.pkl`
- `feature_columns.pkl`
- `admission_map.pkl`

## API

### GET `/`

Serves the ICU dashboard.

### GET `/health`

Response:

```json
{"status":"ok"}
```

### POST `/predict`

Request:

```json
{
  "heart_rate": 160,
  "spo2_pct": 78,
  "systolic_bp": 82,
  "diastolic_bp": 44,
  "respiratory_rate": 33,
  "temperature_c": 39.1,
  "oxygen_flow": 14,
  "mobility_score": 0,
  "nurse_alert": 1,
  "wbc_count": 21000,
  "lactate": 4.5,
  "creatinine": 2.4,
  "crp_level": 27,
  "hemoglobin": 8.9,
  "sepsis_risk_score": 8,
  "age": 80,
  "comorbidity_index": 4,
  "hour_from_admission": 2,
  "gender": "F",
  "oxygen_device": "ventilator",
  "admission_type": "emergency"
}
```

Response:

```json
{
  "success": true,
  "prediction": {
    "logistic_prob": 1.0,
    "rf_prob": 0.01993940605284524,
    "final_prob": 0.39743183180945085,
    "final_pred": 1
  }
}
```

## Run Locally

Install Python dependencies for the ML service:

```powershell
python -m pip install -r ml_service\requirements.txt
```

Start the ML service:

```powershell
python ml_service\app.py
```

In another terminal, build and run Spring Boot:

```powershell
cd backend
mvn clean package
java -jar target\early-warning-system-0.0.1-SNAPSHOT.jar
```

Open:

```text
http://localhost:7860
```


If Maven is not installed, install Maven or use any Maven distribution to run the same commands.

## Run With Docker Compose

```powershell
docker compose up --build
```

Then open:

```text
http://localhost:7860
```

## Configuration

Spring Boot environment variables:

- `SERVER_PORT`, default `7860`
- `ML_SERVICE_URL`, default `http://localhost:5001`

Python ML service environment variables:

- `ML_SERVICE_PORT`, default `5001`

## Notes

The new main backend is Spring Boot. The Python service exists only to preserve validated ML inference behavior with the current model artifacts.

//target is just a folder we can ignore becs use it will crested by the maven build tool for building depeceis and comile proejct making proejct deplyable format kinodff thigs it also reads pom.xml
///pom.xml is just deoenceies file
//the ml serviece and thebackend bit have thier spearte doekcerifle which is used containerise the that paricualr fiolder
//and external dockefile -copomser just used to connect the both dockerfile or can  say run them together 
//gtignore and gitattrbutes is jusrt github files 
//backend k andr src e main jav code hota h baceknd ka scr code and resoucres folder conatins the forntedn files java reuires tge frontend file shoudl be also in src folder  src- first braanch java(backend code ) , second brach resources (fronted files) 


[Browser] --GET /--> [MainController] --> templates/index.html --> [Browser]
[Browser] --GET /style.css, /script.js--> static/ folder --> [Browser]

[Browser form submit]
        │ POST /predict (JSON vitals)
        ▼
[MainController.predict()]
        │ forwards same JSON
        ▼
[Python app.py :5001 /predict]
        │ loads .pkl models, runs prediction
        ▼
[MainController receives Python's JSON]
        │ returns as-is
        ▼
[Browser script.js] --> dashboard update ho jaata hai


1️⃣ App Start Hone Ka Flow (jab tum java -jar chalate ho)
java -jar early-warning-system-0.0.1-SNAPSHOT.jar
        ↓
Application.java ka main() method chalta hai
        ↓
SpringApplication.run(Application.class, args)
        ↓
Spring Boot khud-ba-khud:
  - application.properties padhta hai (port=7860, ml.service.url)
  - MainController ko detect karta hai (@Controller dekh ke)
  - Ek embedded web server (Tomcat) start karta hai port 7860 pe
        ↓
Server ready: "listening on port 7860"