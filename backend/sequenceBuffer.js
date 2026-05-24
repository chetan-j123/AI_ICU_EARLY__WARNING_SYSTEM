import { SEQ_LEN } from "./defaults.js";

// Keep up to 10 minutes of historical data (600 seconds) to be safe
export const LSTM_HISTORY_MS = 10 * 60 * 1000; // 600 seconds
export const ACTIVE_PREDICTION_INTERVAL_MS = 1 * 1000; // match frontend 1-second sends
// Require 300 seconds of real data before LSTM is ready
export const WINDOW_REQUIRED_MS = 300 * 1000;

function cloneForModel(row) {
  const { _timestampMs, ...modelRow } = row;
  return { ...modelRow };
}

class PatientSequenceBuffer {
  constructor(patientId) {
    this.patientId = patientId;
    // Capacity: allow at least 600 entries (600 seconds) plus some margin
    this.capacity = Math.ceil(LSTM_HISTORY_MS / ACTIVE_PREDICTION_INTERVAL_MS) + SEQ_LEN + 50;
    this.raw = [];
  }

  push(rawVital) {
    const timestampMs = Number.isFinite(Number(rawVital.timestamp))
      ? Number(rawVital.timestamp)
      : Date.now();

    this.raw.push({ ...rawVital, _timestampMs: timestampMs });
    this.trim();
  }

  trim() {
    const cutoff = Date.now() - LSTM_HISTORY_MS;
    this.raw = this.raw.filter((row) => row._timestampMs >= cutoff);

    if (this.raw.length > this.capacity) {
      this.raw.splice(0, this.raw.length - this.capacity);
    }
  }

  // Returns only real rows — no padding/upsampling.
  getWindow() {
    this.trim();
    // Return the most recent SEQ_LEN rows of real data
    const real = this.raw.slice(-SEQ_LEN);
    return real.map(cloneForModel);
  }

  get length() {
    this.trim();
    return this.raw.length;
  }

  // True only when we have ≥ SEQ_LEN REAL rows spanning ≥ WINDOW_REQUIRED_MS.
  ready() {
    this.trim();
    if (this.raw.length < SEQ_LEN) return false;
    const span = this.windowSpanMs();
    // Compare with tolerance of 10ms
    return span >= WINDOW_REQUIRED_MS - 10;
  }

  windowSpanMs() {
    this.trim();
    if (this.raw.length < 2) return 0;
    return this.raw[this.raw.length - 1]._timestampMs - this.raw[0]._timestampMs;
  }
}

export class SequenceManager {
  constructor() {
    this.buffers = new Map();
  }

  getOrCreate(patientId) {
    if (!this.buffers.has(patientId)) {
      this.buffers.set(patientId, new PatientSequenceBuffer(patientId));
    }
    return this.buffers.get(patientId);
  }

  pushVitals(patientId, vital) {
    this.getOrCreate(patientId).push(vital);
  }

  getWindow(patientId) {
    return this.getOrCreate(patientId).getWindow();
  }

  sequenceLength(patientId) {
    return this.buffers.get(patientId)?.length ?? 0;
  }

  isReady(patientId) {
    return this.buffers.get(patientId)?.ready() ?? false;
  }

  windowSpanMs(patientId) {
    return this.buffers.get(patientId)?.windowSpanMs() ?? 0;
  }

  activePatients() {
    return Array.from(this.buffers.keys());
  }
}

export const sequenceManager = new SequenceManager();