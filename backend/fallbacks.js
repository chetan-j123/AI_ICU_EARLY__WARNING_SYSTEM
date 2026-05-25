
import { SEQ_LEN } from "./defaults.js";

export function classifyRisk(probability) {
  if (probability >= 0.55) return "CRITICAL";
  if (probability >= 0.30) return "BORDERLINE";
  return "STABLE";
}

function numeric(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function ruleBasedFallback(input = {}) {
  let score = 0;

  const hr = numeric(input.heart_rate, 80);
  const spo2 = numeric(input.spo2_pct, 97);
  const sbp = numeric(input.systolic_bp, 120);
  const rr = numeric(input.respiratory_rate, 16);
  const temp = numeric(input.temperature_c, 37);
  const lactate = numeric(input.lactate, 1.2);
  const creatinine = numeric(input.creatinine, 0.9);

  if (hr < 50 || hr > 130) score += 25;
  else if (hr < 60 || hr > 110) score += 10;

  if (spo2 < 85) score += 35;
  else if (spo2 < 90) score += 25;
  else if (spo2 < 94) score += 15;

  if (sbp < 80 || sbp > 200) score += 30;
  else if (sbp < 90 || sbp > 180) score += 20;

  if (rr < 8 || rr > 35) score += 25;
  if (temp < 35 || temp > 40) score += 20;

  if (lactate > 4) score += 25;
  else if (lactate > 2) score += 15;
  if (creatinine > 2) score += 20;

  score = Math.min(100, score);
  const probability = score / 100.0;

  return {
    risk_probability: Number(probability.toFixed(4)),
    risk_level: classifyRisk(probability),
    risk_score_pct: Number(probability.toFixed(2)),
    model: "rule-based-fallback",
    features_used: 7
  };
}

export function classifyTrend(currentProbability, futureProbability) {
  const delta = futureProbability - currentProbability;
  if (delta > 0.08) return "WORSENING";
  if (delta < -0.08) return "IMPROVING";
  return "STABLE";
}

export function makeForecastSeries(currentProbability, futureProbability, steps = 6) {
  return Array.from({ length: steps }, (_, index) => (
    currentProbability + (futureProbability - currentProbability) * (index / (steps - 1))
  ));
}

export function interpolationFallback(history = [], currentProbability = 0, sequenceLength = history.length) {
  // This is a fallback — the real LSTM did not produce a result.
  // Always return ready:false so the frontend knows to show "LSTM pending"
  // rather than a misleading zero-risk or linear-decay forecast.
  return {
    ready: false,
    future_risk_probability: null,
    trend: "UNKNOWN",
    confidence: 0,
    sequence_length: sequenceLength,
    sequence_required: SEQ_LEN,
    forecast_series: [],
    model: "interpolation-fallback",
    message: "LSTM unavailable — awaiting sufficient temporal data"
  };
}

export function notReadyLstm(currentProbability, sequenceLength, windowMs = 0) {
  const windowSeconds = Number((windowMs / 1000).toFixed(1));
  return {
    ready: false,
    future_risk_probability: null,
    trend: "STABLE",
    confidence: 0.0,
    sequence_length: sequenceLength,
    sequence_required: SEQ_LEN,
    window_seconds: windowSeconds,
    window_required_seconds: 300,
    forecast_series: [],
    model: "LSTM-not-ready",
    message: `LSTM pending: ${windowSeconds}s / 300s`
  };
}

export function combineRiskLevels(xgbLevel = "STABLE", lstmTrend = "STABLE") {
  const order = { STABLE: 0, BORDERLINE: 1, CRITICAL: 2 };
  const reverse = ["STABLE", "BORDERLINE", "CRITICAL"];
  let level = order[xgbLevel] ?? 0;

  if (lstmTrend === "WORSENING") level = Math.min(2, level + 1);
  else if (lstmTrend === "IMPROVING") level = Math.max(0, level - 1);

  return reverse[level];
}
