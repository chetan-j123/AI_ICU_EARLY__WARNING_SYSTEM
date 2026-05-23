export const SEQ_LEN = 12;
export const DEFAULT_PATIENT = "ICU-DEFAULT";

export const VITAL_DEFAULTS = Object.freeze({
  heart_rate: 80,
  spo2_pct: 97,
  systolic_bp: 120,
  diastolic_bp: 80,
  respiratory_rate: 16,
  temperature_c: 37,
  oxygen_flow: 2,
  mobility_score: 0,
  nurse_alert: 0,
  wbc_count: 8200,
  lactate: 1.2,
  creatinine: 0.9,
  crp_level: 0,
  hemoglobin: 13.5,
  sepsis_risk_score: 0,
  age: 65,
  comorbidity_index: 0,
  hour_from_admission: 2,
  gender: "M",
  oxygen_device: "nasal_cannula",
  admission_type: "emergency"
});

export const STREAM_DEFAULTS = Object.freeze({
  patient_id: DEFAULT_PATIENT,
  timestamp: null,
  heart_rate: 80,
  spo2_pct: 97,
  systolic_bp: 120,
  diastolic_bp: 80,
  respiratory_rate: 16,
  temperature_c: 37,
  cvp: 8,
  icp: 12,
  co2: 38,
  oxygen_flow: 2,
  gender: "M",
  admission_type: "emergency",
  oxygen_device: "nasal_cannula",
  age: 65,
  hour_from_admission: 2
});

const VITAL_NUMBER_FIELDS = [
  "heart_rate",
  "spo2_pct",
  "systolic_bp",
  "diastolic_bp",
  "respiratory_rate",
  "temperature_c",
  "oxygen_flow",
  "mobility_score",
  "nurse_alert",
  "wbc_count",
  "lactate",
  "creatinine",
  "crp_level",
  "hemoglobin",
  "sepsis_risk_score",
  "age",
  "comorbidity_index",
  "hour_from_admission"
];

const STREAM_NUMBER_FIELDS = [
  "timestamp",
  "heart_rate",
  "spo2_pct",
  "systolic_bp",
  "diastolic_bp",
  "respiratory_rate",
  "temperature_c",
  "cvp",
  "icp",
  "co2",
  "oxygen_flow",
  "age",
  "hour_from_admission"
];

function mergeDefaults(input, defaults) {
  const out = { ...defaults };
  for (const [key, value] of Object.entries(input || {})) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  }
  return out;
}

function toNumber(value, fallback) {
  if (value === null && fallback === null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toStringValue(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

export function normalizeVitalSnapshot(input = {}) {
  const raw = mergeDefaults(input, VITAL_DEFAULTS);
  const out = { ...raw };

  for (const field of VITAL_NUMBER_FIELDS) {
    out[field] = toNumber(raw[field], VITAL_DEFAULTS[field]);
  }

  out.gender = toStringValue(raw.gender, VITAL_DEFAULTS.gender);
  out.oxygen_device = toStringValue(raw.oxygen_device, VITAL_DEFAULTS.oxygen_device);
  out.admission_type = toStringValue(raw.admission_type, VITAL_DEFAULTS.admission_type);

  return out;
}

export function normalizeStreamVitals(input = {}) {
  const raw = mergeDefaults(input, STREAM_DEFAULTS);
  const out = { ...raw };

  for (const field of STREAM_NUMBER_FIELDS) {
    out[field] = toNumber(raw[field], STREAM_DEFAULTS[field]);
  }

  out.patient_id = toStringValue(raw.patient_id, STREAM_DEFAULTS.patient_id);
  out.gender = toStringValue(raw.gender, STREAM_DEFAULTS.gender);
  out.oxygen_device = toStringValue(raw.oxygen_device, STREAM_DEFAULTS.oxygen_device);
  out.admission_type = toStringValue(raw.admission_type, STREAM_DEFAULTS.admission_type);

  return out;
}
