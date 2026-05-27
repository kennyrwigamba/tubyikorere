const base = "http://localhost:3001";

async function jsonRequest(path: string, init?: RequestInit) {
  const res = await fetch(`${base}${path}`, init);
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // keep raw text
  }
  return { status: res.status, body: parsed };
}

async function run() {
  console.log("TEST1 POST /api/auth/login");
  const login = await jsonRequest("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cell_name: "Kimironko Cell", pin: "1234" }),
  });
  console.log(JSON.stringify(login));

  if (typeof login.body !== "object" || login.body === null || !("cell_id" in login.body)) {
    throw new Error("Login failed in test setup");
  }
  const cellId = String((login.body as { cell_id: string }).cell_id);

  console.log("TEST2 GET /api/issues");
  const list = await jsonRequest(`/api/issues?cell_id=${cellId}`, {
    headers: { "x-cell-id": cellId },
  });
  console.log(JSON.stringify(list));

  console.log("TEST3 POST /api/issues");
  const createdIssue = await jsonRequest("/api/issues", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      raw_text:
        "Mu mudugudu wa Nyarutarama hari umwobo munini mu muhanda utuma abantu bagwa nijoro.",
      cell_id: cellId,
      submission_channel: "web",
    }),
  });
  console.log(JSON.stringify(createdIssue));

  console.log("TEST4 POST /api/umuganda");
  const createdSession = await jsonRequest("/api/umuganda", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cell-id": cellId,
    },
    body: JSON.stringify({
      cell_id: cellId,
      session_date: "2026-05-30",
      expected_participants: 120,
    }),
  });
  console.log(JSON.stringify(createdSession));

  if (
    typeof createdSession.body !== "object" ||
    createdSession.body === null ||
    !("id" in createdSession.body)
  ) {
    throw new Error("Session creation failed in test setup");
  }
  const sessionId = String((createdSession.body as { id: string }).id);

  console.log("TEST5 POST /api/umuganda/:id/plan");
  const plan = await jsonRequest(`/api/umuganda/${sessionId}/plan`, {
    method: "POST",
    headers: { "x-cell-id": cellId },
  });
  console.log(JSON.stringify(plan));

  console.log("TEST6 GET /health");
  const health = await jsonRequest("/health");
  console.log(JSON.stringify(health));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
