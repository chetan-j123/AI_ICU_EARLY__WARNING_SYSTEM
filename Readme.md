# 🏥 AI ICU Early Warning System

An AI-powered ICU monitoring and early warning system that analyzes patient vital signs and clinical parameters to estimate deterioration risk.

The application uses a **Spring Boot backend** as the main web/API server and a separate **Python Flask ML microservice** for machine-learning inference using trained scikit-learn/joblib models.

## 🔗 Check It Out

### 🌐 Live Application

https://ai-icu-backend.onrender.com

### 🤖 ML Service

https://ai-icu-early-warning-system.onrender.com

> The frontend is not deployed separately. It is bundled inside the Spring Boot backend and served directly by the backend.

---

# ✨ Features

* 🏥 ICU patient monitoring dashboard
* 📊 Real-time patient vital monitoring
* 🤖 Machine-learning based deterioration prediction
* 📈 Risk probability and prediction results
* 👨‍⚕️ Multiple ICU bed monitoring
* 🔄 Continuous vital-sign simulation
* 🌐 Spring Boot REST API
* 🐍 Dedicated Python ML inference service
* 🐳 Docker support
* ☁️ Production deployment on Render
* 📡 Backend-to-ML-service communication over HTTP

---

# 🏗️ Architecture

The project is divided into two independently deployable services.

```text
                    ┌──────────────────────────┐
                    │        Browser           │
                    │   ICU Monitoring UI      │
                    └────────────┬─────────────┘
                                 │
                                 │ HTTP
                                 ▼
              ┌────────────────────────────────────┐
              │       Spring Boot Backend           │
              │                                    │
              │  Serves HTML/CSS/JS                │
              │  REST API                          │
              │  MainController                    │
              └────────────────┬───────────────────┘
                               │
                               │ POST /predict
                               ▼
              ┌────────────────────────────────────┐
              │      Python ML Microservice        │
              │           Flask                    │
              │                                    │
              │  Loads trained ML models           │
              │  Performs prediction               │
              └────────────────┬───────────────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │ scikit-learn / joblib   │
                 │ trained model artifacts  │
                 └─────────────────────────┘
```

---

# ☁️ Production Deployment

Both services are deployed separately on Render:

```text
┌───────────────────────┐
│   Render Web Service  │
│                       │
│   Spring Boot Backend │
│                       │
│  Frontend + REST API  │
└───────────┬───────────┘
            │
            │ ML_SERVICE_URL
            │ HTTP POST /predict
            ▼
┌───────────────────────┐
│   Render Web Service  │
│                       │
│   Python ML Service   │
│       Flask           │
└───────────────────────┘
```

The backend receives the ML service URL through:

```text
ML_SERVICE_URL
```

This keeps the backend independent of the ML service's deployment URL.

---

# 📂 Project Structure

```text
AI_ICU_EARLY__WARNING_SYSTEM/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/icu/earlywarning/
│   │       │       ├── Application.java
│   │       │       └── MainController.java
│   │       │
│   │       └── resources/
│   │           ├── static/
│   │           │   ├── style.css
│   │           │   └── script.js
│   │           │
│   │           ├── templates/
│   │           │   └── index.html
│   │           │
│   │           └── application.properties
│   │
│   ├── pom.xml
│   ├── Dockerfile
│   └── target/
│
├── ml_service/
│   ├── app.py
│   ├── predict.py
│   ├── requirements.txt
│   ├── logistic_model.pkl
│   ├── random_forest_model.pkl
│   ├── scaler.pkl
│   ├── feature_columns.pkl
│   └── admission_map.pkl
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 🧩 Understanding the Main Folders

## `backend/`

This is the **main Spring Boot application**.

It is responsible for:

* Serving the frontend
* Handling browser requests
* Providing REST APIs
* Sending prediction requests to the Python ML service
* Returning ML predictions to the browser

### `src/main/java`

Contains the Java/Spring Boot backend code.

```text
src
└── main
    └── java
        └── backend Java code
```

### `src/main/resources`

Contains application resources.

The frontend is bundled inside Spring Boot:

```text
resources/
├── static/
│   ├── style.css
│   └── script.js
│
└── templates/
    └── index.html
