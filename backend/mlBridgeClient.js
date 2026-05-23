import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = Number(process.env.ML_BRIDGE_TIMEOUT_MS || 120000);

export class MlBridgeClient {
  constructor({ projectRoot, scriptPath, pythonCommand = process.env.ML_PYTHON || "python" }) {
    this.projectRoot = projectRoot;
    this.scriptPath = scriptPath;
    this.pythonCommand = pythonCommand;
    this.child = null;
    this.nextId = 1;
    this.pending = new Map();
    this.stdoutBuffer = "";
    this.stderrBuffer = "";
  }

  start() {
    if (this.child && !this.child.killed) return;

    this.child = spawn(this.pythonCommand, [this.scriptPath], {
      cwd: this.projectRoot,
      env: {
        ...process.env,
        PROJECT_ROOT: this.projectRoot,
        PYTHONUNBUFFERED: "1",
        TF_CPP_MIN_LOG_LEVEL: process.env.TF_CPP_MIN_LOG_LEVEL || "2"
      },
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.child.stdout.on("data", (chunk) => this.handleStdout(chunk));
    this.child.stderr.on("data", (chunk) => this.handleStderr(chunk));
    this.child.on("error", (error) => this.rejectAll(error));
    this.child.on("exit", (code, signal) => {
      const suffix = signal ? `signal ${signal}` : `code ${code}`;
      this.rejectAll(new Error(`ML bridge exited with ${suffix}`));
      this.child = null;
    });
  }

  async request(action, payload = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.start();

    const id = this.nextId++;
    const message = JSON.stringify({ id, action, payload }) + "\n";

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`ML bridge timed out for ${action}`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      this.child.stdin.write(message, (error) => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  handleStdout(chunk) {
    this.stdoutBuffer += chunk.toString("utf8");

    let newlineIndex;
    while ((newlineIndex = this.stdoutBuffer.indexOf("\n")) >= 0) {
      const line = this.stdoutBuffer.slice(0, newlineIndex).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
      if (!line) continue;

      let message;
      try {
        message = JSON.parse(line);
      } catch (error) {
        console.error(`[ml-bridge] Non-JSON stdout: ${line}`);
        continue;
      }

      const pending = this.pending.get(message.id);
      if (!pending) continue;

      clearTimeout(pending.timer);
      this.pending.delete(message.id);

      if (message.ok) {
        pending.resolve(message.result);
      } else {
        pending.reject(new Error(message.error || "ML bridge request failed"));
      }
    }
  }

  handleStderr(chunk) {
    this.stderrBuffer += chunk.toString("utf8");

    let newlineIndex;
    while ((newlineIndex = this.stderrBuffer.indexOf("\n")) >= 0) {
      const line = this.stderrBuffer.slice(0, newlineIndex).trim();
      this.stderrBuffer = this.stderrBuffer.slice(newlineIndex + 1);
      if (line) console.error(`[ml-bridge] ${line}`);
    }
  }

  rejectAll(error) {
    for (const [id, pending] of this.pending.entries()) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(id);
    }
  }
}
