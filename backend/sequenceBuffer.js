import { SEQ_LEN } from "./defaults.js";

export const LSTM_HISTORY_MS = 5 * 60 * 1000;
export const ACTIVE_PREDICTION_INTERVAL_MS = 2 * 1000;

function cloneForModel(row) {
  const { _timestampMs, ...modelRow } = row;
  return { ...modelRow };
}

function sampleRows(rows, targetLength) {
  if (rows.length <= targetLength) {
    return rows;
  }

  return Array.from({ length: targetLength }, (_, index) => {
    const sourceIndex = Math.round(index * (rows.length - 1) / (targetLength - 1));
    return rows[sourceIndex];
  });
}

class PatientSequenceBuffer {
  constructor(patientId) {
    this.patientId = patientId;
    this.capacity = Math.ceil(LSTM_HISTORY_MS / ACTIVE_PREDICTION_INTERVAL_MS) + SEQ_LEN;
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

  getWindow() {
    this.trim();
    return sampleRows(this.raw, SEQ_LEN).map(cloneForModel);
  }

  get length() {
    return this.getWindow().length;
  }

  ready() {
    return this.length >= SEQ_LEN;
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

  activePatients() {
    return Array.from(this.buffers.keys());
  }
}

export const sequenceManager = new SequenceManager();
