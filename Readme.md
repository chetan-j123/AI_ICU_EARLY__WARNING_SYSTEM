# ICU Vital Sentinel — AI-Powered ICU Early Warning System
 
> **A real-time Intensive Care Unit (ICU) patient monitoring dashboard that fuses live physiological waveforms with a dual-model ML ensemble (XGBoost + LSTM) to predict in-hospital mortality risk and warn clinicians of deterioration before it becomes a crisis.**
 
---
 
## Table of Contents
 
1. [Project Overview](#1-project-overview)
2. [Who Is This For?](#2-who-is-this-for)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Deep Dive: Every File Explained](#5-deep-dive-every-file-explained)
   - [5.1 `package.json`](#51-packagejson)
   - [5.2 `NODE_BACKEND.md`](#52-node_backendmd)
   - [5.3 `backend/server.js`](#53-backendserverjs)
   - [5.4 `backend/defaults.js`](#54-backenddefaultsjs)
   - [5.5 `backend/fallbacks.js`](#55-backendfallbacksjs)
   - [5.6 `backend/mlBridgeClient.js`](#56-backendmlbridgeclientjs)
   - [5.7 `backend/sequenceBuffer.js`](#57-backendsequencebufferjs)
   - [5.8 `backend/python/ml_bridge.py`](#58-backendpythonml_bridgepy)
   - [5.9 `frontend/templates/index.html`](#59-frontendtemplatesindexhtml)
   - [5.10 `frontend/static/style.css`](#510-frontendstaticstylecss)
   - [5.11 `frontend/static/script.js`](#511-frontendstaticscriptjs)
   - [5.12 `ml/model_store/` — Trained ML Artifacts](#512-mlmodel_store--trained-ml-artifacts)
   - [5.13 `.git/` — Version Control](#513-git--version-control)
6. [Data Flow](#6-data-flow)
7. [Key Algorithms & Business Logic](#7-key-algorithms--business-logic)
   - [7.1 XGBoost: Instantaneous Risk](#71-xgboost-instantaneous-risk)
   - [7.2 LSTM: Temporal Risk Forecasting](#72-lstm-temporal-risk-forecasting)
   - [7.3 Ensemble Fusion](#73-ensemble-fusion)
   - [7.4 SHAP Feature Attribution](#74-shap-feature-attribution)
   - [7.5 Rule-Based Fallback](#75-rule-based-fallback)
   - [7.6 Patient Phase Simulation](#76-patient-phase-simulation)
   - [7.7 Waveform Rendering Engine](#77-waveform-rendering-engine)
8. [API Reference](#8-api-reference)
9. [Error Handling & Edge Cases](#9-error-handling--edge-cases)
10. [Setup & Installation](#10-setup--installation)
11. [Usage Examples](#11-usage-examples)
12. [Dependencies & Why Each Is Needed](#12-dependencies--why-each-is-needed)
13. [Possible Improvements & Known Issues](#13-possible-improvements--known-issues)
---
 
## 1. Project Overview
 
**ICU Vital Sentinel** is a full-stack clinical decision-support prototype for Intensive Care Units. It monitors a simulated ICU patient in real time and runs two complementary machine-learning models every second:
 
| Model | Type | What it predicts |
|---|---|---|
| **XGBoost** | Gradient-boosted tree | _Right now_ — instantaneous mortality risk from a single vital-sign snapshot |
| **LSTM** | Recurrent neural network | _In the future_ — risk trajectory over the next ~12 hours from a 5-minute historical window |
 
The outputs of both models are blended into an **ensemble probability** displayed on an animated clinical dashboard that mimics real bedside patient monitors — complete with scrolling ECG, SpO₂, ABP, CVP, PAP, ICP, and CO₂ waveforms, a risk gauge, SHAP feature importance bars, a vital heatmap, and an alert banner.
 
The architecture is deliberately **dual-language**:
- The HTTP server, routing, waveform state, and sequence buffering all live in **Node.js** (fast, I/O-efficient, no Python overhead per request).
- The ML inference runs in a long-lived **Python subprocess** that stays warm so model loading cost is paid only once.
- The two processes communicate over **stdin/stdout using newline-delimited JSON-RPC** — no network sockets, no HTTP overhead.
---
 
## 2. Who Is This For?
 
- **Clinical informatics teams** exploring AI-assisted early warning scoring (e.g. NEWS2, SOFA augmentation).
- **ML engineers** building hospital deterioration models who need a polished demo harness.
- **Healthcare startups** prototyping ICU monitoring UIs.
- **Students / researchers** studying how XGBoost and LSTM can be combined for medical time-series risk prediction.
---
 
## 3. Tech Stack
 
| Layer | Technology | Version / Notes |
|---|---|---|
| Runtime | **Node.js** | ESM (`"type":"module"`), built-ins only, zero npm dependencies |
| HTTP server | `node:http` | Raw `createServer` — no Express or Fastify |
| File serving | `node:fs`, `node:path` | Stream-based, avoids loading large files into memory |
| ML bridge | **Python 3** | Spawned as a subprocess; reads stdin, writes stdout |
| Gradient boost | **XGBoost** (`xgboost` pip package) | `.pkl` artifact via `joblib` |
| Deep learning | **TensorFlow / Keras** | `.keras` artifact, `lstm_model.predict()` |
| Numerical | **NumPy** | Feature engineering, sequence slicing, SHAP contribs |
| Serialization | **joblib** | Loading `.pkl` model artifacts |
| Frontend | **Vanilla HTML5 / CSS3 / JS** | No bundler, no framework |
| Rendering | **Canvas API** | 16 animated physiological waveforms |
| Charts | **Inline SVG** | Risk gauge, trajectory chart |
| Fonts | **Google Fonts** | JetBrains Mono, Inter |
| VCS | **Git** | Single "Initial commit" |
 
---
 
## 4. Project Structure
 
```
aiml_project/
│
├── package.json                  # Node project manifest & npm scripts
├── NODE_BACKEND.md               # Quick-start guide for the backend
│
├── backend/                      # Node.js server layer
│   ├── server.js                 # Main HTTP server & route handlers
│   ├── defaults.js               # Vital defaults & input normalizers
│   ├── fallbacks.js              # Rule-based risk scoring & fallback shapes
│   ├── mlBridgeClient.js         # Subprocess IPC client for Python bridge
│   ├── sequenceBuffer.js         # In-memory time-series buffer for LSTM
│   └── python/
│       └── ml_bridge.py          # Python ML inference daemon (XGBoost + LSTM)
│
├── frontend/
│   ├── templates/
│   │   └── index.html            # Single-page dashboard shell (639 lines)
│   └── static/
│       ├── script.js             # All frontend logic (~2172 lines)
│       └── style.css             # Dark clinical theme (~1546 lines)
│
└── ml/
    └── model_store/              # Pre-trained binary model artifacts
        ├── xgb_model.pkl         # XGBoost classifier (~3 MB)
        ├── xgb_features.pkl      # Ordered list of XGBoost input features
        ├── lstm_model - Copy.keras     # Keras LSTM model (~483 KB)
        ├── lstm_features - Copy.pkl    # Ordered list of LSTM input features
        ├── lstm_scaler - Copy.pkl      # StandardScaler for LSTM inputs
        └── top_features - Copy.pkl     # Features used for temporal engineering
```
 
> **Note on ` - Copy` filenames:** The LSTM artifacts have `- Copy` in their names (e.g., `lstm_model - Copy.keras`). The Python bridge explicitly supports these via glob patterns (`lstm_model*.keras`), so they load correctly without renaming. This is a developer artifact from copying files.
 
---
 
## 5. Deep Dive: Every File Explained
 
---
 
### 5.1 `package.json`
 
```json
{
  "name": "icu-early-warning-node-backend",
  "version": "2.0.0-node",
  "private": true,
  "type": "module",
  "description": "Node.js backend for the ICU Early Warning System, with a small Python ML artifact bridge.",
  "scripts": {
    "build": "node --check backend/server.js",
    "start": "node backend/server.js",
    "dev":   "node --watch backend/server.js"
  },
  "dependencies": {}
}
```
 
**Line-by-line breakdown:**
 
| Key | Value | What it does |
|---|---|---|
| `name` | `icu-early-warning-node-backend` | Package identity. `private: true` prevents accidental `npm publish`. |
| `version` | `2.0.0-node` | Semantic version. The `-node` suffix signals this is the Node.js rewrite of a presumably earlier Python (Flask?) backend. |
| `"type": "module"` | — | **Critical.** Tells Node.js to treat all `.js` files as ES Modules (uses `import`/`export`, not `require`/`module.exports`). Without this, every `import` statement would throw. |
| `build` | `node --check backend/server.js` | Syntax-checks the server without running it. CI-friendly "does it parse?" gate. |
| `start` | `node backend/server.js` | Production start command. |
| `dev` | `node --watch backend/server.js` | Restarts the server automatically on any file change (Node 18+ built-in file-watcher). No nodemon needed. |
| `dependencies` | `{}` | **Zero runtime dependencies.** The entire HTTP server is built from Node built-ins only. |
 
---
 
### 5.2 `NODE_BACKEND.md`
 
A short developer quick-start document. Key points it documents:
 
- The server exposes six API paths (`/health`, `/predict/current`, `/predict/temporal`, `/predict/combined`, `/stream/vitals`, `/patient/state`).
- Python is used **only** for ML inference via `ml_bridge.py`.
- The bridge auto-searches both `ml/models_store` and `ml/model_store` directories (handles a common typo).
- It also handles the `- Copy` filename suffix via glob.
- The `$env:ML_PYTHON` environment variable allows overriding which Python executable is used — crucial when the system Python has the ML packages but a virtual environment does not.
- Start command: `npm start`, then open `http://localhost:8000/`.
---
 
### 5.3 `backend/server.js`
 
The **main entry point** and HTTP request router. ~330 lines, zero external dependencies.
 
#### Module Imports
 
```js
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
```
 
All from Node built-ins. `fileURLToPath` is needed because ES Modules don't have `__dirname` — it must be reconstructed from `import.meta.url`.
 
#### Path Setup
 
```js
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");       // → aiml_project/
const FRONTEND_DIR = path.join(PROJECT_ROOT, "frontend");
const STATIC_DIR   = path.join(FRONTEND_DIR, "static");
const INDEX_HTML   = path.join(FRONTEND_DIR, "templates", "index.html");
```
 
Derives all serve paths relative to `server.js`'s own location. This means the server works regardless of the current working directory.
 
#### Configuration Constants
 
```js
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";  // binds on all interfaces
const BODY_LIMIT_BYTES = 1024 * 1024;         // 1 MB max request body
```
 
#### ML Bridge Instantiation
 
```js
const mlBridge = new MlBridgeClient({
  projectRoot: PROJECT_ROOT,
  scriptPath: path.join(__dirname, "python", "ml_bridge.py")
});
```
 
The bridge is a singleton, created once at startup. It lazy-starts the Python subprocess on the first `request()` call.
 
#### MIME Type Map
 
```js
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  // ...png, jpg, svg, ico
};
```
 
Used by `serveFile()` to set the correct `Content-Type` header based on file extension.
 
#### Helper Functions
 
**`corsHeaders()`** — Returns CORS headers that allow any origin. This is intentionally permissive since this is a prototype/demo tool, not a production multi-tenant server.
 
**`sendJson(res, statusCode, payload)`** — Sets JSON content type, serializes the payload with `JSON.stringify`, and ends the response. Used by every API handler.
 
**`sendText(res, statusCode, text)`** — Plain text response helper. Used for 404s.
 
**`httpError(statusCode, message)`** — Creates a standard `Error` object with an extra `.statusCode` property. This allows error handlers to distinguish between 400 (client error) and 500 (server error).
 
**`readJsonBody(req)`** — An `async` body reader that:
1. Iterates the request stream chunk-by-chunk.
2. Accumulates bytes, throwing `413 Request body too large` if the total exceeds 1 MB.
3. Parses the result as JSON, throwing `400 Invalid JSON body` on malformed input.
4. Returns `{}` for empty bodies (so handlers never receive `null`).
**`serveFile(req, res, filePath)`** — Serves a single file:
1. `stat(filePath)` — verifies it's a real file (throws 404 if not).
2. Sets `Content-Type` from MIME map.
3. Sets `Content-Length` (important for HTTP/1.1 keep-alive).
4. For `HEAD` requests, sends headers only (no body) — correct HTTP behavior.
5. Pipes the file via `createReadStream` — never loads the whole file into memory.
**`serveStatic(req, reqUrl, res)`** — Serves files from `/static/`:
1. Decodes the URL path (handles `%20` etc.).
2. Strips the `/static/` prefix.
3. **Path traversal check**: if the resolved path is outside `STATIC_DIR` (starts with `..` or is absolute), throws `403 Forbidden`. This prevents `GET /static/../../../etc/passwd` attacks.
#### Route Handlers
 
**`predictCurrent(rawVitals)`**
- Calls `mlBridge.request("predict_current", { input: rawVitals })`.
- Logs the XGBoost prediction to the server console.
- On failure, returns `ruleBasedFallback(rawVitals)` from `fallbacks.js` instead of crashing.
**`predictTemporal(history, currentXgbProbability, patientId)`**
- First checks whether the sequence buffer has enough data:
  - Needs ≥ `SEQ_LEN` (12) rows **and** ≥ `WINDOW_REQUIRED_MS` (300,000 ms = 5 minutes) of elapsed time.
  - The window is floored to the nearest 100 ms to avoid floating-point near-miss (`298.9s < 300s` when it shouldn't matter).
- If not ready, returns `notReadyLstm(...)` immediately without calling Python.
- If ready, calls `mlBridge.request("predict_lstm", ...)`.
- On failure, returns `interpolationFallback(...)`.
**`buildEnsemblePrediction(xgbResult, lstmResult)`**
- Parses both model outputs defensively using `Number.isFinite`.
- If LSTM is ready (`lstmResult.ready === true`), blends 50/50: `(xgb + lstm) / 2`.
- If LSTM is still buffering, uses XGBoost result only, labels model as `"xgb-only (lstm-pending)"`.
- Clamps the final probability to `[0, 1]`.
- Classifies risk level via `classifyRisk()`.
**`handlePredictCombined(req, res)`** — The main endpoint the frontend uses every second:
1. Reads and normalizes the request body.
2. Runs XGBoost (`predictCurrent`).
3. Pushes vitals into the sequence buffer.
4. Runs LSTM (`predictTemporal`).
5. Builds the ensemble.
6. Returns all three results in one response (`xgb`, `lstm`, `ensemble`, `shap_drivers`).
**`handleStreamVitals(req, res)`** — A lighter endpoint just for buffering vitals without triggering inference. Returns buffer length and LSTM readiness status.
 
**`handlePatientState(reqUrl, res)`** — Fetches a full combined state snapshot for a patient (for dashboard initialization).
 
**`handleRequest(req, res)`** — The top-level dispatcher:
- Handles `OPTIONS` preflight immediately (returns 204 with CORS headers).
- Routes by `[method, pathname]` to the correct handler.
- Wraps everything in `try/catch`: 4xx errors are sent as JSON; 5xx errors are additionally logged to `console.error`.
- Falls through to 404 if no route matches.
#### Server Startup
 
```js
createServer(handleRequest).listen(PORT, HOST, () => {
  console.log(`ICU Node backend listening on http://localhost:${PORT}`);
  console.log(`Serving dashboard from ${INDEX_HTML}`);
});
```
 
Single call — no clustering, no TLS, no middleware chain.
 
---
 
### 5.4 `backend/defaults.js`
 
Defines **default vital values** and **input normalization** functions. This file ensures the ML models always receive complete, valid numeric inputs even when the client sends partial data.
 
#### Constants
 
```js
export const SEQ_LEN = 12;                    // LSTM lookback window length
export const DEFAULT_PATIENT = "ICU-DEFAULT"; // Fallback patient ID
```
 
`SEQ_LEN = 12` means the LSTM requires 12 consecutive time-steps before it will produce a prediction. At 1 reading/second (the frontend's polling rate), this is 12 seconds minimum of sequence data — but the server also requires a full 300-second (5-minute) time window.
 
#### `VITAL_DEFAULTS` (frozen object)
 
```js
export const VITAL_DEFAULTS = Object.freeze({
  heart_rate: 80,        // beats/min — textbook normal adult
  spo2_pct: 97,          // % — healthy adult resting
  systolic_bp: 120,      // mmHg
  diastolic_bp: 80,      // mmHg
  respiratory_rate: 16,  // breaths/min
  temperature_c: 37,     // °C (98.6°F)
  oxygen_flow: 2,        // L/min (nasal cannula setting)
  mobility_score: 0,
  nurse_alert: 0,
  wbc_count: 8200,       // cells/μL — mid-normal range
  lactate: 1.2,          // mmol/L — normal < 2
  creatinine: 0.9,       // mg/dL — normal male ~0.7–1.2
  crp_level: 0,          // mg/L — no inflammation
  hemoglobin: 13.5,      // g/dL
  sepsis_risk_score: 0,
  age: 65,
  comorbidity_index: 0,
  hour_from_admission: 2,
  gender: "M",
  oxygen_device: "nasal_cannula",
  admission_type: "emergency"
});
```
 
`Object.freeze()` makes this immutable — no code path can accidentally mutate the defaults. Choosing medically plausible mid-normal values means that missing fields default to "healthy patient" rather than 0 (which would be physiologically impossible for most parameters and would bias ML predictions).
 
#### `STREAM_DEFAULTS`
 
A separate, slimmer defaults object for the `/stream/vitals` endpoint, which carries fewer fields (waveform vitals without lab values).
 
#### `VITAL_NUMBER_FIELDS` / `STREAM_NUMBER_FIELDS`
 
Two string arrays listing which fields must be coerced to numbers. This explicit list is safer than a generic "coerce everything" approach — it preserves string fields (`gender`, `oxygen_device`, `admission_type`) without accidentally stringifying them.
 
#### `mergeDefaults(input, defaults)`
 
```js
function mergeDefaults(input, defaults) {
  const out = { ...defaults };
  for (const [key, value] of Object.entries(input || {})) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  }
  return out;
}
```
 
Starts with defaults, then overwrites with any non-null, non-empty values from the client input. This "defaults-first" approach means missing fields silently fall back, rather than requiring clients to send every field every time.
 
#### `toNumber(value, fallback)` / `toStringValue(value, fallback)`
 
Small type-coercion helpers. `toNumber` uses `Number()` and checks `Number.isFinite` to reject `NaN`, `Infinity`, and non-numeric strings. This prevents the ML model receiving `NaN` as a feature value.
 
#### `normalizeVitalSnapshot(input)` / `normalizeStreamVitals(input)`
 
The exported normalization functions. Each:
1. Merges with defaults.
2. Coerces every numeric field through `toNumber`.
3. Coerces every string field through `toStringValue`.
4. Returns a clean object ready for the ML bridge.
---
 
### 5.5 `backend/fallbacks.js`
 
Contains all the **fallback logic** that runs when the ML bridge is unavailable, timing out, or the LSTM sequence buffer is not yet full. This ensures the dashboard always shows *some* risk estimate rather than a blank screen.
 
#### `classifyRisk(probability)`
 
```js
export function classifyRisk(probability) {
  if (probability >= 0.55) return "CRITICAL";
  if (probability >= 0.30) return "BORDERLINE";
  return "STABLE";
}
```
 
The three-tier risk classification used throughout the system. Thresholds (0.30, 0.55) represent model-tuned decision boundaries — below 30% is low risk, 30–55% is borderline requiring closer monitoring, above 55% is critical requiring immediate intervention.
 
These same thresholds are duplicated on the frontend in `script.js` (`getRiskLevelFromProbability`) and in `ml_bridge.py` (`classify_risk`) so that all three layers agree.
 
#### `ruleBasedFallback(input)`
 
A **seven-vital scoring system** that runs when XGBoost is unavailable:
 
```
Heart Rate:        out-of-range → +25 pts; borderline → +10 pts
SpO₂:             < 85% → +35 pts; < 90% → +25 pts; < 94% → +15 pts
Systolic BP:       shock/hypertensive crisis → +30 pts; borderline → +20 pts
Respiratory Rate:  < 8 or > 35 → +25 pts
Temperature:       < 35 or > 40°C → +20 pts
Lactate:           > 4 mmol/L → +25 pts; > 2 → +15 pts
Creatinine:        > 2 mg/dL → +20 pts
```
 
Total is capped at 100, then divided by 100 to produce a probability. This is essentially a simplified early warning score (EWS) — similar in spirit to the Modified Early Warning Score (MEWS) used in clinical practice.
 
#### `classifyTrend(currentProbability, futureProbability)`
 
If the delta between current and future probability exceeds ±0.08 (8 percentage points), the trend is classified as `WORSENING` or `IMPROVING`; otherwise `STABLE`.
 
#### `makeForecastSeries(currentProbability, futureProbability, steps = 6)`
 
Generates a linear interpolation between the current and predicted future probabilities across 6 time steps. Used for the trajectory chart. This is purely geometric — the real LSTM forecast series (from `ml_bridge.py`) replaces this when available.
 
#### `interpolationFallback(history, currentProbability, sequenceLength)`
 
Returned when LSTM inference fails (Python exception, timeout, etc.). Always sets `ready: false` and `forecast_series: []`. This is intentional — returning a made-up forecast when the real one failed would be misleading in a clinical context.
 
#### `notReadyLstm(currentProbability, sequenceLength, windowMs)`
 
Returned when the sequence buffer hasn't accumulated enough data yet. Shows a `LSTM pending: Xs / 300s` countdown message to the frontend.
 
#### `combineRiskLevels(xgbLevel, lstmTrend)`
 
A simple adjudication rule:
- Start with XGBoost's discrete level (STABLE/BORDERLINE/CRITICAL).
- If LSTM trend is `WORSENING`, bump up one level.
- If LSTM trend is `IMPROVING`, drop down one level.
- Clamp to valid range.
Used by the `/patient/state` endpoint to return a single combined level.
 
---
 
### 5.6 `backend/mlBridgeClient.js`
 
The **IPC client** that manages the Python subprocess. This is one of the most architecturally interesting files in the project.
 
#### Why a subprocess instead of a REST call to a Python service?
 
Spawning a subprocess that reads from stdin and writes to stdout eliminates:
- A second listening port (simpler deployment).
- Network overhead (localhost loopback still has overhead).
- HTTP serialization round-trips.
- The need to run two separate processes in production.
It's a classic "side-car" pattern, but using OS pipes rather than a network.
 
#### Class: `MlBridgeClient`
 
```js
constructor({ projectRoot, scriptPath, pythonCommand = process.env.ML_PYTHON || "python" })
```
 
- `projectRoot` — passed as `cwd` to the subprocess so Python's relative imports work.
- `scriptPath` — the absolute path to `ml_bridge.py`.
- `pythonCommand` — defaults to `python` (system PATH), overridable via `ML_PYTHON` env var for environments where `python3` or a venv path is needed.
- `pending` — a `Map<id, {resolve, reject, timer}>` for in-flight requests.
- `nextId` — auto-incrementing integer for request correlation IDs.
- `stdoutBuffer` / `stderrBuffer` — accumulation buffers for partial line fragments.
#### `start()`
 
Spawns the Python process if not already running:
```js
this.child = spawn(this.pythonCommand, [this.scriptPath], {
  cwd: this.projectRoot,
  env: {
    ...process.env,
    PROJECT_ROOT: this.projectRoot,
    PYTHONUNBUFFERED: "1",         // forces Python to flush stdout immediately
    TF_CPP_MIN_LOG_LEVEL: "2"     // silences TensorFlow C++ kernel spam
  },
  stdio: ["pipe", "pipe", "pipe"] // all three streams piped
});
```
 
`PYTHONUNBUFFERED=1` is critical — without it, Python buffers stdout in 4KB blocks, causing Node to hang waiting for responses that are sitting in Python's buffer.
 
#### `request(action, payload, timeoutMs)`
 
The public API. Each call:
1. Calls `this.start()` (no-op if already running).
2. Assigns a unique integer `id`.
3. Serializes `{ id, action, payload }` as a JSON line.
4. Stores `{ resolve, reject, timer }` in `this.pending[id]`.
5. Sets a `setTimeout` to `reject` after `timeoutMs` (default 120 seconds — TF model loading can be slow).
6. Writes the JSON line to Python's stdin.
7. Returns the `Promise` that will resolve/reject when Python responds.
#### `handleStdout(chunk)`
 
Called whenever Python writes to stdout. The key insight is that TCP/pipe data may arrive in arbitrary chunks — a single `data` event may contain half a line, a full line, or multiple lines.
 
```js
this.stdoutBuffer += chunk.toString("utf8");
let newlineIndex;
while ((newlineIndex = this.stdoutBuffer.indexOf("\n")) >= 0) {
  const line = this.stdoutBuffer.slice(0, newlineIndex).trim();
  this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
  // parse JSON, look up pending[message.id], resolve/reject
}
```
 
This line-accumulation pattern ensures full JSON objects are only parsed when a complete line has arrived.
 
#### `handleStderr(chunk)`
 
Python's stderr (model loading logs, warnings, exceptions) is forwarded to Node's console as `[ml-bridge] <line>`. This preserves visibility into Python-side errors without polluting the JSON protocol channel.
 
#### `rejectAll(error)`
 
Called when the Python process exits or crashes. Rejects all in-flight `pending` promises with the same error. The timeout timers are also cleared to prevent double-rejection. After this, `this.child` is set to `null` so the next `request()` call will re-spawn Python.
 
---
 
### 5.7 `backend/sequenceBuffer.js`
 
An **in-memory time-series database** for each patient. LSTM models require a fixed-length window of consecutive time steps — this module manages that window.
 
#### Constants
 
```js
export const LSTM_HISTORY_MS  = 10 * 60 * 1000; // 600 seconds retained
export const ACTIVE_PREDICTION_INTERVAL_MS = 1 * 1000; // 1-second tick rate
export const WINDOW_REQUIRED_MS = 300 * 1000;   // 300 seconds minimum span
```
 
The buffer retains 10 minutes of data (600 entries at 1/s), but only activates LSTM after 5 minutes (300 entries spanning at least 300 real-wall-clock seconds) have been collected. The longer retention window provides a safety margin if the frontend sends data at irregular intervals.
 
#### Class: `PatientSequenceBuffer`
 
Each patient gets their own buffer instance. Internally stores a `raw` array of vital snapshot objects, each augmented with a `_timestampMs` field.
 
**`push(rawVital)`** — Appends a new vital reading. If the incoming `rawVital.timestamp` is a valid number, it's used as-is (allowing the frontend to send its own timestamps for accurate LSTM timing). Otherwise, `Date.now()` is used.
 
**`trim()`** — Called before every read to evict stale data:
1. Removes entries older than 10 minutes.
2. If the buffer still exceeds capacity, removes the oldest excess entries. This is an O(n) operation but `n` is at most ~662, so it's negligible.
**`getWindow()`** — Returns the last `SEQ_LEN` (12) rows, stripped of the internal `_timestampMs` field (which the ML model doesn't need). The Python model sees exactly a 12-row array of vital dictionaries.
 
**`ready()`** — Returns `true` only when:
1. `raw.length >= SEQ_LEN` (at least 12 real data points), AND
2. The time span from the oldest to newest entry is ≥ 300 seconds (minus 10ms tolerance for floating-point).
The time span check prevents gaming the system: if a client sent 12 readings in 1 second, `length >= SEQ_LEN` would be satisfied but the LSTM would be predicting off of a meaningless 1-second window.
 
**`windowSpanMs()`** — Returns `newest._timestampMs - oldest._timestampMs`. Returns 0 if fewer than 2 entries.
 
#### Class: `SequenceManager`
 
A registry of `PatientSequenceBuffer` instances, keyed by `patientId`. In a multi-patient system, each patient maintains their own independent buffer.
 
```js
export const sequenceManager = new SequenceManager(); // singleton
```
 
The singleton is imported by `server.js`. All route handlers access the same instance.
 
---
 
### 5.8 `backend/python/ml_bridge.py`
 
The **Python ML inference daemon**. It loads the trained models once at startup, then loops forever reading JSON requests from stdin and writing JSON responses to stdout. ~450 lines.
 
#### Startup / Environment Setup
 
```python
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")  # silence TF C++ logs
 
sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)
```
 
`line_buffering=True` ensures every `print()` is flushed immediately — critical for the IPC protocol. Without this, Python may buffer multiple responses in memory, causing Node to receive them all at once (potentially mid-parse).
 
#### Global Module Imports (Graceful Degradation)
 
```python
try:
    import numpy as np
except Exception as exc:
    np = None
    WARNINGS.append(f"numpy unavailable: {exc}")
```
 
Each ML dependency is wrapped in `try/except`. If `numpy`, `joblib`, or `xgboost` are missing, the bridge still starts and falls back to the rule-based scorer rather than crashing. The `WARNINGS` list is returned in every `/health` response so the frontend can surface them.
 
#### Categorical Encoding Maps
 
```python
GENDER_MAP = {"M": 1, "F": 0}
OXYGEN_DEVICE_MAP = {"none": 0, "room_air": 1, "nasal_cannula": 2, ..., "ventilator": 7}
ADMISSION_TYPE_MAP = {"elective": 0, "emergency": 1, "urgent": 2}
```
 
These ordinal encodings match whatever was used when training the XGBoost model. If the training used different encodings, predictions would be wrong — these must stay in sync with the training pipeline.
 
#### Model Discovery: `candidate_model_dirs()` / `choose_model_dir()`
 
```python
def candidate_model_dirs():
    candidates = []
    env_dir = os.environ.get("MODEL_DIR")   # override via env var
    if env_dir:
        candidates.append(Path(env_dir))
    candidates.extend([
        PROJECT_ROOT / "ml" / "models_store",  # typo variant
        PROJECT_ROOT / "ml" / "model_store",   # correct name
    ])
    # deduplicate by resolved path
    ...
```
 
The model directory is discovered, not hardcoded. The `MODEL_DIR` environment variable allows overriding at runtime. Both `models_store` (typo) and `model_store` (correct) are tried — the first directory containing `.pkl` or `.keras` files wins.
 
#### `find_artifact(directory, filename, *patterns)`
 
```python
def find_artifact(directory, filename, *patterns):
    direct = directory / filename
    if direct.exists():
        return direct          # exact name match
    for pattern in patterns:
        matches = sorted(directory.glob(pattern))
        if matches:
            return matches[0]  # first glob match
    return None
```
 
This two-step lookup is what makes `- Copy` filenames work: `find_artifact(d, "lstm_model.keras", "lstm_model*.keras")` first tries the exact name, then falls back to the glob, which matches `lstm_model - Copy.keras`.
 
#### `load_all_models()`
 
Called once at startup (guarded by `_load_attempted` flag to prevent re-loading). Loads:
1. `xgb_model.pkl` — the main XGBoost classifier.
2. `xgb_features.pkl` — list of feature names in the order the model was trained.
3. `lstm_features.pkl` — feature names for the LSTM input layer.
4. `top_features.pkl` — features for temporal delta/mean engineering.
5. `lstm_scaler.pkl` — `StandardScaler` fitted on training data.
6. `lstm_model.keras` — the Keras LSTM model.
All `.pkl` files are loaded via `joblib.load()`. The `.keras` file uses TensorFlow's `load_model()`.
 
#### Feature Engineering: `engineer_features(raw)`
 
```python
def engineer_features(raw):
    sbp = to_float(d.get("systolic_bp"), 120)
    dbp = to_float(d.get("diastolic_bp"), 80)
    hr  = to_float(d.get("heart_rate"), 80)
    spo2 = to_float(d.get("spo2_pct"), 97)
 
    d["MAP"]         = (sbp + 2 * dbp) / 3       # Mean Arterial Pressure
    d["shock_index"] = hr / (sbp + 1e-6)          # HR / SBP (sepsis indicator)
    d["spo2_gap"]    = 100 - spo2                 # Inverse SpO₂ (higher = worse)
    return d
```
 
Three derived features are computed from raw vitals:
- **MAP** (Mean Arterial Pressure): The standard hemodynamic perfusion metric. Critical threshold: MAP < 65 mmHg indicates shock.
- **Shock Index**: HR divided by systolic BP. Normal is ~0.5–0.7. Above 1.0 suggests significant hemodynamic instability.
- **SpO₂ Gap**: Inverts SpO₂ so higher values mean worse oxygenation (more intuitive for a risk model).
The `+ 1e-6` prevents division by zero if SBP somehow reaches 0.
 
#### `build_xgb_feature_vector(raw_input)`
 
Encodes categoricals → engineers features → extracts values in `xgb_features` order → returns a `(1, n_features)` float32 NumPy array.
 
#### `build_shap_drivers(x_matrix, engineered_row, top_n=5)`
 
```python
booster = xgb_model.get_booster()
dmatrix = xgb.DMatrix(x_matrix, feature_names=xgb_features)
raw_contribs = booster.predict(dmatrix, pred_contribs=True)
contributions = raw_contribs[0][:-1]  # last element is bias term
```
 
XGBoost's native SHAP implementation (`pred_contribs=True`) returns one contribution per feature plus a bias. These are tree SHAP values: positive means "increases risk probability", negative means "decreases risk probability".
 
If the native SHAP call fails (e.g., `xgboost` package not installed but `joblib` model still loads), it falls back to `feature_importances_` — less accurate but still directional.
 
Returns the top `n` features by absolute contribution, sorted descending.
 
#### `compute_temporal_features(history)`
 
Called before feeding data to the LSTM. For each row in the history window:
1. Applies categorical encoding and feature engineering.
2. For each feature in `top_features`:
   - Computes `<feature>_delta` — the change from the previous time step (0 on the first step).
   - Computes `<feature>_mean` — the rolling mean of the last 3 steps.
3. Returns the enriched history array.
This transforms static snapshots into a richer time-series representation:
- `heart_rate` at time T
- `heart_rate_delta` — is HR trending up or down?
- `heart_rate_mean` — what's the local average?
#### `build_lstm_sequence(history_with_temporal)`
 
```python
arr    = np.array(matrix, dtype=np.float32)        # shape: (SEQ_LEN, n_features)
scaled = lstm_scaler.transform(arr.reshape(-1, n_features))  # z-score normalize
return scaled.reshape(1, SEQ_LEN, n_features).astype(np.float32)
```
 
Takes the last 12 rows, extracts the `lstm_features`-ordered columns, applies the pre-fitted `StandardScaler` (which was fit on training data), and shapes the result to `(1, 12, n_features)` — the `(batch, timesteps, features)` shape expected by the Keras model.
 
**Why normalize?** LSTMs are sensitive to feature scale. Without normalization, a feature like `wbc_count` (thousands) would dominate gradients over `lactate` (single digits).
 
#### `run_lstm_prediction(history, current_xgb_prob, patient_id)`
 
Full LSTM inference:
1. Enriches history with temporal features.
2. Checks `sequence_length >= SEQ_LEN`.
3. Runs `lstm_model.predict(sequence, verbose=0)`.
4. Clips the raw output to `[0, 1]`.
5. Computes trend and confidence.
6. Returns the prediction dict.
**Confidence scoring:**
```python
confidence = min(1.0, sequence_length / (SEQ_LEN * 2)) * 0.9 + 0.1
```
- Starts at 0.1 (10%) when exactly at minimum buffer.
- Asymptotically approaches 1.0 as buffer fills.
- Always at least 10% (model is never fully uncertain).
- Maximum 0.9 × 0.9 + 0.1 = ~0.91 (capped below 100% to reflect model uncertainty).
#### `main()` — The Event Loop
 
```python
def main():
    load_all_models()         # warm up models once
    for line in sys.stdin:    # block forever, reading one request per line
        if not line.strip():
            continue
        try:
            message = json.loads(line)
            result  = handle_request(message)
            respond(message.get("id"), True, result=result)
        except Exception as exc:
            respond(message_id, False, error=str(exc))
```
 
The `for line in sys.stdin` loop is blocking and synchronous — Python processes one request at a time. This is fine because Node.js sends requests serially (one at a time per model type) and the LSTM runs in ~milliseconds once loaded.
 
#### `respond(message_id, ok, result, error)`
 
```python
print(json.dumps(payload, separators=(",", ":"), allow_nan=False, default=lambda x: None), flush=True)
```
 
- `separators=(",", ":")` — compact JSON (no spaces) for efficiency.
- `allow_nan=False` — if any computed value is `NaN` or `Infinity`, `json.dumps` raises `ValueError` rather than outputting invalid JSON. This prevents Node from receiving unparseable responses.
- `default=lambda x: None` — any non-serializable type (e.g., NumPy `float32`) is serialized as `null`.
- `flush=True` — ensures the response is written immediately without waiting for the buffer.
---
 
### 5.9 `frontend/templates/index.html`
 
The **single-page dashboard shell**. 639 lines of semantic HTML. Key structural points:
 
#### Head
 
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:..." rel="stylesheet">
<link rel="stylesheet" href="/static/style.css?v=20260524c">
<script src="/static/script.js?v=20260524c" defer></script>
```
 
- Two fonts: **JetBrains Mono** for numbers/vitals (monospace so digits don't jitter in width), **Inter** for labels.
- `?v=20260524c` — cache-busting query strings prevent browsers from serving stale versions of CSS/JS after deployments.
- `defer` on the script tag — the script executes after the DOM is fully parsed, so `document.getElementById(...)` calls in `init()` are safe.
#### Layout Structure
 
```
body
└── #alertBanner           (fixed top, hidden until alerts fire)
└── header.header          (sticky top bar: status, patient info, controls)
└── .main-container.single-bed-layout
    └── main.content
        ├── .left-column   (waveform canvases + vital cards + audio controls)
        ├── .center-column (risk gauges + tabs: Monitor/History/Meds/Vent/Notes)
        └── .right-column  (SHAP drivers + LSTM panel + lab values + recommendations)
```
 
#### Left Column
 
Contains 16 `<div class="waveform-container">` elements, each holding:
- A label (e.g., `ECG II`, `PLETH / SpO₂`)
- A numeric value display (e.g., `<span id="hrValue">78</span>`)
- A `<canvas>` element (e.g., `<canvas id="ecgCanvas">`)
The canvases have no fixed `width`/`height` attributes in HTML — these are set dynamically by JavaScript via `canvas.width = container.clientWidth * devicePixelRatio` for crisp rendering on HiDPI (Retina) screens.
 
#### Center Column — Tabs
 
Five tabs: Monitor, History, Meds, Vent, Notes.
 
- **Monitor**: Three SVG gauges (ensemble, XGBoost mini, LSTM mini) + probability row + trajectory SVG + heatmap.
- **History**: Chart canvas + manual input form with 22 fields covering vitals, labs, oxygen settings, and demographics.
- **Meds**: Medication list rendered by `renderMedications()`.
- **Vent**: Static ventilator settings display (togglable).
- **Notes**: Clinical notes list + textarea for adding new notes.
#### Right Column
 
- **SHAP Values**: `<div id="shapDrivers">` — populated dynamically with horizontal bar charts showing which features are driving the current risk score.
- **LSTM Temporal Forecast**: Future risk %, trend label, and status message.
- **Lab Values**: Static display of lactate, creatinine, WBC, etc.
- **AI Recommendations**: Text recommendations based on current risk level.
#### Commented-Out Section
 
There is a block of HTML commented out (`<!-- ... hwllo-->`) containing a "Clinical Context" panel (GCS, SOFA, APACHE II scores). This was apparently disabled during development. The `hwllo` typo suggests it was commented out informally.
 
---
 
### 5.10 `frontend/static/style.css`
 
A **dark clinical monitoring theme** — ~1,546 lines. Designed to look like a real bedside patient monitor (dark background, glowing colored waveforms).
 
#### CSS Custom Properties (`:root`)
 
```css
:root {
  --background:       hsl(220, 20%, 4%);   /* near-black blue-grey */
  --foreground:       hsl(0, 0%, 95%);     /* off-white text */
  --primary:          hsl(180, 100%, 55%); /* bright cyan - accent */
  --vital-stable:     hsl(120, 100%, 55%); /* green */
  --vital-warning:    hsl(45, 100%, 60%);  /* amber */
  --vital-critical:   hsl(0, 85%, 60%);   /* red */
  --vital-oxygen:     hsl(190, 100%, 55%); /* blue-cyan for SpO₂ */
  --vital-pressure:   hsl(280, 100%, 70%); /* purple for BP/MAP */
  --vital-resp:       hsl(55, 100%, 55%);  /* yellow for resp */
  --vital-cvp:        hsl(200, 100%, 65%); /* light blue for CVP */
  --vital-pap:        hsl(330, 100%, 70%); /* pink for PAP */
  --vital-icp:        hsl(30, 100%, 60%);  /* orange for ICP */
  --vital-co2:        hsl(160, 100%, 55%); /* teal for CO₂ */
}
```
 
Each waveform has its own dedicated color, mirroring real clinical monitor color conventions (e.g., ECG is always green, SpO₂ is blue/cyan, arterial BP is red or purple).
 
The comments (`/* was 45% → 55% */`) show the design evolution — the team progressively brightened colors for readability on different screens.
 
#### Key Component Styles
 
**Alert Banner** — Fixed at top, uses a CSS gradient animation (`flash-critical`) that pulses the background:
```css
.alert-critical {
  animation: flash-critical 0.5s ease-in-out infinite;
}
@keyframes flash-critical {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.85; }
}
```
 
**Header** — Sticky with `backdrop-filter: blur(10px)` for a frosted-glass effect over scrolling content. Uses `rgba(18, 20, 26, 0.95)` (near-opaque dark blue) as background.
 
**Status Dot** — Small 12px circle that pulses via CSS animation when critical:
```css
.status-dot.critical { animation: pulse 1s infinite; }
```
 
**Waveform Container** — Each waveform panel has `position: relative` with the canvas absolutely positioned to fill it. Labels and value displays are positioned with `z-index` above the canvas.
 
**Risk Gauge Area** — SVG-based, programmatically drawn by JavaScript. The CSS only provides the container sizing and font styles.
 
**SHAP Bar Track** — `.shap-bar-track` is a container div, `.shap-bar` is the colored fill. The `width` is set inline by JavaScript as a percentage of the maximum impact. `increase` bars are red, `decrease` bars are green.
 
**Vital Cards** — 2×2 grid in the left column. Color-coded: `.stable` = green border/text, `.warning` = amber, `.critical` = red (with glowing `text-shadow`).
 
**Mobile Responsiveness** — A `@media (max-width: 768px)` block hides the right column, stacks columns vertically, and reduces waveform heights.
 
---
 
### 5.11 `frontend/static/script.js`
 
The **entire frontend application** in a single 2,172-line vanilla JavaScript file. No bundler, no framework.
 
#### Module-Level State
 
```js
let state = {
  isLive: true,
  isMuted: false,
  waveformAudioEnabled: false,
  alertDismissed: false,
  activeTab: "monitor",
  activePatientId: "ICU-2024-0843",
  backendUrl: "",            // empty = same origin
  vitals: { heartRate, spO2, ... },
  labs: { lactate, creatinine, wbc, ... },
  additionalParams: { age, gender, oxygen_device, ... },
  riskScore: 0,
  riskLevel: "STABLE",
  vitalHistory: [],          // array of last ~300 readings
  trajectory: [],            // 12-point risk trend line
  mlProbabilities: { xgb, lstm, final },
  hasModelPrediction: false, // true once backend responds
  riskDrivers: [],
  modelConfidence: 0,
  lstmReady: false,
  waveformParams: { ecg, pleth, resp, abp, cvp, pap, icp, co2 }
};
```
 
All mutable dashboard state lives here. The `backendUrl: ""` means API calls use the same origin as the page (e.g., `fetch("/predict/combined")`), so no hardcoded host is needed.
 
`waveformParams` is a nested object containing waveform-shaping parameters (amplitude, frequency, phase characteristics) derived from the actual vital values.
 
#### Responsive Layout (`initResponsive`, `checkViewport`)
 
```js
responsiveState.isMobile = width <= 768;
responsiveState.isTablet = width > 768 && width <= 1024;
```
 
The layout adapts in three tiers. On mobile, waveforms are shorter, gauge SVGs are scaled down, and a hamburger menu (`#mobileToggle`) slides in a sidebar. `window.addEventListener("resize", handleResize)` triggers canvas re-initialization on resize.
 
#### Canvas Management (`resizeCanvases`)
 
Each canvas is registered in `canvasReferences[id]` with its element, context, and parent container. This avoids `document.getElementById` calls inside the 60fps animation loop.
 
For HiDPI screens, the canvas is rendered at physical pixel resolution:
```js
canvas.width  = container.clientWidth  * window.devicePixelRatio;
canvas.height = container.clientHeight * window.devicePixelRatio;
ctx.scale(devicePixelRatio, devicePixelRatio);
```
 
Without this, waveforms would appear blurry on Retina screens.
 
#### Backend Connection (`checkBackendConnection`)
 
```js
const response = await fetch(`${state.backendUrl}/health`, { method: "GET" });
```
 
On success: green status dot, "ML Connected" text.
On HTTP error: amber dot, "Backend Error".
On fetch exception (backend down): red dot, "No Connection".
 
#### ML Prediction Pipeline
 
**`buildCurrentVitalsPayload()`** — Assembles the JSON body from `state.vitals`, `state.labs`, and `state.additionalParams`. Note that `wbc_count` is multiplied by 1000 here (`state.labs.wbc * 1000`) because the UI stores WBC in K/μL (e.g., 8.2) but the model expects cells/μL (8200).
 
**`getMLPrediction()`** — The main prediction function, called every second by the simulation loop:
1. Guards against concurrent calls with `activePredictionInFlight` flag.
2. POSTs to `/predict/combined`.
3. Calls `applyCombinedPrediction(result.prediction)` on success.
4. Falls back to `fallbackRiskCalculation()` on network error.
**`applyCombinedPrediction(prediction)`** — Unpacks the combined API response:
- Updates `state.mlProbabilities.xgb`, `.lstm`, `.final`.
- Sets `state.riskScore`, `state.riskLevel`, `state.riskDrivers`, `state.lstmReady`.
- Triggers UI updates: `updateProbabilityDisplay()`, `renderShapDrivers()`, `updateGauge()`, `renderTrajectory()`.
**`updateLSTMPanel(prediction)`** — Handles the LSTM status display:
- If `!prediction.ready` or `prob === null`: shows a "LSTM pending: Xs / 300s" countdown using `windowSeconds`.
- If ready: displays the future risk % and trend in appropriate color (green/amber/red).
#### Patient Phase Simulation
 
The vital simulation uses a three-phase state machine that cycles every 15 seconds:
 
```
NORMAL (15s) → MEDIUM (15s) → CRITICAL (15s) → NORMAL → ...
```
 
Each phase configures different noise, spike probability, and drift parameters. In CRITICAL phase, multiple vitals drift simultaneously (HR ↑, SpO₂ ↓, RR ↑, BP ↓, Temp ↑) with physiological coupling:
```js
if (v.spO2 < 92) v.heartRate += 2;      // hypoxia → reflex tachycardia
if (v.systolicBP < 90) v.heartRate += 3; // hypotension → compensatory HR
if (v.temperature > 38.5) v.heartRate += 2; // fever → tachycardia
```
 
The `randn()` helper approximates Gaussian noise using the sum of 4 uniform random variables (central limit theorem approximation — inexpensive and good enough for simulation).
 
The `spike(prob, mag)` helper randomly injects artifact spikes: `Math.random() < prob ? (Math.random() - 0.5) * mag : 0`.
 
#### Waveform Rendering Engine
 
Each waveform has a dedicated `draw*()` function. All follow the same pattern:
1. Fill with a semi-transparent background (`rgba(10,12,16,0.3)`) — the 30% opacity creates the trailing effect (older parts fade).
2. Draw a background grid via `drawGrid()`.
3. Iterate `x` from 0 to canvas width, compute `y` from a mathematical waveform model, build a path.
4. Stroke with a colored shadow (`shadowBlur = 8`) for the glow effect.
5. A "sweep line" (white vertical line at `offset % w`) creates the scrolling scan-line effect.
**ECG waveform** — Piecewise linear approximation of a P-QRS-T complex:
```
0–5%:  P-wave (small positive deflection)
5–15%: PR interval (returns to baseline)
15–20%: QRS complex (tall spike — the "heartbeat")
20–25%: ST segment
25–50%: T-wave (rounded positive)
50–100%: isoelectric baseline
```
The QRS height is modulated by `wp.ecg.qrsHeight` which scales with heart rate (tachycardia → slightly reduced QRS).
 
**Pleth** — Smooth sinusoidal pulse with a dicrotic notch modeled by a secondary smaller peak.
 
**ABP** — Driven directly by `v.systolicBP` and `v.diastolicBP` values: the waveform's amplitude maps to mmHg. The dicrotic notch (aortic valve closure) is modeled as a notch at ~25% of the cycle.
 
**CVP** — The a, c, v waves and x, y descents characteristic of central venous pressure are each modeled as sinusoidal sub-components scaled by `waveformParams.cvp.*` factors.
 
**CO₂ (capnography)** — A square-ish waveform with a rising phase (alveolar CO₂ slope) and a flat plateau (end-tidal CO₂), followed by a rapid fall-back to zero (inspiration), matching clinical capnography displays.
 
**Trend waves** (MAP, Temp, Lactate, Creatinine, WBC, Hgb, Glucose, K+) — These lab values don't have true physiological waveforms, so `drawTrendWave()` renders stylized oscillations centered at the actual value's normalized position within its clinical range. Three modes are supported:
- `slow`: Double-frequency sine (gentle oscillation).
- `saw`: Sawtooth (simulates pulse-like behavior for MAP).
- `stepped`: Stepped sine (for discrete-ish values like WBC).
#### Risk Gauge (`drawGaugeSvg`)
 
The gauge is a semi-circular SVG arc rendered programmatically:
- **Background arc**: dark grey full 180° semicircle.
- **Colored zones**: three colored arcs for STABLE (green, 0–30%), BORDERLINE (amber, 30–55%), CRITICAL (red, 55–100%).
- **Needle**: a `<line>` element from the center to the arc at angle `probability * 180°`.
- **Center dot**: a `<circle>` with glow filter at the pivot.
The `filter="url(#${svgId}Glow)"` references a per-gauge `<feGaussianBlur>` filter for the glowing needle effect.
 
The main gauge (ensemble) uses `width=280, height=160`; the two mini gauges (XGBoost, LSTM) use `width=150, height=96`.
 
#### Trajectory Chart (`renderTrajectory`)
 
An inline SVG with:
- Horizontal dashed threshold lines at 0, 35, 60, 100.
- A vertical "NOW" marker line.
- A polyline connecting 12 data points (6 historical + 6 from LSTM forecast series).
- Dots colored green/amber/red based on their risk value.
- X-axis labels: `−1h`, `NOW`, `+1h`.
#### Vital Heatmap (`renderHeatmap`)
 
A grid of 9 vital rows × 24 time columns. Each cell is a colored `<div>`:
- Green (value within normal range).
- Amber (borderline abnormal).
- Red (critically abnormal or outside critical thresholds).
The last 24 entries from `state.vitalHistory` are displayed. This gives a quick visual scan of which vitals have been abnormal and for how long.
 
#### Alert System (`checkAlerts`)
 
Evaluates 11 alert conditions every second:
- AI risk level CRITICAL
- SpO₂ < 90% (hypoxemia) or < 94% (low SpO₂)
- HR > 130 (tachycardia) or < 50 (bradycardia)
- SBP < 90 (hypotension)
- Temp > 39°C (fever)
- ICP > 20 mmHg (intracranial hypertension)
- CO₂ > 50 mmHg (hypercapnia)
- CVP > 12 mmHg (elevated)
- PAP systolic > 35 mmHg (pulmonary hypertension)
Active alerts appear in the top banner (up to 3 at once, joined with ` | `). The banner flashes with a CSS animation if the risk is CRITICAL.
 
#### Audio System
 
Uses the **Web Audio API** (`AudioContext`, `OscillatorNode`, `GainNode`):
- **Alert sound**: A 880 Hz (CRITICAL) or 660 Hz (BORDERLINE) sine tone played briefly when an alert fires, only if not muted.
- **Heartbeat sound**: A repeating sine pulse at `60000 / heartRate` millisecond intervals, with a frequency that changes with SpO₂ (`200 + (spo2 - 85) * 20` Hz). This mimics the SpO₂ probe tone on real monitors. Exponential ramp-to-zero (`gain.gain.exponentialRampToValueAtTime`) avoids click artifacts.
AudioContext is created lazily (user gesture required by browser policy).
 
#### Initialization
 
```js
window.addEventListener("load", init);
document.addEventListener("DOMContentLoaded", init);
```
 
`init()` is guarded by `appInitialized` flag to prevent double-initialization. On load:
1. Sets up responsive layout.
2. Seeds 60 minutes of historical vital data (`initializeHistory`).
3. Runs the local fallback risk calculation.
4. Resizes canvases and starts the waveform animation loop (`requestAnimationFrame`).
5. Checks backend connection; if connected, runs `getMLPrediction()`.
6. Starts the 1-second simulation interval (`startSimulation`).
7. Starts the clock updater.
---
 
### 5.12 `ml/model_store/` — Trained ML Artifacts
 
| File | Size | Purpose |
|---|---|---|
| `xgb_model.pkl` | ~3.0 MB | Trained XGBoost binary classifier (predict mortality risk from a single vital snapshot) |
| `xgb_features.pkl` | ~384 bytes | Python list of feature names in the order the XGBoost model expects them |
| `lstm_model - Copy.keras` | ~483 KB | Trained Keras LSTM model (predict future risk from a sequence of 12 timesteps) |
| `lstm_features - Copy.pkl` | ~1.3 KB | Feature names for the LSTM model's input layer |
| `lstm_scaler - Copy.pkl` | ~2.1 KB | `sklearn.preprocessing.StandardScaler` fitted on the LSTM training data |
| `top_features - Copy.pkl` | ~927 bytes | Subset of features used for delta/rolling-mean temporal engineering |
 
**XGBoost model** — A `XGBClassifier` object serialized with `joblib`. It accepts a `(1, n_features)` NumPy array and returns a `(1, 2)` probability matrix. The positive class (index 1) is the mortality risk probability.
 
**LSTM model** — A Keras `Sequential` or Functional model. Its input shape is `(batch=1, timesteps=12, features=n)`. It outputs a single sigmoid unit (probability). The `.keras` format is the modern Keras v3 native format (not the older `.h5` format).
 
**Why `- Copy` in the names?** These appear to be files copied from a training environment into the repository. The glob patterns in `ml_bridge.py` (`"lstm_model*.keras"`) handle this without renaming.
 
---
 
### 5.13 `.git/` — Version Control
 
The project is tracked by Git with a single commit:
 
```
0e21b5d Initial commit
```
 
Key Git internals:
- **`config`** — Remote named `origin` pointing to the upstream repository.
- **`FETCH_HEAD`** — Records the last `git fetch` operation.
- **`objects/pack/`** — A Git pack file (`tmp_pack_dzgguq`, ~37 MB) storing all object data. The large size reflects the binary ML model artifacts being committed to the repository.
- **`hooks/*.sample`** — Default Git hook scripts (disabled by the `.sample` extension). These include pre-commit, pre-push, commit-msg, etc.
- **`refs/heads/main`** — The current HEAD points to branch `main`.
- **`.git/gk/config`** — Appears to be a GitKraken (GUI Git client) configuration file, indicating the developer used GitKraken.
---
 
## 6. Data Flow
 
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Frontend)                                 │
│                                                                              │
│  Simulation Loop (1s)                                                        │
│  ┌──────────────┐   updateVitals()   ┌──────────────────────────────────┐  │
│  │ State Object │─────────────────── ▶│ Canvas Waveform Renderer (rAF)  │  │
│  │  (vitals,    │                     │ 16 waveforms, 60fps             │  │
│  │   labs, etc) │                     └──────────────────────────────────┘  │
│  │              │   buildCurrentVitalsPayload()                              │
│  │              │─────────────────────────────────────────────────────────▶ │
│  └──────────────┘              POST /predict/combined                        │
│                                                                              │
│  ◀─────── { xgb: {...}, lstm: {...}, ensemble: {...}, shap_drivers: [...] } │
│                                                                              │
│  applyCombinedPrediction()                                                   │
│  → updateGauge() → renderTrajectory() → renderShapDrivers() → updateUI()    │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ HTTP (port 8000)
                                        │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                         NODE.JS BACKEND (server.js)                          │
│                                                                              │
│  handleRequest()                                                              │
│  → handlePredictCombined()                                                   │
│     │                                                                        │
│     ├─1─▶ normalizeVitalSnapshot(rawBody)   [defaults.js]                   │
│     │                                                                        │
│     ├─2─▶ predictCurrent(payload)                                            │
│     │      → mlBridge.request("predict_current", ...)  ──────────────────▶ │
│     │      ◀── { risk_probability, risk_level, risk_drivers, ... }          │
│     │                                                                        │
│     ├─3─▶ sequenceManager.pushVitals(patientId, vitals)  [sequenceBuffer.js]│
│     │                                                                        │
│     ├─4─▶ predictTemporal(history, xgbProb, patientId)                       │
│     │      → check SEQ_LEN & WINDOW_REQUIRED_MS                             │
│     │      → mlBridge.request("predict_lstm", ...)  ──────────────────────▶│
│     │      ◀── { ready, future_risk_probability, trend, forecast_series }   │
│     │                                                                        │
│     └─5─▶ buildEnsemblePrediction(xgbResult, lstmResult)   [server.js]      │
│            → (xgb_prob + lstm_prob) / 2  OR  xgb_only if lstm pending       │
│                                                                              │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ stdin/stdout JSON-RPC (subprocess)
                                        │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                     PYTHON ML BRIDGE (ml_bridge.py)                          │
│                                                                              │
│  Action: "predict_current"                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ raw_input                                                             │   │
│  │   → encode_categoricals()   gender/device/admission → int            │   │
│  │   → engineer_features()     MAP, shock_index, spo2_gap               │   │
│  │   → build_xgb_feature_vector()  ordered float32 array                │   │
│  │   → xgb_model.predict_proba()   → probability                        │   │
│  │   → build_shap_drivers()    SHAP contribs → top-5 features           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Action: "predict_lstm"                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ history[12]                                                           │   │
│  │   → compute_temporal_features()  delta, rolling mean per top_feature  │   │
│  │   → build_lstm_sequence()        scale → (1, 12, n_features)         │   │
│  │   → lstm_model.predict()         → future probability                 │   │
│  │   → classify_trend()             WORSENING / STABLE / IMPROVING       │   │
│  │   → make_forecast_series()       6-step linear interpolation          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│               ┌──────────────────────────────────────┐                      │
│               │         ml/model_store/               │                      │
│               │  xgb_model.pkl     (3.0 MB)           │                      │
│               │  lstm_model.keras  (0.5 MB)           │                      │
│               │  lstm_scaler.pkl   (2 KB)             │                      │
│               │  xgb_features.pkl  (384 B)            │                      │
│               │  lstm_features.pkl (1.3 KB)           │                      │
│               │  top_features.pkl  (927 B)            │                      │
│               └──────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
```
 
---
 
## 7. Key Algorithms & Business Logic
 
### 7.1 XGBoost: Instantaneous Risk
 
XGBoost (eXtreme Gradient Boosting) is an ensemble of decision trees trained to predict a binary outcome (mortality risk). Each prediction involves:
 
1. **Input**: One row of 21+ features (vitals + labs + demographics + engineered features).
2. **Encoding**: Categorical strings → ordinal integers (gender, device, admission type).
3. **Engineering**: Derive MAP, shock index, SpO₂ gap.
4. **Prediction**: Pass through ~100–1000 trees, each contributing a small additive correction. The final score is passed through a sigmoid to produce a probability.
5. **Output**: A single probability in `[0, 1]`.
XGBoost is ideal for this because it handles tabular data excellently, is fast at inference (<1ms per prediction), is robust to missing/default values, and provides SHAP explanations natively.
 
### 7.2 LSTM: Temporal Risk Forecasting
 
The Long Short-Term Memory (LSTM) network captures temporal patterns — how vital signs are changing over time — which XGBoost cannot see.
 
1. **Input**: 12 consecutive timesteps × N features (the last 5 minutes of monitoring).
2. **Temporal enrichment**: Each timestep is augmented with `_delta` (change from previous step) and `_mean` (3-step rolling average) for each feature.
3. **Normalization**: `StandardScaler` z-scores all values to zero mean and unit variance. LSTM gates are sensitive to scale — without this, large-magnitude features would dominate.
4. **Prediction**: The LSTM processes the 12 timesteps sequentially; the final hidden state represents the temporal context, fed to a sigmoid output.
5. **Output**: A future risk probability in `[0, 1]` representing predicted risk ~12 hours ahead.
The LSTM is deliberately conservative: it requires both 12 real data rows **and** 300 real seconds of data to prevent predictions from a 12-second window being treated as equivalent to a 12-minute window.
 
### 7.3 Ensemble Fusion
 
```
if LSTM is ready:
    ensemble_prob = (xgb_prob + lstm_prob) / 2   (50/50 equal weight)
else:
    ensemble_prob = xgb_prob                      (XGBoost only)
```
 
Equal weighting is a deliberate design choice for a prototype — more sophisticated systems would use learned weights based on calibrated performance on held-out data.
 
### 7.4 SHAP Feature Attribution
 
SHAP (SHapley Additive exPlanations) values explain *why* the model gave a particular score. For each prediction, the contribution of each feature is computed:
 
- Positive SHAP value: this feature increased the risk probability.
- Negative SHAP value: this feature decreased the risk probability.
The bridge uses XGBoost's native tree SHAP implementation (`pred_contribs=True`), which is exact and fast. The top 5 features by |contribution| are returned, displayed as horizontal bars in the SHAP panel.
 
In the UI, red bars indicate `"increases"` risk contributions and green bars indicate `"decreases"` contributions. The bar width is proportional to each feature's share of the total absolute impact.
 
### 7.5 Rule-Based Fallback
 
When ML models are unavailable, the system uses a 7-vital scoring rubric derived from clinical early warning scoring concepts:
- Critical thresholds (HR < 50 / > 130, SpO₂ < 85%) score 25–35 points.
- Borderline thresholds score 10–20 points.
- Points are summed and capped at 100.
- Divided by 100 → probability.
This mirrors real clinical tools like MEWS (Modified Early Warning Score) or NEWS2, providing a medically plausible fallback even when no ML is running.
 
### 7.6 Patient Phase Simulation
 
The simulation cycles through three phases every 15 seconds:
 
| Phase | Noise σ | Spike prob | HR drift | SpO₂ drift | BP drift |
|---|---|---|---|---|---|
| NORMAL | 0.8 | 1% | +0.02/tick | −0.01/tick | 0 |
| MEDIUM | 1.5 | 4% | +0.08/tick | −0.05/tick | −0.06/tick |
| CRITICAL | 2.5 | 10% | +0.15/tick | −0.12/tick | −0.15/tick |
 
At 1 tick per second, a CRITICAL phase running for 15 seconds would raise HR by ~2.25 bpm and drop SpO₂ by ~1.8% through drift alone — plus random noise and spikes. This produces realistic-looking deterioration that triggers CRITICAL alerts and pushes the XGBoost prediction up.
 
### 7.7 Waveform Rendering Engine
 
All 16 waveforms render at 60fps using `requestAnimationFrame`. A single `drawWaveforms()` function iterates all registered canvases:
 
```
for each canvas in canvasReferences:
    clear + draw background + draw grid
    compute waveform y = f(x, offset, vitalParams)
    stroke path
    advance offset by waveform-specific speed
```
 
The `offset` value for each waveform advances each frame, creating the scrolling effect. Because `offset` is mod-wrapped (`cycle = (x + offset) % cycleLength`), the waveform repeats continuously.
 
The waveform math models are parameterized by actual vital values. For example, ECG amplitude and shape change with heart rate; ABP waveform directly encodes `systolicBP` and `diastolicBP` as pixel positions via the formula `y = h - 5 - ((bp - 40) / 160) * (h - 10)`.
 
---
 
## 8. API Reference
 
All endpoints return JSON. All support CORS (any origin).
 
### `GET /health`
 
Returns model loading status and bridge health.
 
```json
{
  "status": "ok",
  "models_ready": true,
  "version": "2.0.0-node-xgb-lstm",
  "bridge": {
    "ok": true,
    "models_ready": true,
    "xgb_ready": true,
    "lstm_ready": true,
    "feature_counts": { "xgb_features": 24, "lstm_features": 18, "top_features": 8 },
    "model_dir": "/path/to/ml/model_store",
    "warnings": []
  }
}
```
 
### `POST /predict/current`
 
Single-snapshot XGBoost prediction.
 
**Request body:** Vital snapshot (any subset of the 21 vital fields; missing fields use defaults).
 
```json
{
  "heart_rate": 105, "spo2_pct": 89, "systolic_bp": 119, ...
}
```
 
**Response:**
```json
{
  "success": true,
  "prediction": {
    "risk_probability": 0.6234,
    "risk_level": "CRITICAL",
    "risk_score_pct": 62.34,
    "model": "XGBoost",
    "features_used": 24,
    "risk_drivers": [
      { "feature": "spo2_pct", "label": "SpO2", "value": 89.0,
        "impact": 0.18423, "impact_abs": 0.18423, "impact_pct": 34.2, "direction": "increases" },
      ...
    ]
  }
}
```
 
### `POST /predict/temporal`
 
LSTM temporal prediction. Internally also runs XGBoost and updates the sequence buffer.
 
**Request body:** Same as `/predict/current` plus optional `patient_id`.
 
**Response:**
```json
{
  "success": true,
  "prediction": {
    "ready": false,
    "future_risk_probability": null,
    "trend": "STABLE",
    "confidence": 0.0,
    "sequence_length": 5,
    "sequence_required": 12,
    "window_seconds": 5.0,
    "window_required_seconds": 300,
    "forecast_series": [],
    "model": "LSTM-not-ready",
    "message": "LSTM pending: 5.0s / 300s"
  }
}
```
 
After 5 minutes of streaming data:
```json
{
  "success": true,
  "prediction": {
    "ready": true,
    "future_risk_probability": 0.7821,
    "trend": "WORSENING",
    "confidence": 0.642,
    "sequence_length": 312,
    "forecast_series": [0.6234, 0.6649, 0.7064, 0.7479, 0.7650, 0.7821],
    "model": "LSTM",
    "window_seconds": 312.0,
    "window_required_seconds": 300
  }
}
```
 
### `POST /predict/combined`
 
Full ensemble prediction. **This is what the frontend calls every second.**
 
**Request body:** Same as above.
 
**Response:**
```json
{
  "success": true,
  "patient_id": "ICU-2024-0843",
  "prediction": {
    "xgb": { "risk_probability": 0.6234, "risk_level": "CRITICAL", "risk_drivers": [...] },
    "lstm": { "ready": true, "future_risk_probability": 0.7821, "trend": "WORSENING", ... },
    "ensemble": {
      "risk_probability": 0.7028,
      "risk_level": "CRITICAL",
      "risk_score_pct": 70.28,
      "model": "equal-weight-ensemble",
      "weights": { "xgb": 0.5, "lstm": 0.5 }
    },
    "shap_drivers": [...]
  }
}
```
 
### `POST /stream/vitals`
 
Lightweight endpoint to push vitals into the LSTM sequence buffer without running inference.
 
**Response:**
```json
{
  "success": true,
  "patient_id": "ICU-DEFAULT",
  "buffer_length": 45,
  "sequence_required": 12,
  "lstm_ready": false
}
```
 
### `GET /patient/state?patient_id=ICU-DEFAULT`
 
Returns combined current + temporal state for a patient.
 
### `GET /docs`
 
Returns a JSON API index listing all endpoint paths.
 
---
 
## 9. Error Handling & Edge Cases
 
| Scenario | Behavior |
|---|---|
| Python not in PATH | `MlBridgeClient.start()` spawns fail; `rejectAll()` rejects all pending requests; server returns rule-based fallback |
| ML packages missing (numpy, tensorflow, xgboost) | `ml_bridge.py` degrades gracefully: `np = None` etc.; warns in `WARNINGS` list; returns rule-based fallback for affected operations |
| Model files not found | `load_all_models()` logs warnings and sets `models_ready = False`; all predictions fall back to rule-based |
| Python subprocess crashes | `child.on("exit")` fires `rejectAll()`; next request call re-spawns Python |
| ML inference times out | `setTimeout` in `request()` rejects with "ML bridge timed out for \<action\>"; route handler catches and uses fallback |
| Malformed JSON from Python | `handleStdout` logs `[ml-bridge] Non-JSON stdout: <line>` and skips the line |
| `NaN` / `Infinity` in prediction | `respond()` uses `allow_nan=False` so Python raises `ValueError` internally; bridge returns `ok: false` error response |
| LSTM not ready | `predictTemporal()` returns `notReadyLstm()` without calling Python; frontend shows countdown |
| Request body > 1MB | `readJsonBody()` throws 413; handler returns `{ success: false, error: "Request body too large" }` |
| Invalid JSON body | `readJsonBody()` throws 400; handler returns `{ success: false, error: "Invalid JSON body" }` |
| Path traversal attempt (`/static/../../../etc/passwd`) | `serveStatic()` checks `staticRelative.startsWith("..")` and throws 403 Forbidden |
| Frontend: backend connection failed | `checkBackendConnection()` catches fetch exception; `fallbackRiskCalculation()` runs the same rule-based scorer locally |
| Frontend: concurrent predictions | `activePredictionInFlight` flag prevents overlapping `/predict/combined` calls |
| Frontend: vitals outside physiological range | `clamp()` is applied to every simulated vital update: HR in [40, 180], SpO₂ in [70, 100], etc. |
 
---
 
## 10. Setup & Installation
 
### Prerequisites
 
| Tool | Required? | Notes |
|---|---|---|
| Node.js ≥ 18 | **Yes** | For `node --watch` and built-in ESM |
| Python ≥ 3.9 | **Yes** | For ML bridge |
| pip packages | **Yes** | `numpy`, `joblib`, `xgboost`, `tensorflow` (or `keras`) |
 
### Step 1: Clone / Unzip
 
```bash
unzip aiml_project.zip
cd aiml_project
```
 
### Step 2: Install Python ML Dependencies
 
```bash
pip install numpy joblib xgboost tensorflow
```
 
Or using a virtual environment (recommended):
 
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
 
pip install numpy joblib xgboost tensorflow
```
 
> **Note:** TensorFlow is a large package (~400–600 MB). If you only want XGBoost predictions and not LSTM, you can skip `tensorflow` — the bridge will gracefully degrade to XGBoost-only mode.
 
### Step 3: Verify Model Artifacts
 
```
ml/model_store/
  xgb_model.pkl                ✓
  xgb_features.pkl             ✓
  lstm_model - Copy.keras      ✓
  lstm_features - Copy.pkl     ✓
  lstm_scaler - Copy.pkl       ✓
  top_features - Copy.pkl      ✓
```
 
### Step 4: Start the Server
 
```bash
# Production:
npm start
 
# Development (auto-restarts on file changes):
npm run dev
```
 
### Step 5: Open the Dashboard
 
Navigate to: **`http://localhost:8000/`**
 
You should see the ICU dashboard immediately with simulated waveforms. The "ML Connected" indicator in the header confirms the backend is running.
 
### Step 6: Using a Custom Python Executable
 
If your ML packages are installed in a specific Python environment:
 
```bash
# Linux/macOS:
ML_PYTHON=/path/to/venv/bin/python npm start
 
# Windows PowerShell:
$env:ML_PYTHON="C:\path\to\python.exe"
npm start
 
# Windows CMD:
set ML_PYTHON=C:\path\to\python.exe && npm start
```
 
### Step 7: Using a Custom Model Directory
 
```bash
MODEL_DIR=/path/to/your/models npm start
```
 
---
 
## 11. Usage Examples
 
### Test the Health Endpoint
 
```bash
curl http://localhost:8000/health
```
 
Expected output when all models are loaded:
```json
{
  "status": "ok",
  "models_ready": true,
  "version": "2.0.0-node-xgb-lstm",
  "bridge": { "ok": true, "models_ready": true, ... }
}
```
 
### Get a Risk Prediction (Normal Patient)
 
```bash
curl -X POST http://localhost:8000/predict/current \
  -H "Content-Type: application/json" \
  -d '{
    "heart_rate": 78,
    "spo2_pct": 97,
    "systolic_bp": 122,
    "diastolic_bp": 78,
    "respiratory_rate": 16,
    "temperature_c": 37.1,
    "lactate": 1.2,
    "age": 65
  }'
```
 
### Get a Risk Prediction (Critical Patient)
 
```bash
curl -X POST http://localhost:8000/predict/current \
  -H "Content-Type: application/json" \
  -d '{
    "heart_rate": 160,
    "spo2_pct": 78,
    "systolic_bp": 82,
    "diastolic_bp": 44,
    "respiratory_rate": 33,
    "temperature_c": 39.1,
    "lactate": 4.5,
    "creatinine": 2.4,
    "oxygen_device": "ventilator",
    "sepsis_risk_score": 8,
    "age": 80
  }'
```
 
Expected: `risk_level: "CRITICAL"`, `risk_probability > 0.55`.
 
### Trigger the Critical Example in the Dashboard
 
In the browser dashboard, click the **⚡ Load Critical** button in the center column. This populates all 22 input fields with a critical patient profile and immediately requests a new ML prediction.
 
### Manually Adjust Vitals
 
1. Click the **History** tab in the center column.
2. Modify any field in the "Manual Input" form.
3. Click **Apply Values & Get Prediction**.
4. Watch the risk gauge, SHAP drivers, and trajectory chart update in real time.
### Add a Clinical Note
 
1. Click the **Notes** tab.
2. Type in the textarea.
3. Click **Add Note** — it appears at the top of the notes list with "Just now" timestamp.
### Stream Vitals for LSTM Buffer Building
 
```bash
for i in $(seq 1 350); do
  curl -s -X POST http://localhost:8000/stream/vitals \
    -H "Content-Type: application/json" \
    -d "{\"patient_id\":\"ICU-001\",\"heart_rate\":$(( 75 + RANDOM % 20 )),\"spo2_pct\":$(( 93 + RANDOM % 6 )),\"timestamp\":$(date +%s%3N)}" > /dev/null
  sleep 1
done
```
 
After ~300 iterations (5 minutes), the LSTM will activate and begin producing temporal predictions.
 
---
 
## 12. Dependencies & Why Each Is Needed
 
### Node.js Runtime Dependencies
 
None. The server uses only Node.js built-in modules:
 
| Module | Why it's used |
|---|---|
| `node:http` | Creates the HTTP server without any framework overhead |
| `node:fs` | `createReadStream` for efficient file serving |
| `node:fs/promises` | `stat()` for file metadata before serving |
| `node:path` | Cross-platform path manipulation (`path.join`, `path.resolve`) |
| `node:url` | `fileURLToPath`, `URL` for parsing request URLs |
| `node:child_process` | `spawn()` to start the Python subprocess |
 
### Python Dependencies
 
| Package | Version | Why it's needed |
|---|---|---|
| `numpy` | ≥ 1.21 | Array operations, feature matrix construction, `np.array`, `np.clip`, `np.argsort` |
| `joblib` | ≥ 1.0 | Deserializing `.pkl` model artifacts (XGBoost model, feature lists, scaler) |
| `xgboost` | ≥ 1.7 | XGBoost inference (`predict_proba`), native SHAP contributions (`pred_contribs=True`) |
| `tensorflow` | ≥ 2.10 | Keras LSTM model loading (`load_model`) and inference (`model.predict`) |
 
> `scikit-learn` is implicitly required (for the `StandardScaler` in `lstm_scaler.pkl`) — `joblib.load` will work but `scaler.transform()` will fail if `sklearn` is not installed. Add `scikit-learn` to your install list.
 
### Frontend (CDN / Browser APIs)
 
| Resource | Why it's used |
|---|---|
| Google Fonts (JetBrains Mono, Inter) | Monospace digits don't jitter in width; Inter is a clean clinical sans-serif |
| Canvas 2D API | 60fps animated waveform rendering |
| SVG (inline) | Scalable risk gauges and trajectory chart without a charting library |
| Web Audio API | Alert tones and SpO₂-pitch heartbeat sound |
| Fetch API | Async HTTP calls to the backend |
| Notification API | Browser push notifications for critical alerts |
 
---
 
## 13. Possible Improvements & Known Issues
 
### Known Issues
 
1. **`- Copy` artifact filenames** — The LSTM model files have `- Copy` in their names from being manually copied out of a training environment. They should be renamed to their canonical names (`lstm_model.keras`, etc.) and the glob fallbacks can then be simplified.
2. **Double initialization guard is imperfect** — `init()` is registered on both `window.load` and `DOMContentLoaded`. A second `initResponsive()` is also registered separately. The `appInitialized` flag prevents double-init of the main flow, but `initResponsive()` is called twice on page load. Harmless but untidy.
3. **Simulation overwrites manual inputs** — Once the 1-second simulation loop starts calling `updateVitals()`, it continuously drifts the state object. If a user enters manual values and waits too long before clicking "Apply", the displayed values in input fields will be stale. A "pause simulation while editing" UX would help.
4. **Single-patient buffer only** — The `SequenceManager` supports multiple patients by key, but the frontend only ever sends one patient ID (`ICU-2024-0843`). The sidebar patient list is hardcoded to one patient.
5. **Audio requires user interaction** — `AudioContext` can only be created after a user gesture (browser policy). If the page loads and a critical alert fires before any click, the alert sound will silently fail.
6. **No persistence** — Vital history, sequence buffers, and clinical notes are all in-memory. Restarting the server loses all state, including the 5-minute LSTM warmup window.
7. **LSTM warmup on every restart** — Every time the server restarts, the LSTM buffer is empty and the 5-minute countdown resets. In production, the buffer would need to be persisted (e.g., in Redis or written to disk).
8. **Commented-out `updateVitals` function** — The original simple `updateVitals` function is commented out inside a `/* ... */` block (~35 lines). This dead code should be removed.
9. **`scikit-learn` not listed as a requirement** — `lstm_scaler.pkl` is a `StandardScaler` object that requires `sklearn` to call `.transform()`. It should be listed in the dependencies.
### Suggested Improvements
 
**Short-term:**
- Add a `requirements.txt` (or `pyproject.toml`) listing all Python dependencies with pinned versions.
- Rename the `- Copy` model files and update the bridge accordingly.
- Add a `Dockerfile` and `docker-compose.yml` that bundles both Node.js and Python with all dependencies.
- Persist the LSTM sequence buffer to disk (JSON file or SQLite) so warmup survives server restarts.
**Medium-term:**
- Replace the 50/50 ensemble with a calibrated stacking model trained on held-out validation data.
- Add a WebSocket-based streaming endpoint to replace the 1-second polling loop — reduces HTTP overhead and improves real-time responsiveness.
- Add multi-patient support to the frontend (the backend already supports it via `patient_id`).
- Implement proper clinical alert logging (every alert fired, timestamp, which vital triggered it, what the ML risk score was).
**Long-term:**
- Add model versioning and A/B testing infrastructure.
- Integrate a real EHR data feed (HL7 FHIR, DICOM-structured reports) to replace the simulation.
- Add model recalibration pipeline — clinical ML models drift as patient populations change.
- Add explainability beyond SHAP: counterfactual explanations ("risk would drop below 30% if SpO₂ > 94%").
- Audit trail / audit log for all predictions (regulatory requirement in clinical use).
- Implement user authentication — in any real deployment, patient data access must be gated