"""
Small JSON-lines bridge for Python-native ML artifacts.

The Node backend owns HTTP routes, static serving, request defaults, and
sequence buffering. This process only loads .pkl/.keras artifacts and returns
prediction JSON over stdin/stdout.
"""

from __future__ import annotations

import json
import os
import sys
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

try:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)
except Exception:
    pass

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[2]))
SEQ_LEN = 12

WARNINGS: List[str] = []

try:
    import numpy as np  # type: ignore
except Exception as exc:  # pragma: no cover - fallback path
    np = None  # type: ignore
    WARNINGS.append(f"numpy unavailable: {exc}")

try:
    import joblib  # type: ignore
except Exception as exc:  # pragma: no cover - fallback path
    joblib = None  # type: ignore
    WARNINGS.append(f"joblib unavailable: {exc}")

try:
    import xgboost as xgb  # type: ignore
except Exception as exc:  # pragma: no cover - fallback path
    xgb = None  # type: ignore
    WARNINGS.append(f"xgboost unavailable for SHAP drivers: {exc}")

xgb_model = None
lstm_model = None
lstm_scaler = None
lstm_features: List[str] = []
xgb_features: List[str] = []
top_features: List[str] = []
selected_model_dir: Optional[Path] = None
_load_attempted = False

GENDER_MAP = {"M": 1, "F": 0}
OXYGEN_DEVICE_MAP = {
    "none": 0,
    "room_air": 1,
    "nasal_cannula": 2,
    "mask": 3,
    "non_rebreather": 4,
    "bipap": 5,
    "cpap": 6,
    "ventilator": 7,
}
ADMISSION_TYPE_MAP = {
    "elective": 0,
    "emergency": 1,
    "urgent": 2,
}

FEATURE_LABELS = {
    "hour_from_admission": "Hour From Admission",
    "heart_rate": "Heart Rate",
    "respiratory_rate": "Respiratory Rate",
    "spo2_pct": "SpO2",
    "temperature_c": "Temperature",
    "systolic_bp": "Systolic BP",
    "diastolic_bp": "Diastolic BP",
    "oxygen_device": "Oxygen Device",
    "oxygen_flow": "Oxygen Flow",
    "mobility_score": "Mobility Score",
    "nurse_alert": "Nurse Alert",
    "wbc_count": "WBC Count",
    "lactate": "Lactate",
    "creatinine": "Creatinine",
    "crp_level": "CRP Level",
    "hemoglobin": "Hemoglobin",
    "sepsis_risk_score": "Sepsis Risk Score",
    "age": "Age",
    "gender": "Gender",
    "comorbidity_index": "Comorbidity Index",
    "admission_type": "Admission Type",
    "baseline_risk_score": "Baseline Risk Score",
    "los_hours": "LOS Hours",
    "MAP": "Mean Arterial Pressure",
    "shock_index": "Shock Index",
    "spo2_gap": "SpO2 Gap",
}


def log_warning(message: str) -> None:
    WARNINGS.append(message)
    print(f"[ml_bridge] {message}", file=sys.stderr)


