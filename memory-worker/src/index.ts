export interface Env {
  DB: D1Database;
}

type SessionPayload = {
  sessionId?: string;
  userId?: string;
  title?: string;
};

type MemoryWritePayload = {
  sessionId?: string;
  userInput?: string;
  normalizedInput?: string;
  verifiedResponse?: string;
  mode?: string;
  score?: number;
  confidence?: number;
  tone?: string;
  reasoning?: string;
};

type ProfileFactPayload = {
  sessionId?: string;
  facts?: Array<{
    key?: string;
    value?: string;
    confidence?: number;
    source?: string;
  }>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type",
    },
  });
}

function now(): number {
  return Date.now();
}

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function upsertSession(env: Env, payload: SessionPayload): Promise<{ sessionId: string }> {
  const sessionId = payload.sessionId?.trim() || randomId("session");
  const timestamp = now();

  await env.DB.prepare(
    `
      INSERT INTO sessions (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = COALESCE(excluded.user_id, sessions.user_id),
        title = COALESCE(excluded.title, sessions.title),
        updated_at = excluded.updated_at
    `,
  )
    .bind(
      sessionId,
      payload.userId?.trim() || null,
      payload.title?.trim() || null,
      timestamp,
      timestamp,
    )
    .run();

  return { sessionId };
}

async function writeMemory(env: Env, payload: MemoryWritePayload): Promise<Response> {
  const sessionId = payload.sessionId?.trim();
  const userInput = payload.userInput?.trim();
  const verifiedResponse = payload.verifiedResponse?.trim();

  if (!sessionId || !userInput || !verifiedResponse) {
    return json(
      { error: "sessionId, userInput, and verifiedResponse are required" },
      400,
    );
  }

  await upsertSession(env, { sessionId });

  const itemId = randomId("memory");
  const timestamp = now();

  await env.DB.prepare(
    `
      INSERT INTO memory_items (
        id,
        session_id,
        user_input,
        normalized_input,
        verified_response,
        mode,
        score,
        confidence,
        tone,
        reasoning,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      itemId,
      sessionId,
      userInput,
      payload.normalizedInput?.trim() || null,
      verifiedResponse,
      payload.mode?.trim() || null,
      typeof payload.score === "number" ? Math.round(payload.score) : null,
      typeof payload.confidence === "number" ? Math.round(payload.confidence) : null,
      payload.tone?.trim() || null,
      payload.reasoning?.trim() || null,
      timestamp,
    )
    .run();

  await env.DB.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
    .bind(timestamp, sessionId)
    .run();

  return json({ ok: true, id: itemId, sessionId });
}

async function upsertProfileFacts(env: Env, payload: ProfileFactPayload): Promise<Response> {
  const sessionId = payload.sessionId?.trim();
  const facts = Array.isArray(payload.facts) ? payload.facts : [];

  if (!sessionId) {
    return json({ error: "sessionId is required" }, 400);
  }

  await upsertSession(env, { sessionId });

  const timestamp = now();
  let written = 0;

  for (const fact of facts) {
    const factKey = String(fact.key || "").trim().toLowerCase();
    const factValue = String(fact.value || "").trim();

    if (!factKey || !factValue) {
      continue;
    }

    await env.DB.prepare(
      `
        INSERT INTO profile_facts (
          id,
          session_id,
          fact_key,
          fact_value,
          confidence,
          source,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, fact_key) DO UPDATE SET
          fact_value = excluded.fact_value,
          confidence = excluded.confidence,
          source = excluded.source,
          updated_at = excluded.updated_at
      `,
    )
      .bind(
        randomId("fact"),
        sessionId,
        factKey,
        factValue,
        typeof fact.confidence === "number" ? Math.round(fact.confidence) : null,
        String(fact.source || "").trim() || null,
        timestamp,
        timestamp,
      )
      .run();

    written += 1;
  }

  return json({ ok: true, sessionId, written });
}

async function getProfileFacts(env: Env, sessionId: string): Promise<Response> {
  const result = await env.DB.prepare(
    `
      SELECT
        fact_key,
        fact_value,
        confidence,
        source,
        updated_at
      FROM profile_facts
      WHERE session_id = ?
      ORDER BY updated_at DESC
    `,
  )
    .bind(sessionId)
    .all();

  return json({
    sessionId,
    facts: result.results ?? [],
  });
}

async function listSessionHistory(env: Env, sessionId: string): Promise<Response> {
  const result = await env.DB.prepare(
    `
      SELECT
        id,
        user_input,
        normalized_input,
        verified_response,
        mode,
        score,
        confidence,
        tone,
        reasoning,
        created_at
      FROM memory_items
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `,
  )
    .bind(sessionId)
    .all();

  return json({
    sessionId,
    items: result.results ?? [],
  });
}

async function searchMemory(env: Env, request: Request): Promise<Response> {
  const body = (await request.json()) as { sessionId?: string; query?: string };
  const sessionId = body.sessionId?.trim();
  const query = body.query?.trim();

  if (!sessionId || !query) {
    return json({ error: "sessionId and query are required" }, 400);
  }

  const likeQuery = `%${query}%`;
  const result = await env.DB.prepare(
    `
      SELECT
        id,
        user_input,
        verified_response,
        mode,
        score,
        confidence,
        tone,
        reasoning,
        created_at
      FROM memory_items
      WHERE session_id = ?
        AND (
          user_input LIKE ?
          OR normalized_input LIKE ?
          OR verified_response LIKE ?
          OR reasoning LIKE ?
        )
      ORDER BY created_at DESC
      LIMIT 10
    `,
  )
    .bind(sessionId, likeQuery, likeQuery, likeQuery, likeQuery)
    .all();

  return json({
    sessionId,
    query,
    items: result.results ?? [],
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "verexa-memory-worker" });
    }

    if (request.method === "POST" && url.pathname === "/sessions") {
      const body = (await request.json()) as SessionPayload;
      const result = await upsertSession(env, body);
      return json(result);
    }

    if (request.method === "POST" && url.pathname === "/memory/write") {
      const body = (await request.json()) as MemoryWritePayload;
      return writeMemory(env, body);
    }

    if (request.method === "POST" && url.pathname === "/memory/search") {
      return searchMemory(env, request);
    }

    if (request.method === "POST" && url.pathname === "/profile/upsert") {
      const body = (await request.json()) as ProfileFactPayload;
      return upsertProfileFacts(env, body);
    }

    const profileMatch = url.pathname.match(/^\/sessions\/([^/]+)\/profile$/);
    if (request.method === "GET" && profileMatch) {
      return getProfileFacts(env, profileMatch[1]);
    }

    const historyMatch = url.pathname.match(/^\/sessions\/([^/]+)\/history$/);
    if (request.method === "GET" && historyMatch) {
      return listSessionHistory(env, historyMatch[1]);
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
