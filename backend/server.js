import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_PATIENT, SEQ_LEN, normalizeStreamVitals, normalizeVitalSnapshot } from "./defaults.js";
import { classifyRisk, combineRiskLevels, interpolationFallback, notReadyLstm, ruleBasedFallback } from "./fallbacks.js";
import { MlBridgeClient } from "./mlBridgeClient.js";
import { sequenceManager } from "./sequenceBuffer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(PROJECT_ROOT, "frontend");
const STATIC_DIR = path.join(FRONTEND_DIR, "static");
const INDEX_HTML = path.join(FRONTEND_DIR, "templates", "index.html");

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";
const BODY_LIMIT_BYTES = 1024 * 1024;

const mlBridge = new MlBridgeClient({
  projectRoot: PROJECT_ROOT,
  scriptPath: path.join(__dirname, "python", "ml_bridge.py")
});

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    ...corsHeaders(),
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end(text);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function readJsonBody(req) {
  let body = "";
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > BODY_LIMIT_BYTES) {
      throw httpError(413, "Request body too large");
    }
    body += chunk.toString("utf8");
  }

  if (!body.trim()) return {};

  try {
    return JSON.parse(body);
  } catch {
    throw httpError(400, "Invalid JSON body");
  }
}

async function serveFile(req, res, filePath) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) throw httpError(404, "File not found");

  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    ...corsHeaders(),
    "Content-Type": contentType,
    "Content-Length": fileStat.size
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

async function serveStatic(req, reqUrl, res) {
  const relativePath = decodeURIComponent(reqUrl.pathname.slice("/static/".length));
  const filePath = path.normalize(path.join(STATIC_DIR, relativePath));
  const staticRelative = path.relative(STATIC_DIR, filePath);

  if (staticRelative.startsWith("..") || path.isAbsolute(staticRelative)) {
    throw httpError(403, "Forbidden");
  }

  await serveFile(req, res, filePath);
}

async function predictCurrent(rawVitals) {
  try {
    return await mlBridge.request("predict_current", { input: rawVitals });
  } catch (error) {
    console.warn(`[node-backend] ML bridge current prediction failed: ${error.message}`);
    return ruleBasedFallback(rawVitals);
  }
}

async function predictTemporal(history, currentXgbProbability, patientId) {
  if (history.length < SEQ_LEN) {
    return notReadyLstm(currentXgbProbability, history.length);
  }

  try {
    return await mlBridge.request("predict_lstm", {
      history,
      current_xgb_prob: currentXgbProbability,
      patient_id: patientId
    });
  } catch (error) {
    console.warn(`[node-backend] ML bridge temporal prediction failed: ${error.message}`);
    return interpolationFallback(history, currentXgbProbability, history.length);
  }
}

function buildEnsemblePrediction(xgbResult, lstmResult) {
  const parsedXgbProbability = Number(xgbResult?.risk_probability);
  const parsedLstmProbability = Number(lstmResult?.future_risk_probability);
  const xgbProbability = Number.isFinite(parsedXgbProbability) ? parsedXgbProbability : 0;
  const lstmProbability = Number.isFinite(parsedLstmProbability) ? parsedLstmProbability : xgbProbability;
  const probability = Math.min(1, Math.max(0, (xgbProbability + lstmProbability) / 2));

  return {
    risk_probability: Number(probability.toFixed(4)),
    risk_level: classifyRisk(probability),
    risk_score_pct: Number((probability * 100).toFixed(2)),
    model: "equal-weight-ensemble",
    weights: {
      xgb: 0.5,
      lstm: 0.5
    }
  };
}

async function handleHealth(res) {
  try {
    const bridgeHealth = await mlBridge.request("health", {});
    sendJson(res, 200, {
      status: "ok",
      models_ready: Boolean(bridgeHealth.models_ready),
      version: "2.0.0-node-xgb-lstm",
      bridge: bridgeHealth
    });
  } catch (error) {
    sendJson(res, 200, {
      status: "ok",
      models_ready: false,
      version: "2.0.0-node-xgb-lstm",
      bridge: {
        ok: false,
        error: error.message
      }
    });
  }
}

async function handlePredictCurrent(req, res) {
  const payload = normalizeVitalSnapshot(await readJsonBody(req));
  const prediction = await predictCurrent(payload);
  sendJson(res, 200, { success: true, prediction });
}

