Use this folder to fix the n8n empty-response issue.

Files:
- `My workflow 3.fixed.json`: corrected flow export (branching and input validation fixed)

Why this is needed:
- Your current webhook responds with HTTP 200 but empty body.
- The frontend expects JSON for action rendering.

What was fixed in the exported workflow:
- Input validation now accepts both `prompt` and `message`.
- Defaults added for missing fields (`tool`, `userId`, `token`).
- Recipient email extracted from prompt if present.
- Branching corrected to avoid conflicting response paths:
  - `Merge & Decide` -> `IF Approve?`
  - `IF Approve?` false -> `IF Block?`
  - `IF Block?` false -> rewrite path

Import steps in n8n:
1. Import `My workflow 3.fixed.json`.
2. Reconnect credentials (OpenAI, Gemini, Gmail) if n8n asks.
3. Keep webhook path as `ai-action`.
4. Activate workflow.
5. Test with:
   - `prompt`
   - `tool`
   - `userId`
   - `token`
   - `recipientEmail` (required for `tool=email`)

Validate Input (Code node) reference:
```javascript
const body = $json.body || $json;
const prompt = body.prompt || body.message;
const tool = body.tool || (/email|mail|@/i.test(prompt || '') ? 'email' : 'research');
const userId = body.userId || 'anonymous';
const token = body.token || 'verixa-web';

const emailMatch = (prompt || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
const recipientEmail = body.recipientEmail || body.email || (emailMatch ? emailMatch[0] : null);

if (!prompt || !tool || !userId || !token) {
  throw new Error('Missing required fields: prompt, tool, userId, token');
}

if (tool === 'email' && !recipientEmail) {
  throw new Error('Missing recipientEmail for email tool');
}

return [{
  prompt,
  tool,
  userId,
  token,
  recipientEmail: recipientEmail || null,
  timestamp: new Date().toISOString(),
}];
```