```

Spring Boot uses:

* `templates/` → HTML templates
* `static/` → CSS, JavaScript, and other static files

Therefore, there is **no separate frontend deployment**.

---

# 🐍 `ml_service/`

This is the Python Flask microservice responsible only for machine-learning inference.

It:

1. Receives patient data
2. Loads the trained models
3. Performs prediction
4. Returns the prediction as JSON

### `app.py`

Flask API server.

### `predict.py`

Contains prediction and model inference logic.

The service exposes:

```text
GET  /health
POST /predict
```

---

# 🤖 ML Models

The Python service uses trained scikit-learn/joblib model artifacts:

```text
logistic_model.pkl
random_forest_model.pkl
scaler.pkl
feature_columns.pkl
admission_map.pkl
```

These files are required at runtime by the ML service.

They must therefore be committed to GitHub and must not be excluded by `.gitignore`.

---

# 🔄 Request Flow

## 1. Dashboard Loading

```text
Browser
   │
   │ GET /
   ▼
Spring Boot
   │
   ▼
MainController
   │
   ▼
templates/index.html
   │
   ▼
Browser
```

CSS and JavaScript are served from:

```text
static/
```

---

## 2. Prediction Flow

When the dashboard submits patient vitals:

```text
Browser
   │
   │ POST /predict
   │
   │ JSON patient vitals
   ▼
MainController.predict()
   │
   │ forwards JSON
   ▼
Python Flask ML Service
   │
   │ POST /predict
   ▼
predict.py
   │
   ├── Loads models
   ├── Processes features
   └── Generates prediction
   │
   ▼
Python ML Service
   │
   │ JSON response
   ▼
Spring Boot
   │
   │ returns response
   ▼
Browser
   │
   ▼
