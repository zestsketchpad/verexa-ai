import type { ActionResult } from '../types';

export interface WebhookResult {
  ok: boolean;
  status: number;
  error?: string;
}

export async function postActionWebhook(params: {
  webhookUrl: string;
  event: 'chat_input' | 'execute_action' | 'fix_action' | 'reject_action';
  input: string;
  action?: ActionResult | null;
}): Promise<WebhookResult> {
  const { webhookUrl, event, input, action } = params;

  if (!webhookUrl) {
    return {
      ok: false,
      status: 0,
      error: 'Webhook URL is empty.',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        input,
        action,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Webhook returned ${response.status}`,
      };
    }

    return {
      ok: true,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown webhook error',
    };
  }
}
