interface Env {
  ASSETS: Fetcher;
  N8N_WEBHOOK_URL?: string;
}

const DEFAULT_N8N_WEBHOOK = 'https://xlr8-n8n.app.n8n.cloud/webhook/ai-action';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function toJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function toCorsNoContent(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function parseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return toCorsNoContent();
      }

      if (url.pathname === '/api/health' && request.method === 'GET') {
        return toJson({
          ok: true,
          worker: 'verixa',
          n8nConfigured: Boolean(env.N8N_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK),
        });
      }

      if (url.pathname === '/api/action' && request.method === 'POST') {
        const webhookUrl = env.N8N_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK;
        const payload = await request.json().catch(() => null);
        if (!payload || typeof payload !== 'object') {
          return toJson({ success: false, message: 'Invalid JSON body.' }, 400);
        }

        const upstream = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const raw = await upstream.text();
        const parsed = parseJson(raw);

        if (!upstream.ok) {
          const parsedRecord =
            parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
          const message =
            (parsedRecord &&
              typeof parsedRecord.message === 'string' &&
              parsedRecord.message.trim()) ||
            (parsedRecord &&
              typeof parsedRecord.error === 'string' &&
              parsedRecord.error.trim()) ||
            `Webhook returned ${upstream.status}`;
          return toJson(
            {
              success: false,
              message,
              upstreamStatus: upstream.status,
            },
            502,
          );
        }

        if (!raw.trim()) {
          return toJson(
            {
              success: false,
              message:
                'Webhook returned empty response body. In n8n set response mode to Last Node or add Respond to Webhook node.',
            },
            502,
          );
        }

        if (parsed === null) {
          return toJson(
            {
              success: false,
              message: 'Webhook returned non-JSON response.',
              preview: raw.slice(0, 400),
            },
            502,
          );
        }

        return toJson(parsed, 200);
      }

      return toJson({ success: false, message: 'Not found' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

