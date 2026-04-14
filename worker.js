export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        `
        <html>
          <head>
            <title>MAK Beta</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 720px;
                margin: 40px auto;
                padding: 20px;
                line-height: 1.5;
              }
              .card {
                border: 1px solid #ccc;
                border-radius: 12px;
                padding: 20px;
              }
              a {
                display: inline-block;
                margin-top: 12px;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>MAK Beta is Live</h1>
              <p>Worker is running correctly.</p>
              <p>Test Durable Object:</p>
              <a href="/api/ping">/api/ping</a>
            </div>
          </body>
        </html>
        `,
        {
          headers: { "content-type": "text/html; charset=utf-8" }
        }
      );
    }

    if (url.pathname === "/api/ping") {
      const id = env.PATIENT_AGENT.idFromName("demo-patient");
      const stub = env.PATIENT_AGENT.get(id);
      return stub.fetch("https://internal/ping");
    }

    return new Response("Not found", { status: 404 });
  }
};

export class PatientAgent {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.init();
  }

  init() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/ping") {
      const now = new Date().toISOString();

      this.sql.exec(
        `INSERT INTO audit_log (event_type, created_at) VALUES (?, ?)`,
        "ping",
        now
      );

      const rows = [
        ...this.sql.exec(
          `SELECT id, event_type, created_at
           FROM audit_log
           ORDER BY id DESC
           LIMIT 10`
        )
      ];

      return Response.json({
        ok: true,
        message: "PatientAgent active",
        timestamp: now,
        recent_events: rows
      });
    }

    return new Response("Durable Object route not found", { status: 404 });
  }
}
