interface Env {
  OPENAI_API_KEY?: string;
  N8N_WEBHOOK_URL?: string;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });
}

async function callOpenAI(prompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: prompt,
      temperature: 0.2,
    }),
  });

  const body = await response.json<{
    output_text?: string;
  }>();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: body,
    };
  }

  return {
    ok: true,
    status: response.status,
    output: body.output_text || '',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return jsonResponse({ ok: true });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return jsonResponse({
        ok: true,
        message: 'Worker API running',
        keyExists: Boolean(env.OPENAI_API_KEY),
      });
    }

    if (url.pathname === '/api/openai' && request.method === 'POST') {
      if (!env.OPENAI_API_KEY) {
        return jsonResponse(
          {
            ok: false,
            error: 'OPENAI_API_KEY is not set in Worker secrets.',
          },
          500,
        );
      }

      const body = (await request.json().catch(() => ({}))) as { prompt?: string };
      const prompt = body.prompt?.trim();
      if (!prompt) {
        return jsonResponse(
          {
            ok: false,
            error: 'prompt is required',
          },
          400,
        );
      }

      const result = await callOpenAI(prompt, env.OPENAI_API_KEY);
      return jsonResponse(result, result.ok ? 200 : 502);
    }

    if (url.pathname === '/api/execute' && request.method === 'POST') {
      if (!env.N8N_WEBHOOK_URL) {
        return jsonResponse(
          {
            ok: false,
            error: 'N8N_WEBHOOK_URL is not set in Worker secrets.',
          },
          500,
        );
      }

      const payload = await request.json().catch(() => ({}));
      const upstream = await fetch(env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!upstream.ok) {
        return jsonResponse(
          {
            ok: false,
            status: upstream.status,
            error: 'n8n webhook returned non-200 response.',
          },
          502,
        );
      }

      return jsonResponse({ ok: true, status: upstream.status });
    }

    return jsonResponse(
      {
        ok: false,
        error: 'Not found',
      },
      404,
    );
  },
};
