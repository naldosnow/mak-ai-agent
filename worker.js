export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const id = env.PATIENT_AGENT.idFromName("demo-patient");
    const stub = env.PATIENT_AGENT.get(id);

    // HOME
    if (url.pathname === "/") {
      return new Response("MAK Beta V1 LIVE");
    }

    // INIT SYSTEM
    if (url.pathname === "/api/init") {
      return stub.fetch("https://internal/init", { method: "POST" });
    }

    // GET PATIENT
    if (url.pathname === "/api/patient") {
      return stub.fetch("https://internal/patient");
    }

    // ACCESS CHECK
    if (url.pathname === "/api/access" && request.method === "POST") {
      return stub.fetch("https://internal/access", request);
    }

    // BREAK GLASS
    if (url.pathname === "/api/break-glass" && request.method === "POST") {
      return stub.fetch("https://internal/break-glass", request);
    }

    // AUDIT LOG
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
    this.init();
  }

  init() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS patient (
        id TEXT PRIMARY KEY,
        name TEXT,
        emergency_access_until TEXT,
        failed_attempts INTEGER DEFAULT 0
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        actor TEXT,
        timestamp TEXT
      )
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/init") {
      const now = new Date().toISOString();

      this.sql.exec(
        `INSERT OR REPLACE INTO patient (id, name) VALUES (?, ?)`,
        "demo",
        "Demo Patient"
      );

      this.log("system_init", "system");

      return Response.json({ ok: true, message: "System initialized" });
    }

    if (url.pathname === "/patient") {
      const row = [
        ...this.sql.exec(`SELECT * FROM patient WHERE id = ?`, "demo")
      ][0];

      return Response.json({ ok: true, patient: row });
    }

    if (url.pathname === "/access") {
      const body = await request.json();
      const { role, actor } = body;

      let allowed = false;

      if (role === "patient") allowed = true;
      if (role === "authorized_provider") allowed = true;

      if (!allowed) {
        this.incrementFail();
        this.log("access_denied", actor);
      } else {
        this.resetFail();
        this.log("access_granted", actor);
      }

      return Response.json({
        ok: true,
        role,
        actor,
        allowed
      });
    }

    if (url.pathname === "/break-glass") {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 60000).toISOString();

      this.sql.exec(
        `UPDATE patient SET emergency_access_until = ? WHERE id = ?`,
        expires,
        "demo"
      );

      this.log("break_glass", "emergency");

      return Response.json({
        ok: true,
        expires
      });
    }

    if (url.pathname === "/audit") {
      const rows = [
        ...this.sql.exec(`SELECT * FROM audit ORDER BY id DESC LIMIT 20`)
      ];

      return Response.json({ ok: true, audit: rows });
    }

    return new Response("DO route not found", { status: 404 });
  }

  log(type, actor) {
    this.sql.exec(
      `INSERT INTO audit (type, actor, timestamp) VALUES (?, ?, ?)`,
      type,
      actor,
      new Date().toISOString()
    );
  }

  incrementFail() {
    this.sql.exec(
      `UPDATE patient SET failed_attempts = failed_attempts + 1 WHERE id = ?`,
      "demo"
    );
  }

  resetFail() {
    this.sql.exec(
      `UPDATE patient SET failed_attempts = 0 WHERE id = ?`,
      "demo"
    );
  }
}
