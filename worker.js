export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Move from a single hardcoded object to a query-driven object identity.
    // Example:
    //   /api/patient?id=demo-patient-v3
    //   /api/patient?id=john-doe
    const patientObjectId = url.searchParams.get("id") || "demo-patient-v3";

    const id = env.PATIENT_AGENT.idFromName(patientObjectId);
    const stub = env.PATIENT_AGENT.get(id);

    if (url.pathname === "/") {
      return html(`
        <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>MAK Beta V3</title>
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
              <h1>MAK Beta V3</h1>
              <p>Governed access, break-glass, misuse flagging, appointments, reminders, and role-based visibility.</p>
              <p class="muted">Current object id comes from the URL query param <code>?id=...</code>. Default: <code>demo-patient-v3</code></p>
            </div>

            <div class="card">
              <h2>System</h2>
              <label>Patient/Object ID</label>
              <input id="objectId" value="demo-patient-v3" />
              <button onclick="goHome()">Reload with current object id</button>
              <button onclick="callRoute('/api/init', 'POST')">POST /api/init</button>
              <button onclick="callRoute('/api/patient', 'GET')">GET /api/patient</button>
              <button onclick="callRoute('/api/audit', 'GET')">GET /api/audit</button>
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
              <input id="apptWhen" value="2026-04-16T14:00:00.000Z" />
              <input id="apptLocation" value="Clinic A - Room 3" />
              <textarea id="apptNotes">Bring ID and medication list.</textarea>
              <button onclick="postAppointment()">POST /api/appointments</button>

              <input id="apptIdAction" placeholder="Paste appointment id here" />
              <button onclick="postConfirmAppointment()">POST /api/appointments/confirm</button>
              <button onclick="postCancelAppointment()">POST /api/appointments/cancel</button>
              <button onclick="postRescheduleAppointment()">POST /api/appointments/reschedule-request</button>
              <button onclick="callRoute('/api/reminders/preview', 'GET')">GET /api/reminders/preview</button>
            </div>

            <pre id="out">Ready.</pre>

            <script>
              function getId() {
                return document.getElementById('objectId').value || 'demo-patient-v3';
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

  // Cloudflare Durable Objects support Alarms, which are appropriate for
  // per-object future work like reminders and expiry tasks.
  async alarm() {
    const dueRows = [
      ...this.sql.exec(
        `SELECT id, appointment_id, remind_at, sent_at
         FROM reminders
         WHERE sent_at IS NULL
           AND remind_at <= ?
         ORDER BY remind_at ASC`,
        this.now()
      )
    ];

    for (const row of dueRows) {
      const sentAt = this.now();

      this.sql.exec(
        `UPDATE reminders
         SET sent_at = ?
         WHERE id = ?`,
        sentAt,
        row.id
      );

      this.log("reminder_due", "system", {
        reminder_id: row.id,
        appointment_id: row.appointment_id,
        remind_at: row.remind_at,
        sent_at: sentAt
      });
    }

    await this.scheduleNextAlarm();
  }

  async scheduleNextAlarm() {
    const nextRows = [
      ...this.sql.exec(
        `SELECT remind_at
         FROM reminders
         WHERE sent_at IS NULL
         ORDER BY remind_at ASC
         LIMIT 1`
      )
    ];

    if (!nextRows.length) {
      const current = await this.ctx.storage.getAlarm();
      if (current !== null) {
        await this.ctx.storage.deleteAlarm();
      }
      return;
    }

    const nextAt = new Date(String(nextRows[0].remind_at)).getTime();
    if (!Number.isNaN(nextAt)) {
      await this.ctx.storage.setAlarm(nextAt);
    }
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
      ...this.sql.exec(
        `SELECT * FROM appointments ORDER BY datetime ASC`
      )
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

  appointmentId() {
    return crypto.randomUUID();
  }

  reminderId() {
    return crypto.randomUUID();
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

    if (url.pathname === "/audit" && request.method === "GET") {
      return this.handleAudit();
    }

    return new Response("DO route not found", { status: 404 });
  }

  async handleInit() {
    const patient = this.ensurePatientExists();

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
      locked_after_init: true
    });

    return Response.json({
      ok: true,
      patient: this.serializePatient(this.getPatientRow())
    });
  }

  async handlePatient() {
    const patient = this.ensurePatientExists();

    return Response.json({
      ok: true,
      patient: this.serializePatient(patient),
      appointments: this.listAppointments(),
      recent_access: this.listRecentAccess(20)
    });
  }

  async handleAccess(request) {
    this.ensurePatientExists();

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const role = body.role || "unauthorized";
    const actor = body.actor || "unknown";
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

    if (role === "admin_auditor") {
      allowed = true;
      reason = "audit_oversight_access";
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

    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
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

    if (role === "authorized_provider") {
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

    if (role === "admin_auditor") {
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
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const actor = body.actor || "unknown-emergency-actor";
    const reason = (body.reason || "").trim();

    if (!reason) {
      return Response.json(
        { ok: false, error: "Reason required" },
        { status: 400 }
      );
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
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
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

    // Schedule one reminder 24 hours before if that time is still in the future.
    const apptMs = new Date(datetime).getTime();
    const reminderMs = apptMs - (24 * 60 * 60 * 1000);

    if (!Number.isNaN(apptMs) && reminderMs > Date.now()) {
      const reminderAt = new Date(reminderMs).toISOString();

      this.sql.exec(
        `INSERT INTO reminders (
          id, appointment_id, remind_at, sent_at, created_at
        ) VALUES (?, ?, ?, ?, ?)`,
        this.reminderId(),
        apptId,
        reminderAt,
        null,
        now
      );

      await this.scheduleNextAlarm();
    }

    this.log("appointment_created", "system", {
      appointment_id: apptId,
      title,
      datetime
    });

    return Response.json({
      ok: true,
      appointment: this.listAppointments().find((a) => a.id === apptId),
      reminders_preview: [
        ...this.sql.exec(
          `SELECT id, appointment_id, remind_at, sent_at
           FROM reminders
           WHERE appointment_id = ?
           ORDER BY remind_at ASC`,
          apptId
        )
      ]
    });
  }

  getAppointment(appointmentId) {
    const rows = [
      ...this.sql.exec(`SELECT * FROM appointments WHERE id = ?`, appointmentId)
    ];
    return rows[0] || null;
  }

  async handleConfirmAppointment(request) {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const appointmentId = body.appointmentId || "";
    const appt = this.getAppointment(appointmentId);

    if (!appt) {
      return Response.json(
        { ok: false, error: "Appointment not found" },
        { status: 404 }
      );
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
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const appointmentId = body.appointmentId || "";
    const appt = this.getAppointment(appointmentId);

    if (!appt) {
      return Response.json(
        { ok: false, error: "Appointment not found" },
        { status: 404 }
      );
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
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const appointmentId = body.appointmentId || "";
    const appt = this.getAppointment(appointmentId);

    if (!appt) {
      return Response.json(
        { ok: false, error: "Appointment not found" },
        { status: 404 }
      );
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
    const rows = [
      ...this.sql.exec(
        `SELECT r.id, r.appointment_id, r.remind_at, r.sent_at, a.title, a.datetime, a.location, a.status
         FROM reminders r
         LEFT JOIN appointments a ON a.id = r.appointment_id
         ORDER BY r.remind_at ASC`
      )
    ];

    return Response.json({
      ok: true,
      reminders: rows.map((row) => ({
        id: row.id,
        appointment_id: row.appointment_id,
        remind_at: row.remind_at,
        sent_at: row.sent_at,
        title: row.title,
        datetime: row.datetime,
        location: row.location,
        status: row.status
      }))
    });
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