def log_exception(message: str, exc: Exception) -> None:
    print(f"[ml_bridge] {message}: {exc}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)


def to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def round_float(value: float, digits: int) -> float:
    return float(round(float(value), digits))


def candidate_model_dirs() -> List[Path]:
    candidates: List[Path] = []
    env_dir = os.environ.get("MODEL_DIR")
    if env_dir:
        candidates.append(Path(env_dir))

    candidates.extend([
        PROJECT_ROOT / "ml" / "models_store",
        PROJECT_ROOT / "ml" / "model_store",
    ])

    seen = set()
    unique: List[Path] = []
    for directory in candidates:
        resolved = directory.resolve()
        if resolved not in seen:
            seen.add(resolved)
            unique.append(resolved)
    return unique


def directory_has_artifacts(directory: Path) -> bool:
    return directory.exists() and (
        any(directory.glob("*.pkl")) or any(directory.glob("*.keras"))
    )


def choose_model_dir() -> Optional[Path]:
    for directory in candidate_model_dirs():
        if directory_has_artifacts(directory):
            return directory
    return None


def find_artifact(directory: Path, filename: str, *patterns: str) -> Optional[Path]:
    direct = directory / filename
    if direct.exists():
        return direct

    for pattern in patterns:
        matches = sorted(directory.glob(pattern))
        if matches:
            return matches[0]

    return None


def load_pickle(path: Optional[Path], label: str):
    if path is None:
        log_warning(f"{label} not found")
        return None
    if joblib is None:
        log_warning(f"{label} not loaded because joblib is unavailable")
        return None

    try:
        return joblib.load(path)
    except Exception as exc:
        log_exception(f"Failed loading {label} from {path}", exc)
        return None


def load_all_models() -> bool:
    global _load_attempted, selected_model_dir
    global xgb_model, lstm_model, lstm_scaler
    global lstm_features, xgb_features, top_features

    if _load_attempted:
        return models_ready()
    _load_attempted = True

    selected_model_dir = choose_model_dir()
    if selected_model_dir is None:
        log_warning("No model artifact directory found")
        return False

    d = selected_model_dir
    print(f"[ml_bridge] Loading model artifacts from {d}", file=sys.stderr)

    xgb_model = load_pickle(find_artifact(d, "xgb_model.pkl", "xgb_model*.pkl"), "xgb_model.pkl")

    loaded_xgb_features = load_pickle(
        find_artifact(d, "xgb_features.pkl", "xgb_features*.pkl"),
        "xgb_features.pkl",
    )
    if loaded_xgb_features:
        xgb_features = list(loaded_xgb_features)

    loaded_lstm_features = load_pickle(
        find_artifact(d, "lstm_features.pkl", "lstm_features*.pkl"),
        "lstm_features.pkl",
    )
    if loaded_lstm_features:
        lstm_features = list(loaded_lstm_features)

    loaded_top_features = load_pickle(
        find_artifact(d, "top_features.pkl", "top_features*.pkl"),
        "top_features.pkl",
    )
    if loaded_top_features:
        top_features = list(loaded_top_features)

    lstm_scaler = load_pickle(
        find_artifact(d, "lstm_scaler.pkl", "lstm_scaler*.pkl"),
        "lstm_scaler.pkl",
    )

    keras_path = find_artifact(d, "lstm_model.keras", "lstm_model*.keras")
    if keras_path is None:
        log_warning("lstm_model.keras not found")
    else:
        try:
            from tensorflow.keras.models import load_model  # type: ignore

            lstm_model = load_model(str(keras_path))
        except Exception as exc:
            log_exception(f"Failed loading LSTM model from {keras_path}", exc)

    return models_ready()


def models_ready() -> bool:
    return all([
        xgb_model is not None,
        bool(xgb_features),
        lstm_model is not None,
        lstm_scaler is not None,
        bool(lstm_features),
        bool(top_features),
    ])


def classify_risk(probability: float) -> str:
    if probability >= 0.55:
        return "CRITICAL"
    if probability >= 0.30:
        return "BORDERLINE"
    return "STABLE"


def classify_trend(current_probability: float, future_probability: float) -> str:
    delta = future_probability - current_probability
    if delta > 0.08:
        return "WORSENING"
    if delta < -0.08:
        return "IMPROVING"
    return "STABLE"


def encode_categoricals(raw: Dict[str, Any]) -> Dict[str, Any]:
    d = dict(raw)
    d["gender"] = GENDER_MAP.get(str(d.get("gender", "M")), 0)
    d["admission_type"] = ADMISSION_TYPE_MAP.get(
        str(d.get("admission_type", "emergency")).lower(), 1
    )
    d["oxygen_device"] = OXYGEN_DEVICE_MAP.get(
        str(d.get("oxygen_device", "nasal_cannula")).lower(), 2
    )
    return d


def engineer_features(raw: Dict[str, Any]) -> Dict[str, Any]:
    d = dict(raw)
    sbp = to_float(d.get("systolic_bp"), 120)
    dbp = to_float(d.get("diastolic_bp"), 80)
    hr = to_float(d.get("heart_rate"), 80)
    spo2 = to_float(d.get("spo2_pct"), 97)

    d["MAP"] = (sbp + 2 * dbp) / 3
    d["shock_index"] = hr / (sbp + 1e-6)
    d["spo2_gap"] = 100 - spo2
    return d


def build_xgb_feature_vector(raw_input: Dict[str, Any]):
    if np is None:
        raise RuntimeError("numpy unavailable")

    d = engineer_features(encode_categoricals(raw_input))
    values = [to_float(d.get(feature), 0.0) for feature in xgb_features]
    return np.array([values], dtype=np.float32), d


def feature_label(feature: str) -> str:
    return FEATURE_LABELS.get(feature, feature.replace("_", " ").title())


def build_shap_drivers(x_matrix, engineered_row: Dict[str, Any], top_n: int = 5) -> List[Dict[str, Any]]:
    if xgb_model is None or not xgb_features or np is None:
        return []

    contributions = None
    try:
        if xgb is None:
            raise RuntimeError("xgboost package unavailable")
        booster = xgb_model.get_booster()
        dmatrix = xgb.DMatrix(x_matrix, feature_names=xgb_features)
        raw_contribs = booster.predict(dmatrix, pred_contribs=True)
        contributions = raw_contribs[0][:-1]
    except Exception as exc:
        log_warning(f"Native SHAP contribution unavailable: {exc}")

    if contributions is None:
        try:
            contributions = np.array(xgb_model.feature_importances_, dtype=float)
        except Exception as exc:
            log_warning(f"Feature-importance fallback unavailable: {exc}")
            return []

    abs_values = np.abs(contributions)
    total = float(abs_values.sum())
    if total <= 0:
        return []

    ranked_indices = np.argsort(abs_values)[::-1][:top_n]
    drivers = []
    for idx in ranked_indices:
        feature = xgb_features[int(idx)]
        contribution = float(contributions[int(idx)])
        abs_contribution = float(abs_values[int(idx)])
        drivers.append({
            "feature": feature,
            "label": feature_label(feature),
            "value": round_float(to_float(engineered_row.get(feature), 0.0), 3),
            "impact": round_float(contribution, 5),
            "impact_abs": round_float(abs_contribution, 5),
            "impact_pct": round_float((abs_contribution / total) * 100, 1),
            "direction": "increases" if contribution >= 0 else "decreases",
        })

    return drivers


def rule_based_fallback(raw_input: Dict[str, Any]) -> Dict[str, Any]:
    score = 0

    hr = to_float(raw_input.get("heart_rate"), 80)
    spo2 = to_float(raw_input.get("spo2_pct"), 97)
    sbp = to_float(raw_input.get("systolic_bp"), 120)
    rr = to_float(raw_input.get("respiratory_rate"), 16)
    temp = to_float(raw_input.get("temperature_c"), 37)
    lactate = to_float(raw_input.get("lactate"), 1.2)
    creatinine = to_float(raw_input.get("creatinine"), 0.9)

    if hr < 50 or hr > 130:
        score += 25
    elif hr < 60 or hr > 110:
        score += 10

    if spo2 < 85:
        score += 35
    elif spo2 < 90:
        score += 25
    elif spo2 < 94:
        score += 15

    if sbp < 80 or sbp > 200:
        score += 30
    elif sbp < 90 or sbp > 180:
        score += 20

    if rr < 8 or rr > 35:
        score += 25
    if temp < 35 or temp > 40:
        score += 20

    if lactate > 4:
        score += 25
    elif lactate > 2:
        score += 15
    if creatinine > 2:
        score += 20

    score = min(100, score)
    probability = score / 100.0

    return {
        "risk_probability": round_float(probability, 4),
        "risk_level": classify_risk(probability),
        "risk_score_pct": round_float(probability, 2),
        "model": "rule-based-fallback",
        "features_used": 7,
        "risk_drivers": rule_based_drivers(raw_input),
    }


def rule_based_drivers(raw_input: Dict[str, Any]) -> List[Dict[str, Any]]:
    candidates = [
        ("heart_rate", "Heart Rate", abs(to_float(raw_input.get("heart_rate"), 80) - 80) / 80),
        ("spo2_pct", "SpO2", max(0.0, 97 - to_float(raw_input.get("spo2_pct"), 97)) / 40),
        ("systolic_bp", "Systolic BP", abs(to_float(raw_input.get("systolic_bp"), 120) - 120) / 120),
        ("respiratory_rate", "Respiratory Rate", abs(to_float(raw_input.get("respiratory_rate"), 16) - 16) / 40),
        ("temperature_c", "Temperature", abs(to_float(raw_input.get("temperature_c"), 37) - 37) / 10),
        ("lactate", "Lactate", max(0.0, to_float(raw_input.get("lactate"), 1.2) - 1.2) / 5),
        ("creatinine", "Creatinine", max(0.0, to_float(raw_input.get("creatinine"), 0.9) - 0.9) / 4),
    ]
    ranked = sorted(candidates, key=lambda item: item[2], reverse=True)[:5]
    total = sum(score for _, _, score in ranked) or 1.0
    return [
        {
            "feature": feature,
            "label": label,
            "value": round_float(to_float(raw_input.get(feature), 0.0), 3),
            "impact": round_float(score, 5),
            "impact_abs": round_float(score, 5),
            "impact_pct": round_float((score / total) * 100, 1),
            "direction": "increases",
        }
        for feature, label, score in ranked
        if score > 0
    ]


def run_xgb_prediction(raw_input: Dict[str, Any]) -> Dict[str, Any]:
    if xgb_model is None or not xgb_features:
        return rule_based_fallback(raw_input)

    try:
        x_matrix, engineered_row = build_xgb_feature_vector(raw_input)
        probability = float(xgb_model.predict_proba(x_matrix)[0, 1])
        risk_level = classify_risk(probability)

        return {
            "risk_probability": round_float(probability, 4),
            "risk_level": risk_level,
            "risk_score_pct": round_float(probability * 100, 2),
            "model": "XGBoost",
            "features_used": len(xgb_features),
            "risk_drivers": build_shap_drivers(x_matrix, engineered_row),
        }
    except Exception as exc:
        log_exception("XGBoost inference error", exc)
        return rule_based_fallback(raw_input)


def compute_temporal_features(history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not history:
        return history

    enriched: List[Dict[str, Any]] = []
    previous_values: Dict[str, float] = {}
    rolling_values: Dict[str, List[float]] = {feature: [] for feature in top_features}

    for raw_row in history:
        row = engineer_features(encode_categoricals(raw_row))

        for feature in top_features:
            value = to_float(row.get(feature), 0.0)
            row[feature] = value

            if feature in previous_values:
                row[feature + "_delta"] = value - previous_values[feature]
            else:
                row[feature + "_delta"] = 0.0
            previous_values[feature] = value

            window = rolling_values[feature]
            window.append(value)
            if len(window) > 3:
                window.pop(0)
            row[feature + "_mean"] = sum(window) / len(window)

        enriched.append(row)

    return enriched


def build_lstm_sequence(history_with_temporal: List[Dict[str, Any]]):
    if np is None:
        raise RuntimeError("numpy unavailable")
    if len(history_with_temporal) < SEQ_LEN:
        return None

    window = history_with_temporal[-SEQ_LEN:]
    matrix = [
        [to_float(row.get(feature), 0.0) for feature in lstm_features]
        for row in window
    ]

    arr = np.array(matrix, dtype=np.float32)
    n_features = arr.shape[1]
    scaled = lstm_scaler.transform(arr.reshape(-1, n_features)).reshape(1, SEQ_LEN, n_features)
    return scaled.astype(np.float32)


def make_forecast_series(current: float, future: float, steps: int = 6) -> List[float]:
    return [
        current + (future - current) * (index / (steps - 1))
        for index in range(steps)
    ]


def interpolation_fallback(history: List[Dict[str, Any]], current_probability: float, sequence_length: int) -> Dict[str, Any]:
    risks = [to_float(row.get("risk"), current_probability) for row in history[-6:]]
    if len(risks) >= 2:
        trend_delta = risks[-1] - risks[0]
        future_probability = min(1.0, max(0.0, current_probability + trend_delta * 0.5))
    else:
        future_probability = current_probability

    trend = classify_trend(current_probability, future_probability)
    forecast = make_forecast_series(current_probability, future_probability)

    return {
        "ready": sequence_length >= SEQ_LEN,
        "future_risk_probability": round_float(future_probability, 4),
        "trend": trend,
        "confidence": 0.5,
        "sequence_length": sequence_length,
        "sequence_required": SEQ_LEN,
        "forecast_series": [round_float(value, 4) for value in forecast],
        "model": "interpolation-fallback",
    }


def run_lstm_prediction(history: List[Dict[str, Any]], current_xgb_prob: float, patient_id: str = "unknown") -> Dict[str, Any]:
    del patient_id
    history_with_temporal = compute_temporal_features(history)
    sequence_length = len(history_with_temporal)

    if sequence_length < SEQ_LEN:
        return {
            "ready": False,
            "future_risk_probability": current_xgb_prob,
            "trend": "STABLE",
            "confidence": 0.0,
            "sequence_length": sequence_length,
            "sequence_required": SEQ_LEN,
            "forecast_series": [],
            "model": "LSTM-not-ready",
            "message": f"Buffering: {sequence_length}/{SEQ_LEN} timesteps",
        }

    enriched = []
    for row in history_with_temporal:
        enriched_row = dict(row)
        enriched_row.setdefault("risk", current_xgb_prob)
        enriched.append(enriched_row)

    if lstm_model is None or lstm_scaler is None or not lstm_features:
        return interpolation_fallback(history_with_temporal, current_xgb_prob, sequence_length)

    try:
        sequence = build_lstm_sequence(enriched)
        if sequence is None:
            return interpolation_fallback(history_with_temporal, current_xgb_prob, sequence_length)

        raw_prediction = lstm_model.predict(sequence, verbose=0)
        future_probability = float(np.clip(raw_prediction.flatten()[0], 0, 1))
        trend = classify_trend(current_xgb_prob, future_probability)
        forecast_series = make_forecast_series(current_xgb_prob, future_probability)
        confidence = min(1.0, sequence_length / (SEQ_LEN * 2)) * 0.9 + 0.1

        return {
            "ready": True,
            "future_risk_probability": round_float(future_probability, 4),
            "trend": trend,
            "confidence": round_float(confidence, 3),
            "sequence_length": sequence_length,
            "sequence_required": SEQ_LEN,
            "forecast_series": [round_float(value, 4) for value in forecast_series],
            "model": "LSTM",
        }
    except Exception as exc:
        log_exception("LSTM inference error", exc)
        return interpolation_fallback(history_with_temporal, current_xgb_prob, sequence_length)


def health_payload() -> Dict[str, Any]:
    return {
        "ok": True,
        "models_ready": models_ready(),
        "xgb_ready": xgb_model is not None and bool(xgb_features),
        "lstm_ready": lstm_model is not None and lstm_scaler is not None and bool(lstm_features),
        "feature_counts": {
            "xgb_features": len(xgb_features),
            "lstm_features": len(lstm_features),
            "top_features": len(top_features),
        },
        "model_dir": str(selected_model_dir) if selected_model_dir else None,
        "warnings": WARNINGS[-10:],
    }


def handle_request(message: Dict[str, Any]) -> Any:
    action = message.get("action")
    payload = message.get("payload") or {}

    if action == "health":
        return health_payload()
    if action == "predict_current":
        return run_xgb_prediction(payload.get("input") or {})
    if action == "predict_lstm":
        return run_lstm_prediction(
            payload.get("history") or [],
            to_float(payload.get("current_xgb_prob"), 0.0),
            str(payload.get("patient_id") or "unknown"),
        )

    raise ValueError(f"Unknown action: {action}")


def respond(message_id: Any, ok: bool, result: Any = None, error: Optional[str] = None) -> None:
    payload: Dict[str, Any] = {
        "id": message_id,
        "ok": ok,
    }
    if ok:
        payload["result"] = result
    else:
        payload["error"] = error or "Unknown bridge error"

    print(json.dumps(payload, separators=(",", ":"), allow_nan=False), flush=True)


def main() -> None:
    load_all_models()

    for line in sys.stdin:
        if not line.strip():
            continue

        try:
            message = json.loads(line)
            result = handle_request(message)
            respond(message.get("id"), True, result=result)
        except Exception as exc:
            log_exception("Bridge request error", exc)
            try:
                message_id = message.get("id")  # type: ignore[name-defined]
            except Exception:
                message_id = None
            respond(message_id, False, error=str(exc))


if __name__ == "__main__":
    main()
