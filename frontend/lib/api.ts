export type GenerateResponse = {
  raw_input?: string;
  normalized_input?: string;
  mode?: string;
  verified_response?: string;
  outputs?: {
    professional?: string;
    casual?: string;
    short?: string;
    persuasive?: string;
  };
  score?: number;
  confidence?: number;
  tone?: string;
  issues_found?: string[];
  improvements_made?: string[];
  error?: string;
};

export async function generateResponse(input: string, mode: string): Promise<GenerateResponse> {
  const res = await fetch("http://localhost:8000/verexa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, mode }),
  });

  const text = await res.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
        ? payload.detail
        : text || "API request failed";
    throw new Error(message);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid API response");
  }

  return payload as GenerateResponse;
}