async function handlePredictTemporal(req, res) {
  const rawBody = await readJsonBody(req);
  const payload = normalizeVitalSnapshot(rawBody);
  const patientId = rawBody.patient_id || DEFAULT_PATIENT;
  const xgbResult = await predictCurrent(payload);
  const currentProbability = Number(xgbResult.risk_probability) || 0;

  sequenceManager.pushVitals(patientId, {
    ...payload,
    risk: currentProbability,
    xgb_risk_probability: currentProbability
  });
  const history = sequenceManager.getWindow(patientId);

  const prediction = await predictTemporal(history, currentProbability, patientId);
  sendJson(res, 200, { success: true, prediction });
}

async function handlePredictCombined(req, res) {
  const rawBody = await readJsonBody(req);
  const patientId = rawBody.patient_id || DEFAULT_PATIENT;
  const payload = normalizeVitalSnapshot(rawBody);

  const xgbResult = await predictCurrent(payload);
  const currentProbability = Number(xgbResult.risk_probability) || 0;
  sequenceManager.pushVitals(patientId, {
    ...payload,
    risk: currentProbability,
    xgb_risk_probability: currentProbability
  });
  const history = sequenceManager.getWindow(patientId);
  const lstmResult = await predictTemporal(history, currentProbability, patientId);
  const ensembleResult = buildEnsemblePrediction(xgbResult, lstmResult);

  sendJson(res, 200, {
    success: true,
    patient_id: patientId,
    prediction: {
      xgb: xgbResult,
      lstm: lstmResult,
      ensemble: ensembleResult,
      shap_drivers: xgbResult.risk_drivers || []
    }
  });
}

async function handleStreamVitals(req, res) {
  try {
    const payload = normalizeStreamVitals(await readJsonBody(req));
    const patientId = payload.patient_id || DEFAULT_PATIENT;
    const { patient_id: _patientId, timestamp: _timestamp, ...vitals } = payload;

    sequenceManager.pushVitals(patientId, vitals);

    sendJson(res, 200, {
      success: true,
      patient_id: patientId,
      buffer_length: sequenceManager.sequenceLength(patientId),
      sequence_required: SEQ_LEN,
      lstm_ready: sequenceManager.isReady(patientId)
    });
  } catch (error) {
    sendJson(res, 200, { success: false, error: error.message });
  }
}

async function handlePatientState(reqUrl, res) {
  try {
    const patientId = reqUrl.searchParams.get("patient_id") || DEFAULT_PATIENT;
    const history = sequenceManager.getWindow(patientId);
    const sequenceLength = sequenceManager.sequenceLength(patientId);

    const currentRisk = await predictCurrent({});
    const temporalRisk = await predictTemporal(
      history,
      Number(currentRisk.risk_probability) || 0,
      patientId
    );

    const combinedLevel = combineRiskLevels(currentRisk.risk_level, temporalRisk.trend);

    sendJson(res, 200, {
      success: true,
      patient_id: patientId,
      buffer_length: sequenceLength,
      current_risk: currentRisk,
      temporal_risk: temporalRisk,
      combined_level: combinedLevel
    });
  } catch (error) {
    sendJson(res, 500, { success: false, error: error.message });
  }
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = reqUrl.pathname;

  try {
    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/") {
      await serveFile(req, res, INDEX_HTML);
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname.startsWith("/static/")) {
      await serveStatic(req, reqUrl, res);
      return;
    }

    if (req.method === "GET" && pathname === "/health") {
      await handleHealth(res);
      return;
    }

    if (req.method === "POST" && pathname === "/predict/current") {
      await handlePredictCurrent(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/predict/temporal") {
      await handlePredictTemporal(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/predict/combined") {
      await handlePredictCombined(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/stream/vitals") {
      await handleStreamVitals(req, res);
      return;
    }

    if (req.method === "GET" && pathname === "/patient/state") {
      await handlePatientState(reqUrl, res);
      return;
    }

    if (req.method === "GET" && pathname === "/docs") {
      sendJson(res, 200, {
        title: "ICU Early Warning System API",
        version: "2.0.0-node-xgb-lstm",
        endpoints: [
          "GET /health",
          "POST /predict/current",
          "POST /predict/temporal",
          "POST /predict/combined",
          "POST /stream/vitals",
          "GET /patient/state?patient_id=ICU-DEFAULT"
        ]
      });
      return;
    }

    sendText(res, 404, "Not found");
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      console.error(`[node-backend] ${error.stack || error.message}`);
    }
    sendJson(res, statusCode, { success: false, error: error.message });
  }
}

createServer(handleRequest).listen(PORT, HOST, () => {
  console.log(`ICU Node backend listening on http://localhost:${PORT}`);
  console.log(`Serving dashboard from ${INDEX_HTML}`);
});