Dashboard updates
```

The browser does **not** directly communicate with the Python ML service.

This keeps the architecture simple:

```text
Browser → Spring Boot → ML Service
```

---

# 🚀 API

## `GET /`

Serves the ICU dashboard.

---

## `GET /health`

Health check endpoint.

Example response:

```json
{
  "status": "ok"
}
```

The deployed ML service can be checked at:

```text
https://ai-icu-early-warning-system.onrender.com/health
```

---

## `POST /predict`

Receives patient clinical data and returns the ML prediction.

### Example Request

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

### Example Response

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

---

# ⚙️ Configuration

Spring Boot reads the following environment variables:

```text
SERVER_PORT
ML_SERVICE_URL
```

Default values for local development:

```properties
server.port=${SERVER_PORT:7860}
ml.service.url=${ML_SERVICE_URL:http://localhost:5001}
```

## Production

On Render, the backend uses the port provided by Render through:

```text
SERVER_PORT
```

The ML service URL is configured using:

```text
ML_SERVICE_URL=https://ai-icu-early-warning-system.onrender.com
```

The actual Render port is injected automatically by the platform.

---

# 🐳 Docker

Both major services have their own Docker configuration.

```text
backend/
└── Dockerfile

ml_service/
└── Dockerfile
```

Each Dockerfile describes how that particular service is packaged into a container.

---

# 🐳 Docker Compose

The root-level:

```text
docker-compose.yml
```

is used to run the services together during local development.

Conceptually:

```text
docker-compose.yml
       │
       ├── Backend container
       │
       └── ML service container
```

Docker Compose is mainly useful for running the complete multi-service application locally.

The Render deployment uses the two services independently.

---

# 🛠️ Run Locally

## 1. Install Python dependencies

```bash
python -m pip install -r ml_service\requirements.txt
```

## 2. Start ML service

```bash
python ml_service\app.py
```

The ML service will run on:

```text
http://localhost:5001
```

## 3. Start Spring Boot

In another terminal:

```bash
cd backend
mvn clean package
java -jar target\early-warning-system-0.0.1-SNAPSHOT.jar
```

Open:

```text
http://localhost:7860
```

---

# 🐳 Run With Docker Compose

```bash
docker compose up --build
```

Then open:

```text
http://localhost:7860
```

---

# 📦 Maven `target/` Folder

The `target/` folder is generated by Maven during the build process.

For example:

```bash
mvn clean package
```

Maven uses:

```text
pom.xml
```

to understand the project's dependencies and build configuration.

It then compiles the Java source code and generates the deployable JAR inside:

```text
target/
```

The `target/` directory does not need to be manually maintained.

It can generally be ignored by Git because it can be regenerated using Maven.

---

# 📄 `pom.xml`

`pom.xml` is the Maven project configuration file.

It defines:

* Project information
* Java version
* Spring Boot version
* Dependencies
* Build plugins
* Resource configuration

For example, the project uses:

```text
Spring Boot
Spring Web
Thymeleaf
Spring Validation
```

---

# 🔐 `.gitignore`

`.gitignore` tells Git which files and folders should not be committed to the repository.

Typical generated files such as:

```text
target/
```

can be ignored because Maven can recreate them.

However, the ML model files inside `ml_service/` must remain available because the ML service needs them at runtime.

---

# 🚀 Deployment

The production application is deployed as **two independent Render Web Services**.

## Service 1 — ML Service

```text
Repository:
AI_ICU_EARLY__WARNING_SYSTEM

Root Directory:
ml_service/

Environment:
Python

Build Command:
pip install -r requirements.txt

Start Command:
python app.py
```

### Live ML Service

```text
https://ai-icu-early-warning-system.onrender.com
```

### Health Check

```text
https://ai-icu-early-warning-system.onrender.com/health
```

---

## Service 2 — Spring Boot Backend

```text
Repository:
AI_ICU_EARLY__WARNING_SYSTEM

Root Directory:
backend/

Environment:
Docker
```

The backend receives the ML service URL through:

```text
ML_SERVICE_URL
```

Production configuration:

```text
ML_SERVICE_URL=https://ai-icu-early-warning-system.onrender.com
```

### Live Application

```text
https://ai-icu-backend.onrender.com
```

---

# 🌐 Production Architecture

```text
                         INTERNET
                            │
                            ▼
              ┌──────────────────────────┐
              │     Render Backend       │
              │                          │
              │     Spring Boot          │
              │                          │
              │  HTML + CSS + JS         │
              │  REST API                │
              └────────────┬─────────────┘
                           │
                           │ HTTP /predict
                           ▼
              ┌──────────────────────────┐
              │     Render ML Service    │
              │                          │
              │       Flask              │
              │                          │
              │  scikit-learn models     │
              │  joblib artifacts        │
              └──────────────────────────┘
```

---

# ▶️ Application Startup Flow

When the Spring Boot application starts:

```text
java -jar early-warning-system-0.0.1-SNAPSHOT.jar
             ↓
Application.java
             ↓
SpringApplication.run(...)
             ↓
Spring Boot loads application.properties
             ↓
MainController is discovered
             ↓
Embedded Tomcat starts
             ↓
Application starts listening for HTTP requests
```

The port is controlled through:

```text
SERVER_PORT
```

and on Render the platform provides the required port.

---

# ⚠️ Important Deployment Notes

### ML service must be available first

The backend depends on the Python ML service for predictions.

Therefore:

```text
ML Service
    ↓
Backend
```

The backend must have the correct:

```text
ML_SERVICE_URL
```

configured.

### Render cold starts

On hosting plans where services sleep during inactivity, the first request after inactivity can take noticeably longer while the service starts again.

This can make the first prediction appear slow even though the application is working normally.

### Model files

The following files are required by the ML service:

```text
logistic_model.pkl
random_forest_model.pkl
scaler.pkl
feature_columns.pkl
admission_map.pkl
```

Make sure they are committed to GitHub and are not accidentally excluded by `.gitignore`.

---

# 🧰 Technology Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Java
* Spring Boot
* Spring Web
* Thymeleaf
* Maven

### Machine Learning

* Python
* Flask
* NumPy
* Pandas
* scikit-learn
* Joblib

### Deployment

* Docker
* Docker Compose
* Render
* GitHub

---

# 🔮 Future Improvements

Potential future improvements include:

* More realistic patient vital-sign simulation
* Persistent patient/bed state
* Improved temporal risk modeling
* LSTM/time-series based deterioration prediction
* Explainable AI visualizations
* Historical patient trend charts
* Authentication and role-based access
* Database integration
* WebSocket-based real-time updates
* Production-grade WSGI server for the ML service
* Monitoring and logging

---

# 👨‍💻 Project Highlights

This project demonstrates a **multi-service AI application architecture** where a Java Spring Boot application acts as the main backend and a Python Flask service handles machine-learning inference.

The system also demonstrates:

* REST API integration between Java and Python
* ML model serving
* Frontend integration with Spring Boot
* Docker-based deployment
* Environment-based configuration
* Independent service deployment
* Production deployment using Render
* Separation of application and ML responsibilities
