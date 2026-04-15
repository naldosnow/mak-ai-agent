export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const patientObjectId = url.searchParams.get("id") || "demo-patient-v4";

    const id = env.PATIENT_AGENT.idFromName(patientObjectId);
    const stub = env.PATIENT_AGENT.get(id);

    if (url.pathname === "/") {
      return html(`
        <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>MAK Beta V4</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 1000px;
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
              .muted {
                color: #555;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>MAK Beta V4</h1>
              <p>Governed access, provider allowlist, break-glass, appointments, reminders, and notification hooks.</p>
              <p class="muted">Use <code>?id=...</code> to isolate patient objects. Default: <code>demo-patient-v4</code></p>
            </div>

            <div class="card">
              <h2>System</h2>
              <label>Patient/Object ID</label>
              <input id="objectId" value="demo-patient-v4" />
              <button onclick="goHome()">Reload with current object id</button>
              <button onclick="callRoute('/api/init', 'POST')">POST /api/init</button>
              <button onclick="callRoute('/api/patient', 'GET')">GET /api/patient</button>
              <button onclick="callRoute('/api/audit', 'GET')">GET /api/audit</button>
            </div>

            <div class="card">
              <h2>Providers</h2>
              <input id="providerId" value="dr-demo-001" />
              <select id="providerRole">
                <option value="authorized_provider">authorized_provider</option>
                <option value="admin_auditor">admin_auditor</option>
              </select>
              <button onclick="postAddProvider()">POST /api/providers/add</button>
              <button onclick="callRoute('/api/providers/list', 'GET')">GET /api/providers/list</button>
            </div>

            <div class="card">
              <h2>Access Test</h2>
              <select id="role">
                <option value="authorized_provider">authorized_provider</option>
                <option value="patient">patient</option>
                <option value="unauthorized">unauthorized</option>
                <option value="admin_auditor">admin_auditor</option>
              </select>
              <input id="actor" value="dr-demo-001" />
              <button onclick="postAccess()">POST /api/access</button>
              <button onclick="postView()">POST /api/view</button>
            </div>

            <div class="card">
              <h2>Break-Glass</h2>
              <input id="bgActor" value="emergency-room-1" />
              <textarea id="bgReason">Unresponsive patient during emergency intake.</textarea>
              <button onclick="postBreakGlass()">POST /api/break-glass</button>
            </div>

            <div class="card">
              <h2>Appointments</h2>
              <input id="apptTitle" value="Primary Care Follow-up" />
              <input id="apptWhen" value="2026-04-18T14:00:00.000Z" />
              <input id="apptLocation" value="Clinic A - Room 3" />
              <textarea id="apptNotes">Bring ID and medication list.</textarea>
              <button onclick="postAppointment()">POST /api/appointments</button>

              <input id="apptIdAction" placeholder="Paste appointment id here" />
              <button onclick="postConfirmAppointment()">POST /api/appointments/confirm</button>
              <button onclick="postCancelAppointment()">POST /api/appointments/cancel</button>
              <button onclick="postRescheduleAppointment()">POST /api/appointments/reschedule-request</button>
              <button onclick="callRoute('/api/reminders/preview', 'GET')">GET /api/reminders/preview</button>
              <button onclick="callRoute('/api/reminders/run-now', 'POST')">POST /api/reminders/run-now</button>
            </div>

            <pre id="out">Ready.</pre>

            <script>
              function getId() {
                return document.getElementById('objectId').value || 'demo-patient-v4';
              }

              function withId(path) {
                const id = encodeURIComponent(getId());
                const joiner = path.includes('?') ? '&' : '?';
                return path + joiner + 'id=' + id;
              }

              function goHome() {
                window.location.href = withId('/');
              }

              async function render(res) {
                const text = await res.text();
                document.getElementById('out').textContent = text;
              }

              async function callRoute(path, method) {
                const res = await fetch(withId(path), { method });
                await render(res);
              }

              async function postAccess() {
                const role = document.getElementById('role').value;
                const actor = document.getElementById('actor').value;

                const res = await fetch(withId('/api/access'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role, actor })
                });

                await render(res);
              }

              async function postView() {
                const role = document.getElementById('role').value;
                const actor = document.getElementById('actor').value;

                const res = await fetch(withId('/api/view'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role, actor })
                });

                await render(res);
              }

              async function postBreakGlass() {
                const actor = document.getElementById('bgActor').value;
                const reason = document.getElementById('bgReason').value;

                const res = await fetch(withId('/api/break-glass'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ actor, reason })
                });

                await render(res);
              }

              async function postAppointment() {
                const title = document.getElementById('apptTitle').value;
                const datetime = document.getElementById('apptWhen').value;
                const location = document.getElementById('apptLocation').value;
                const notes = document.getElementById('apptNotes').value;

                const res = await fetch(withId('/api/appointments'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title, datetime, location, notes })
                });

                await render(res);
              }

              async function postConfirmAppointment() {
                const appointmentId = document.getElementById('apptIdAction').value;

                const res = await fetch(withId('/api/appointments/confirm'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ appointmentId })
                });

                await render(res);
              }

              async function postCancelAppointment() {
                const appointmentId = document.getElementById('apptIdAction').value;

                const res = await fetch(withId('/api/appointments/cancel'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ appointmentId })
                });

                await render(res);
              }

              async function postRescheduleAppointment() {
                const appointmentId = document.getElementById('apptIdAction').value;

                const res = await fetch(withId('/api/appointments/reschedule-request'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ appointmentId })
                });

                await render(res);
              }

              async function postAddProvider() {
                const providerId = document.getElementById('providerId').value;
                const providerRole = document.getElementById('providerRole').value;

                const res = await fetch(withId('/api/providers/add'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ providerId, providerRole })
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

    if (url.pathname === "/api/providers/add" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/providers/add", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/providers/list" && request.method === "GET") {
      return stub.fetch("https://internal/providers/list");
    }

    if (url.pathname === "/api/access" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/access", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/view" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/view", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/break-glass" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/break-glass", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/appointments" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/appointments", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/appointments/confirm" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/appointments/confirm", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/appointments/cancel" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/appointments/cancel", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/appointments/reschedule-request" && request.method === "POST") {
      const body = await request.text();
      return stub.fetch("https://internal/appointments/reschedule-request", {
        method: "POST",
        headers: request.headers,
        body
      });
    }

    if (url.pathname === "/api/reminders/preview" && request.method === "GET") {
      return stub.fetch("https://internal/reminders/preview");
    }

    if (url.pathname === "/api/reminders/run-now" && request.method === "POST") {
      return stub.fetch("https://internal/reminders/run-now", { method: "POST" });
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

  now() {
    return new Date().toISOString();
  }

  async alarm() {
    await this.processDueReminders();
    await this.expireBreakGlassIfNeeded();
    await this.scheduleNextAlarm();
  }

  async scheduleNextAlarm() {
    const nextReminder = [
      ...this.sql.exec(
        `SELECT remind_at
         FROM reminders
         WHERE sent_at IS NULL
         ORDER BY remind_at ASC
         LIMIT 1`
      )
    ][0];

    const patient = this.getPatientRow();
    const nextBreakGlassExpiry =
      patient && patient.emergency_access_until
        ? new Date(String(patient.emergency_access_until)).getTime()
        : null;

    let nextTs = null;

    if (nextReminder && nextReminder.remind_at) {
      const reminderTs = new Date(String(nextReminder.remind_at)).getTime();
      if (!Number.isNaN(reminderTs)) nextTs = reminderTs;
    }

    if (nextBreakGlassExpiry && !Number.isNaN(nextBreakGlassExpiry)) {
      if (nextTs === null || nextBreakGlassExpiry < nextTs) {
        nextTs = nextBreakGlassExpiry;
      }
    }

    if (nextTs === null) {
      const existing = await this.ctx.storage.getAlarm();
      if (existing !== null) await this.ctx.storage.deleteAlarm();
      return;
    }

    await this.ctx.storage.setAlarm(nextTs);
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
      CREATE TABLE IF NOT EXISTS provider_allowlist (
        provider_id TEXT PRIMARY KEY,
        provider_role TEXT,
        created_at TEXT
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        title TEXT,
        datetime TEXT,
        location TEXT,
        notes TEXT,
        status TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        appointment_id TEXT,
        remind_at TEXT,
        sent_at TEXT,
        created_at TEXT
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

  listAppointments() {
    return [
      ...this.sql.exec(`SELECT * FROM appointments ORDER BY datetime ASC`)
    ].map((row) => ({
      id: row.id,
      title: row.title,
      datetime: row.datetime,
      location: row.location,
      notes: row.notes,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  listProviders() {
    return [
      ...this.sql.exec(
        `SELECT provider_id, provider_role, created_at
         FROM provider_allowlist
         ORDER BY provider_id ASC`
      )
    ].map((row) => ({
      provider_id: row.provider_id,
      provider_role: row.provider_role,
      created_at: row.created_at
    }));
  }

  listRecentAccess(limit = 20) {
    return [
      ...this.sql.exec(
        `SELECT id, type, actor, details_json, timestamp
         FROM audit
         WHERE type IN ('access_granted','access_denied','misuse_flagged','break_glass')
         ORDER BY id DESC
         LIMIT ?`,
        limit
      )
    ].map((row) => ({
      id: row.id,
      type: row.type,
      actor: row.actor,
      details: (() => {
        try {
          return row.details_json ? JSON.parse(row.details_json) : {};
        } catch {
          return {};
        }
      })(),
      timestamp: row.timestamp
    }));
  }

  ensurePatientExists() {
    const existing = this.getPatientRow();
    if (existing) return existing;

    const now = this.now();

    this.sql.exec(
      `INSERT INTO patient (
        id,
        name,
        emergency_access_until,
        failed_attempts,
        misuse_flag,
        init_locked,
        created_at,
        updated_at
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

  ensureSeedProviders() {
    const rows = [...this.sql.exec(`SELECT COUNT(*) AS c FROM provider_allowlist`)];
    const count = Number(rows[0]?.c ?? 0);

    if (count === 0) {
      const now = this.now();

      this.sql.exec(
        `INSERT OR REPLACE INTO provider_allowlist (provider_id, provider_role, created_at)
         VALUES (?, ?, ?)`,
        "dr-demo-001",
        "authorized_provider",
        now
      );

      this.sql.exec(
        `INSERT OR REPLACE INTO provider_allowlist (provider_id, provider_role, created_at)
         VALUES (?, ?, ?)`,
        "admin-demo-001",
        "admin_auditor",
        now
      );
    }
  }

  providerAllowed(providerId, providerRole) {
    const rows = [
      ...this.sql.exec(
        `SELECT provider_id, provider_role
         FROM provider_allowlist
         WHERE provider_id = ?`,
        providerId
      )
    ];

    if (!rows.length) return false;
    return String(rows[0].provider_role) === String(providerRole);
  }

  appointmentId() {
    return crypto.randomUUID();
  }

  reminderId() {
    return crypto.randomUUID();
  }

  getAppointment(appointmentId) {
    const rows = [
      ...this.sql.exec(`SELECT * FROM appointments WHERE id = ?`, appointmentId)
    ];
    return rows[0] || null;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      return this.handleInit();
    }

    if (url.pathname === "/patient" && request.method === "GET") {
      return this.handlePatient();
    }

    if (url.pathname === "/providers/add" && request.method === "POST") {
      return this.handleAddProvider(request);
    }

    if (url.pathname === "/providers/list" && request.method === "GET") {
      return this.handleListProviders();
    }

    if (url.pathname === "/access" && request.method === "POST") {
      return this.handleAccess(request);
    }

    if (url.pathname === "/view" && request.method === "POST") {
      return this.handleView(request);
    }

    if (url.pathname === "/break-glass" && request.method === "POST") {
      return this.handleBreakGlass(request);
    }

    if (url.pathname === "/appointments" && request.method === "POST") {
      return this.handleCreateAppointment(request);
    }

    if (url.pathname === "/appointments/confirm" && request.method === "POST") {
      return this.handleConfirmAppointment(request);
    }

    if (url.pathname === "/appointments/cancel" && request.method === "POST") {
      return this.handleCancelAppointment(request);
    }

    if (url.pathname === "/appointments/reschedule-request" && request.method === "POST") {
      return this.handleRescheduleRequest(request);
    }

    if (url.pathname === "/reminders/preview" && request.method === "GET") {
      return this.handleReminderPreview();
    }

    if (url.pathname === "/reminders/run-now" && request.method === "POST") {
      return this.handleRunRemindersNow();
    }

    if (url.pathname === "/audit" && request.method === "GET") {
      return this.handleAudit();
    }

    return new Response("DO route not found", { status: 404 });
  }

  async handleInit() {
    const patient = this.ensurePatientExists();
    this.ensureSeedProviders();

    if (Number(patient.init_locked) === 1) {
      return Response.json(
        {
          ok: false,
          error: "Initialization locked",
          message: "System has already been initialized for this object."
        },
        { status: 409 }
      );
    }

    const now = this.now();

    this.sql.exec(
      `UPDATE patient
       SET init_locked = 1,
           updated_at = ?
       WHERE id = ?`,
      now,
      "demo"
    );

    this.log("system_init", "system", {
      locked_after_init: true,
      seeded_default_providers: true
    });

    await this.scheduleNextAlarm();

    return Response.json({
      ok: true,
      patient: this.serializePatient(this.getPatientRow()),
      providers: this.listProviders()
    });
  }

  async handlePatient() {
    const patient = this.ensurePatientExists();

    return Response.json({
      ok: true,
      patient: this.serializePatient(patient),
      appointments: this.listAppointments(),
      recent_access: this.listRecentAccess(20),
      providers: this.listProviders()
    });
  }

  async handleAddProvider(request) {
    this.ensurePatientExists();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const providerId = (body.providerId || "").trim();
    const providerRole = (body.providerRole || "").trim();

    if (!providerId || !providerRole) {
      return Response.json(
        { ok: false, error: "providerId and providerRole required" },
        { status: 400 }
      );
    }

    this.sql.exec(
      `INSERT OR REPLACE INTO provider_allowlist (provider_id, provider_role, created_at)
       VALUES (?, ?, ?)`,
      providerId,
      providerRole,
      this.now()
    );

    this.log("provider_added", "system", {
      provider_id: providerId,
      provider_role: providerRole
    });

    return Response.json({
      ok: true,
      providers: this.listProviders()
    });
  }

  async handleListProviders() {
    return Response.json({
      ok: true,
      providers: this.listProviders()
    });
  }

  async handleAccess(request) {
    this.ensurePatientExists();
    this.ensureSeedProviders();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const role = body.role || "unauthorized";
    const actor = body.actor || "unknown";
    let allowed = false;
    let reason = "unauthorized_role";

    if (role === "patient") {
      allowed = true;
      reason = "patient_self_access";
    }

    if (role === "authorized_provider" && this.providerAllowed(actor, "authorized_provider")) {
      allowed = true;
      reason = "provider_allowlist_match";
    }

    if (role === "admin_auditor" && this.providerAllowed(actor, "admin_auditor")) {
      allowed = true;
      reason = "auditor_allowlist_match";
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

      if (Number(updated.failed_attempts) >= 3) {
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
          failed_attempts: Number(updated.failed_attempts)
        });
      }

      this.log("access_denied", actor, { role, reason });

      return Response.json({
        ok: true,
        allowed: false,
        role,
        actor,
        reason,
        patient: this.serializePatient(this.getPatientRow())
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

    this.log("access_granted", actor, { role, reason });

    return Response.json({
      ok: true,
      allowed: true,
      role,
      actor,
      reason,
      patient: this.serializePatient(this.getPatientRow())
    });
  }

  async handleView(request) {
    this.ensurePatientExists();
    this.ensureSeedProviders();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const role = body.role || "unauthorized";
    const actor = body.actor || "unknown";

    const patient = this.serializePatient(this.getPatientRow());
    const appointments = this.listAppointments();

    if (role === "patient") {
      return Response.json({
        ok: true,
        role,
        actor,
        visible: {
          patient,
          appointments,
          recent_access: this.listRecentAccess(20),
          accountability: {
            patient: "Can review access history and appointment state.",
            provider: "Access attempts are attributable.",
            system: "All exception flows are logged."
          }
        }
      });
    }

    if (role === "authorized_provider" && this.providerAllowed(actor, "authorized_provider")) {
      return Response.json({
        ok: true,
        role,
        actor,
        visible: {
          patient: {
            id: patient.id,
            name: patient.name,
            emergency_access_until: patient.emergency_access_until
          },
          appointments: appointments.map((a) => ({
            id: a.id,
            title: a.title,
            datetime: a.datetime,
            location: a.location,
            status: a.status
          })),
          note: "Authorized provider view is intentionally limited in this beta."
        }
      });
    }

    if (role === "admin_auditor" && this.providerAllowed(actor, "admin_auditor")) {
      return Response.json({
        ok: true,
        role,
        actor,
        visible: {
          patient: {
            id: patient.id,
            misuse_flag: patient.misuse_flag,
            failed_attempts: patient.failed_attempts
          },
          recent_access: this.listRecentAccess(50),
          note: "Audit view emphasizes governance and behavior tracking."
        }
      });
    }

    return Response.json({
      ok: false,
      role,
      actor,
      error: "No authorized view for this role"
    }, { status: 403 });
  }

  async handleBreakGlass(request) {
    this.ensurePatientExists();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const actor = body.actor || "unknown-emergency-actor";
    const reason = (body.reason || "").trim();

    if (!reason) {
      return Response.json({ ok: false, error: "Reason required" }, { status: 400 });
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

    this.log("break_glass", actor, { reason, expires });
    await this.scheduleNextAlarm();

    return Response.json({
      ok: true,
      actor,
      reason,
      expires,
      patient: this.serializePatient(this.getPatientRow())
    });
  }

  async handleCreateAppointment(request) {
    this.ensurePatientExists();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const title = (body.title || "").trim() || "Untitled Appointment";
    const datetime = (body.datetime || "").trim();
    const location = (body.location || "").trim();
    const notes = (body.notes || "").trim();

    if (!datetime) {
      return Response.json(
        { ok: false, error: "Appointment datetime required" },
        { status: 400 }
      );
    }

    const apptId = this.appointmentId();
    const now = this.now();

    this.sql.exec(
      `INSERT INTO appointments (
        id, title, datetime, location, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      apptId,
      title,
      datetime,
      location,
      notes,
      "scheduled",
      now,
      now
    );

    const apptMs = new Date(datetime).getTime();
    const reminderTargets = [
      apptMs - (24 * 60 * 60 * 1000),
      apptMs - (2 * 60 * 60 * 1000)
    ];

    for (const target of reminderTargets) {
      if (!Number.isNaN(target) && target > Date.now()) {
        this.sql.exec(
          `INSERT INTO reminders (
            id, appointment_id, remind_at, sent_at, created_at
          ) VALUES (?, ?, ?, ?, ?)`,
          this.reminderId(),
          apptId,
          new Date(target).toISOString(),
          null,
          now
        );
      }
    }

    await this.scheduleNextAlarm();

    this.log("appointment_created", "system", {
      appointment_id: apptId,
      title,
      datetime
    });

    return Response.json({
      ok: true,
      appointment: this.listAppointments().find((a) => a.id === apptId),
      reminders_preview: this.listReminderRows(apptId)
    });
  }

  listReminderRows(appointmentId = null) {
    if (appointmentId) {
      return [
        ...this.sql.exec(
          `SELECT id, appointment_id, remind_at, sent_at, created_at
           FROM reminders
           WHERE appointment_id = ?
           ORDER BY remind_at ASC`,
          appointmentId
        )
      ].map((row) => ({
        id: row.id,
        appointment_id: row.appointment_id,
        remind_at: row.remind_at,
        sent_at: row.sent_at,
        created_at: row.created_at
      }));
    }

    return [
      ...this.sql.exec(
        `SELECT id, appointment_id, remind_at, sent_at, created_at
         FROM reminders
         ORDER BY remind_at ASC`
      )
    ].map((row) => ({
      id: row.id,
      appointment_id: row.appointment_id,
      remind_at: row.remind_at,
      sent_at: row.sent_at,
      created_at: row.created_at
    }));
  }

  async handleConfirmAppointment(request) {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const appointmentId = body.appointmentId || "";
    const appt = this.getAppointment(appointmentId);

    if (!appt) {
      return Response.json({ ok: false, error: "Appointment not found" }, { status: 404 });
    }

    this.sql.exec(
      `UPDATE appointments
       SET status = ?, updated_at = ?
       WHERE id = ?`,
      "confirmed",
      this.now(),
      appointmentId
    );

    this.log("appointment_confirmed", "patient", { appointment_id: appointmentId });

    return Response.json({
      ok: true,
      appointment: this.getAppointment(appointmentId)
    });
  }

  async handleCancelAppointment(request) {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const appointmentId = body.appointmentId || "";
    const appt = this.getAppointment(appointmentId);

    if (!appt) {
      return Response.json({ ok: false, error: "Appointment not found" }, { status: 404 });
    }

    this.sql.exec(
      `UPDATE appointments
       SET status = ?, updated_at = ?
       WHERE id = ?`,
      "cancelled",
      this.now(),
      appointmentId
    );

    this.log("appointment_cancelled", "patient", { appointment_id: appointmentId });

    return Response.json({
      ok: true,
      appointment: this.getAppointment(appointmentId)
    });
  }

  async handleRescheduleRequest(request) {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const appointmentId = body.appointmentId || "";
    const appt = this.getAppointment(appointmentId);

    if (!appt) {
      return Response.json({ ok: false, error: "Appointment not found" }, { status: 404 });
    }

    this.sql.exec(
      `UPDATE appointments
       SET status = ?, updated_at = ?
       WHERE id = ?`,
      "reschedule_requested",
      this.now(),
      appointmentId
    );

    this.log("appointment_reschedule_requested", "patient", { appointment_id: appointmentId });

    return Response.json({
      ok: true,
      appointment: this.getAppointment(appointmentId)
    });
  }

  async handleReminderPreview() {
    return Response.json({
      ok: true,
      reminders: this.listReminderRows()
    });
  }

  async handleRunRemindersNow() {
    const processed = await this.processDueReminders();
    await this.expireBreakGlassIfNeeded();
    await this.scheduleNextAlarm();

    return Response.json({
      ok: true,
      processed
    });
  }

  async processDueReminders() {
    const dueRows = [
      ...this.sql.exec(
        `SELECT r.id, r.appointment_id, r.remind_at, r.sent_at, a.title, a.datetime, a.location, a.status
         FROM reminders r
         LEFT JOIN appointments a ON a.id = r.appointment_id
         WHERE r.sent_at IS NULL
           AND r.remind_at <= ?
         ORDER BY r.remind_at ASC`,
        this.now()
      )
    ];

    const processed = [];

    for (const row of dueRows) {
      const sentAt = this.now();

      this.sql.exec(
        `UPDATE reminders
         SET sent_at = ?
         WHERE id = ?`,
        sentAt,
        row.id
      );

      const payload = {
        reminder_id: row.id,
        appointment_id: row.appointment_id,
        remind_at: row.remind_at,
        sent_at: sentAt,
        title: row.title,
        datetime: row.datetime,
        location: row.location,
        status: row.status
      };

      let delivery = {
        mode: "local_log_only",
        delivered: false
      };

      if (this.env.NOTIFY_WEBHOOK_URL) {
        try {
          const res = await fetch(this.env.NOTIFY_WEBHOOK_URL, {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          delivery = {
            mode: "webhook",
            delivered: res.ok,
            status: res.status
          };
        } catch (e) {
          delivery = {
            mode: "webhook",
            delivered: false,
            error: String(e)
          };
        }
      }

      this.log("reminder_due", "system", {
        ...payload,
        delivery
      });

      processed.push({
        ...payload,
        delivery
      });
    }

    return processed;
  }

  async expireBreakGlassIfNeeded() {
    const patient = this.getPatientRow();
    if (!patient || !patient.emergency_access_until) return false;

    const expiryTs = new Date(String(patient.emergency_access_until)).getTime();
    if (Number.isNaN(expiryTs)) return false;
    if (expiryTs > Date.now()) return false;

    this.sql.exec(
      `UPDATE patient
       SET emergency_access_until = NULL,
           updated_at = ?
       WHERE id = ?`,
      this.now(),
      "demo"
    );

    this.log("break_glass_expired", "system", {});
    return true;
  }

  async handleAudit() {
    const rows = [
      ...this.sql.exec(`SELECT * FROM audit ORDER BY id DESC LIMIT 100`)
    ];

    return Response.json({
      ok: true,
      audit: rows.map((r) => ({
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
