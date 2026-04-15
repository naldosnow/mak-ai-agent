export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const id = env.PATIENT_AGENT.idFromName("demo-patient");
    const stub = env.PATIENT_AGENT.get(id);

    if (url.pathname === "/") {
      return html(`
        <html>
          <head>
            <title>MAK Beta V2</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.45;
              }
              .card {
                border: 1px solid #ccc;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
              }
              button, select, input, textarea {
                width: 100%;
                margin: 8px 0;
                padding: 12px;
                font-size: 16px;
                box-sizing: border-box;
              }
              textarea {
                min-height: 90px;
              }
              pre {
                background: #111;
                color: #f1f1f1;
                padding: 12px;
                border-radius: 10px;
                white-space: pre-wrap;
                word-break: break-word;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>MAK Beta V2</h1>
              <p>Governed access, break-glass, misuse flagging, and auditability.</p>
            </div>

            <div class="card">
              <h2>System</h2>
              <button onclick="callGet('/api/init')">POST /api/init</button>
              <button onclick="callGet('/api/patient')">GET /api/patient</button>
              <button onclick="callGet('/api/audit')">GET /api/audit</button>
            </div>

            <div class="card">
              <h2>Access Test</h2>
              <select id="role">
                <option value="authorized_provider">authorized_provider</option>
                <option value="patient">patient</option>
                <option value="unauthorized">unauthorized</option>
              </select>
              <input id="actor" value="dr-demo-001" />
              <button onclick="postAccess()">POST /api/access</button>
            </div>

            <div class="card">
              <h2>Break-Glass</h2>
              <input id="bgActor" value="emergency-room-1" />
              <textarea id="bgReason">Unresponsive patient during emergency intake.</textarea>
              <button onclick="postBreakGlass()">POST /api/break-glass</button>
            </div>

            <pre id="out">Ready.</pre>

            <script>
              async function render(res) {
                const text = await res.text();
                document.getElementById('out').textContent = text;
              }

              async function callGet(path) {
                const method = path === '/api/init' ? 'POST' : 'GET';
                const res = await fetch(path, { method });
                await render(res);
              }

              async function postAccess() {
                const role = document.getElementById('role').value;
                const actor = document.getElementById('actor').value;

                const res = await fetch('/api/access', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role, actor })
                });

                await render(res);
              }

              async function postBreakGlass() {
                const actor = document.getElementById('bgActor').value;
                const reason = document.getElementById('bgReason').value;

                const res = await fetch('/api/break-glass', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ actor, reason })
                });

                await render(res);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (url.pathname === "/api/init" && request.method === "POST") {
      return stub.fetch("https://internal/init", { method: "POST" });
    }

    if (url.pathname === "/api/patient" && request.method === "GET") {
      return stub.fetch("https://internal/patient");
    }

    if (url.pathname === "/api/access" && request.method === "POST") {
      return stub.fetch("https://internal/access", request);
    }

    if (url.pathname === "/api/break-glass" && request.method === "POST") {
      return stub.fetch("https://internal/break-glass", request);
    }

    if (url.pathname === "/api/audit" && request.method === "GET") {
      return stub.fetch("https://internal/audit");
    }

    return new Response("Not found", { status: 404 });
  }
};

export class PatientAgent {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.initTables();
  }

  initTables() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS patient (
        id TEXT PRIMARY KEY,
        name TEXT,
        emergency_access_until TEXT,
        failed_attempts INTEGER DEFAULT 0,
        misuse_flag INTEGER DEFAULT 0,
        init_locked INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        actor TEXT NOT NULL,
        details_json TEXT,
        timestamp TEXT NOT NULL
      )
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      return this.handleInit();
    }

    if (url.pathname === "/patient" && request.method === "GET") {
      return this.handlePatient();
    }

    if (url.pathname === "/access" && request.method === "POST") {
      return this.handleAccess(request);
    }

    if (url.pathname === "/break-glass" && request.method === "POST") {
      return this.handleBreakGlass(request);
    }

    if (url.pathname === "/audit" && request.method === "GET") {
      return this.handleAudit();
    }

    return new Response("DO route not found", { status: 404 });
  }

  now() {
    return new Date().toISOString();
  }

  log(type, actor, details = {}) {
    this.sql.exec(
      `INSERT INTO audit (type, actor, details_json, timestamp) VALUES (?, ?, ?, ?)`,
      type,
      actor,
      JSON.stringify(details),
      this.now()
    );
  }

  getPatientRow() {
    const rows = [...this.sql.exec(`SELECT * FROM patient WHERE id = ?`, "demo")];
    return rows[0] || null;
  }

  ensurePatientExists() {
    const existing = this.getPatientRow();
    if (existing) return existing;

    const now = this.now();

    this.sql.exec(
      `INSERT INTO patient (
        id, name, emergency_access_until, failed_attempts, misuse_flag, init_locked, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      "demo",
      "Demo Patient",
      null,
      0,
      0,
      0,
      now,
      now
    );

    return this.getPatientRow();
  }

  async handleInit() {
    const patient = this.ensurePatientExists();

    if (Number(patient.init_locked) === 1) {
      return Response.json({
        ok: false,
        error: "Initialization locked",
        message: "System has already been initialized for this object."
      }, { status: 409 });
    }

    const now = this.now();

    this.sql.exec(
      `UPDATE patient
       SET name = ?, emergency_access_until = ?, failed_attempts = ?, misuse_flag = ?, init_locked = ?, updated_at = ?
       WHERE id = ?`,
      "Demo Patient",
      null,
      0,
      0,
      1,
      now,
      "demo"
    );

    this.log("system_init", "system", {
      locked_after_init: true
    });

    return Response.json({
      ok: true,
      message: "System initialized and locked",
      patient: this.getPatientRow()
    });
  }

  async handlePatient() {
    const patient = this.ensurePatientExists();

    return Response.json({
      ok: true,
      patient
    });
  }

  async handleAccess(request) {
    const patient = this.ensurePatientExists();
    const body = await request.json();
    const role = body.role || "unauthorized";
    const actor = body.actor || "unknown-actor";

    let allowed = false;
    let reason = "unauthorized_role";

    if (role === "patient") {
      allowed = true;
      reason = "patient_self_access";
    }

    if (role === "authorized_provider") {
      allowed = true;
      reason = "authorized_provider_access";
    }

    if (!allowed) {
      this.sql.exec(
        `UPDATE patient
         SET failed_attempts = failed_attempts + 1,
             updated_at = ?
         WHERE id = ?`,
        this.now(),
        "demo"
      );

      const updated = this.getPatientRow();
      const attempts = Number(updated.failed_attempts);

      if (attempts >= 3 && Number(updated.misuse_flag) === 0) {
        this.sql.exec(
          `UPDATE patient
           SET misuse_flag = 1,
               updated_at = ?
           WHERE id = ?`,
          this.now(),
          "demo"
        );

        this.log("misuse_flagged", "system", {
          actor,
          threshold: 3,
          failed_attempts: attempts
        });
      }

      this.log("access_denied", actor, {
        role,
        reason
      });

      return Response.json({
        ok: true,
        role,
        actor,
        allowed: false,
        reason,
        patient: this.getPatientRow()
      });
    }

    this.sql.exec(
      `UPDATE patient
       SET failed_attempts = 0,
           updated_at = ?
       WHERE id = ?`,
      this.now(),
      "demo"
    );

    this.log("access_granted", actor, {
      role,
      reason
    });

    return Response.json({
      ok: true,
      role,
      actor,
      allowed: true,
      reason,
      patient: this.getPatientRow()
    });
  }

  async handleBreakGlass(request) {
    const patient = this.ensurePatientExists();
    const body = await request.json();
    const actor = body.actor || "unknown-emergency-actor";
    const reason = (body.reason || "").trim();

    if (!reason) {
      return Response.json({
        ok: false,
        error: "Reason required"
      }, { status: 400 });
    }

    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    this.sql.exec(
      `UPDATE patient
       SET emergency_access_until = ?,
           updated_at = ?
       WHERE id = ?`,
      expires,
      this.now(),
      "demo"
    );

    this.log("break_glass", actor, {
      reason,
      expires
    });

    return Response.json({
      ok: true,
      actor,
      reason,
      expires,
      patient: this.getPatientRow()
    });
  }

  async handleAudit() {
    const rows = [
      ...this.sql.exec(`SELECT * FROM audit ORDER BY id DESC LIMIT 50`)
    ];

    return Response.json({
      ok: true,
      audit: rows.map(row => ({
        id: row.id,
        type: row.type,
        actor: row.actor,
        details: row.details_json ? JSON.parse(row.details_json) : {},
        timestamp: row.timestamp
      }))
    });
  }
}

function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
