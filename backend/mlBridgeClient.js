const DEFAULT_TIMEOUT_MS = Number(process.env.ML_BRIDGE_TIMEOUT_MS || 120000);
const DEFAULT_ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:7860";

export class MlBridgeClient {
  constructor({ serviceUrl = DEFAULT_ML_SERVICE_URL } = {}) {
    this.serviceUrl = serviceUrl.replace(/\/+$/, "");
  }

  async request(action, payload = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.serviceUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
        signal: controller.signal
      });

      const text = await response.text();
      let body = {};
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          throw new Error(`ML service returned non-JSON response: ${text.slice(0, 200)}`);
        }
      }

      if (!response.ok || body.ok === false) {
        throw new Error(body.error || `ML service ${action} failed with HTTP ${response.status}`);
      }

      return Object.prototype.hasOwnProperty.call(body, "result") ? body.result : body;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`ML service timed out for ${action}`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async health(timeoutMs = Number(process.env.ML_HEALTH_TIMEOUT_MS || 10000)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        method: "GET",
        signal: controller.signal
      });
      const body = await response.json();
      return {
        ...body,
        http_status: response.status,
        service_url: this.serviceUrl
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
