from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent
PYTHON_BRIDGE_DIR = PROJECT_ROOT / "backend" / "python"
if str(PYTHON_BRIDGE_DIR) not in sys.path:
    sys.path.insert(0, str(PYTHON_BRIDGE_DIR))

os.environ.setdefault("PROJECT_ROOT", str(PROJECT_ROOT))
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import ml_bridge  # noqa: E402

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger("icu-ml-service")

app = FastAPI(
    title="ICU Early Warning ML Service",
    version="2.0.0",
    description="FastAPI wrapper for the existing XGBoost and LSTM ICU prediction bridge.",
)

cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class BridgePredictRequest(BaseModel):
    action: str = Field(..., examples=["predict_current", "predict_lstm", "health"])
    payload: Dict[str, Any] = Field(default_factory=dict)


class CurrentPredictRequest(BaseModel):
    input: Dict[str, Any] = Field(default_factory=dict)


class LstmPredictRequest(BaseModel):
    history: list[Dict[str, Any]] = Field(default_factory=list)
    current_xgb_prob: float = 0.0
    patient_id: Optional[str] = "unknown"


@app.on_event("startup")
def startup() -> None:
    try:
        ready = ml_bridge.load_all_models()
        logger.info("ML artifacts loaded. models_ready=%s", ready)
    except Exception:
        logger.exception("Model loading failed during startup")


@app.get("/health")
def health() -> Dict[str, Any]:
    try:
        ml_bridge.load_all_models()
        return ml_bridge.health_payload()
    except Exception as exc:
        logger.exception("Health check failed")
        return {
            "ok": False,
            "models_ready": False,
            "error": str(exc),
            "warnings": ml_bridge.WARNINGS[-10:],
        }


@app.post("/predict")
def predict(request: BridgePredictRequest) -> Dict[str, Any]:
    try:
        ml_bridge.load_all_models()
        result = ml_bridge.handle_request({
            "action": request.action,
            "payload": request.payload,
        })
        return {"ok": True, "result": result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction request failed for action=%s", request.action)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/predict/current")
def predict_current(request: CurrentPredictRequest) -> Dict[str, Any]:
    try:
        ml_bridge.load_all_models()
        return ml_bridge.run_xgb_prediction(request.input)
    except Exception as exc:
        logger.exception("Current prediction failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/predict/lstm")
def predict_lstm(request: LstmPredictRequest) -> Dict[str, Any]:
    try:
        ml_bridge.load_all_models()
        return ml_bridge.run_lstm_prediction(
            request.history,
            request.current_xgb_prob,
            request.patient_id or "unknown",
        )
    except Exception as exc:
        logger.exception("LSTM prediction failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
