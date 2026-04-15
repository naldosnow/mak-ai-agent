export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const id = env.PATIENT_AGENT.idFromName("demo-patient");
    const stub = env.PATIENT_AGENT.get(id);

    if (url.pathname === "/") {
      return html(`
        <h1>MAK Beta V2</h1>
        <p>Governed access, break-glass, misuse flagging, and auditability.</p>
      `);
    }

    if (url.pathname === "/api/init" && request.method === "POST") {
      return stub.fetch("https://internal/init", { method: "POST" });
    }

    if (url.pathname === "/api/patient") {
      return stub.fetch("https://internal/patient");
    }

    if (url.pathname === "/api/access" && request.method === "POST") {
      return stub.fetch("https://internal/access", request);
    }

    if (url.pathname === "/api/break-glass" && request.method === "POST") {
      return stub.fetch("https://internal/break-glass", request);
    }

    if (url.pathname === "/api/audit") {
      return stub.fetch("https://internal/audit");
    }

    return new Response("Not found", { status: 404 });
  }
};

export class PatientAgent {
  constructor(ctx) {
    this.ctx = ctx;
    this.sql = ctx.storage.sql;
    this.initTables();
  }

  now() {
    return new Date().toISOString();
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
        type TEXT,
        actor TEXT,
        details_json TEXT,
        timestamp TEXT
      )
    `);
  }

  serializePatient(row) {
    if (!row) return null;

    return {
      id: row.id ?? null,
      name: row.name ?? null,
      emergency_access_until: row.emergency_access_until ?? null,
      failed_attempts: Number(row.failed_attempts ?? 0),
      misuse_flag: Number(row.misuse_flag ?? 0),
      init_locked: Number(row.init_locked ?? 0),
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null
    };
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
      `INSERT INTO patient (id, name, emergency_access_until, failed_attempts, misuse_flag, init_locked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      return this.handleInit();
    }

    if (url.pathname === "/patient") {
      return this.handlePatient();
    }

    if (url.pathname === "/access" && request.method === "POST") {
      return this.handleAccess(request);
    }

    if (url.pathname === "/break-glass" && request.method === "POST") {
      return this.handleBreakGlass(request);
    }

    if (url.pathname === "/audit") {
      return this.handleAudit();
    }

    return new Response("DO route not found", { status: 404 });
  }

  async handleInit() {
    const patient = this.ensurePatientExists();

    if (Number(patient.init_locked) === 1) {
      return Response.json({
        ok: false,
        error: "Initialization locked"
      }, { status: 409 });
    }

    const now = this.now();

    this.sql.exec(
      `UPDATE patient
       SET init_locked = 1, updated_at = ?
       WHERE id = ?`,
      now,
      "demo"
    );

    this.log("system_init", "system");

    return Response.json({
      ok: true,
      patient: this.serializePatient(this.getPatientRow())
    });
  }

  async handlePatient() {
    const patient = this.ensurePatientExists();

    return Response.json({
      ok: true,
      patient: this.serializePatient(patient)
    });
  }

  async handleAccess(request) {
    this.ensurePatientExists();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const role = body.role || "unauthorized";
    const actor = body.actor || "unknown";

    let allowed = false;

    if (role === "patient" || role === "authorized_provider") {
      allowed = true;
    }

    if (!allowed) {
      this.sql.exec(
        `UPDATE patient SET failed_attempts = failed_attempts + 1 WHERE id = ?`,
        "demo"
      );

      const updated = this.getPatientRow();

      if (Number(updated.failed_attempts) >= 3) {
        this.sql.exec(
          `UPDATE patient SET misuse_flag = 1 WHERE id = ?`,
          "demo"
        );

        this.log("misuse_flagged", "system");
      }

      this.log("access_denied", actor);

      return Response.json({
        ok: true,
        allowed: false,
        patient: this.serializePatient(this.getPatientRow())
      });
    }

    this.sql.exec(
      `UPDATE patient SET failed_attempts = 0 WHERE id = ?`,
      "demo"
    );

    this.log("access_granted", actor);

    return Response.json({
      ok: true,
      allowed: true,
      patient: this.serializePatient(this.getPatientRow())
    });
  }

  async handleBreakGlass(request) {
    this.ensurePatientExists();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const reason = (body.reason || "").trim();

    if (!reason) {
      return Response.json({
        ok: false,
        error: "Reason required"
      }, { status: 400 });
    }

    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    this.sql.exec(
      `UPDATE patient SET emergency_access_until = ? WHERE id = ?`,
      expires,
      "demo"
    );

    this.log("break_glass", "emergency");

    return Response.json({
      ok: true,
      expires,
      patient: this.serializePatient(this.getPatientRow())
    });
  }

  async handleAudit() {
    const rows = [...this.sql.exec(`SELECT * FROM audit ORDER BY id DESC LIMIT 50`)];

    return Response.json({
      ok: true,
      audit: rows.map(r => ({
        id: r.id,
        type: r.type,
        actor: r.actor,
        details: (() => {
          try {
            return r.details_json ? JSON.parse(r.details_json) : {};
          } catch {
            return {};
          }
        })(),
        timestamp: r.timestamp
      }))
    });
  }
}

function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html;charset=utf-8" }
  });
}
