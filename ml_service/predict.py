import os
import numpy as np
import pandas as pd
import joblib

# -------------------------------------------------------------------
# BASE DIRECTORY
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -------------------------------------------------------------------
# LOAD SAVED MODELS + SCALER + FEATURE LIST (LOAD ONCE)
# -------------------------------------------------------------------
logreg = joblib.load(os.path.join(BASE_DIR, "logistic_model.pkl"))
rf = joblib.load(os.path.join(BASE_DIR, "random_forest_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))
feature_cols = joblib.load(os.path.join(BASE_DIR, "feature_columns.pkl"))

# LOAD ADMISSION MAP ONCE (FIXED)
admission_map = joblib.load(os.path.join(BASE_DIR, "admission_map.pkl"))

# -------------------------------------------------------------------
# CUSTOM SOFT-VOTING ENSEMBLE
# -------------------------------------------------------------------
def ensemble_predict(log_prob, rf_prob, threshold=0.260):
    final_prob = 0.25 * log_prob + 0.75 * rf_prob
    final_pred = (final_prob >= threshold).astype(int)
    return final_prob, final_pred


def predict_single(input_dict):
    """
    input_dict = {
        "heart_rate": 85,
        "spo2_pct": 94,
        "systolic_bp": 120,
        ...
    }
    """

    df = pd.DataFrame([input_dict])
    print("feature generation se phle  featues", df.columns)

    # ----------------------------------------------------------------
    # FEATURE ENGINEERING
    # ----------------------------------------------------------------

    # MAP + Pulse Pressure + Shock Index
    df["MAP"] = (df["systolic_bp"] + 2 * df["diastolic_bp"]) / 3
    df["pulse_pressure"] = df["systolic_bp"] - df["diastolic_bp"]
    df["shock_index"] = df["heart_rate"] / df["systolic_bp"]
    df["spo2_gap"] = 100 - df["spo2_pct"]

    # LAB ENGINEERED
    df["inflammation_index"] = df["wbc_count"] * df["crp_level"]
    df["organ_stress"] = df["lactate"] + df["creatinine"]
    df["anemia_flag"] = (df["hemoglobin"] < 12).astype(int)
    df["kidney_risk"] = (df["creatinine"] > 1.2).astype(int)
    df["high_lactate_flag"] = (df["lactate"] > 2).astype(int)

    # OXYGEN DEVICE MAP
    device_map = {
        "none": 0,
        "room_air": 0,
        "nasal_cannula": 1,
        "mask": 2,
        "non_rebreather": 2,
        "bipap": 3,
        "cpap": 3,
        "ventilator": 4
    }
    df["oxygen_device_encoded"] = (
        df["oxygen_device"].str.lower().map(device_map).fillna(0)
    )
    df["oxygen_need_score"] = df["oxygen_flow"] * df["oxygen_device_encoded"]

    # DEMOGRAPHICS
    df["gender_encoded"] = df["gender"].replace({"M": 1, "F": 0}).fillna(0)
    df["age_bucket"] = pd.cut(
        df["age"],
        bins=[0, 30, 50, 70, 120],
        labels=[0, 1, 2, 3]
    ).astype(float)

    # ADMISSION TYPE (USING PRELOADED MAP)
    df["admission_type_encoded"] = (
        df["admission_type"].map(admission_map).fillna(0)
    )

    # EARLY STABILITY SCORE
    df["early_stability_score"] = (
        df["MAP"].fillna(0)
        + df["spo2_pct"].fillna(0)
        + (100 - df["heart_rate"].fillna(0))
    )

    # FINAL: remove unused columns
    df = df.drop(
        columns=["oxygen_device", "gender", "admission_type"],
        errors="ignore"
    )

    # ----------------------------------------------------------------
    # ENSURE CORRECT FEATURE ORDER
    # ----------------------------------------------------------------
    df = df.reindex(columns=feature_cols)
    print(
        "feature generation se bad features featues yani model ko dene k liye features",
        df.columns
    )

    # HANDLE INF / NaN
    df = df.replace([np.inf, -np.inf], np.nan).fillna(0)

    # SCALE
    X_scaled = scaler.transform(df.values)

    # MODEL PROBABILITIES
    log_prob = logreg.predict_proba(X_scaled)[:, 1]
    rf_prob = rf.predict_proba(X_scaled)[:, 1]

    # ENSEMBLE
    final_prob, final_pred = ensemble_predict(log_prob, rf_prob)

    print("feture sequence in predict = ", df.columns)

    return {
        "logistic_prob": float(log_prob[0]),
        "rf_prob": float(rf_prob[0]),
        "final_prob": float(final_prob[0] * 1.5),  # UNCHANGED AS REQUESTED
        "final_pred": int(final_pred[0])
    }


# -------------------------------------------------------------------
# LOCAL TESTING ONLY
# -------------------------------------------------------------------
if __name__ == "__main__":
    examples = {
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

    print("\n--- Prediction ---")
    result = predict_single(examples)
    print(result)
