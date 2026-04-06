import { NextResponse } from "next/server";

const productionApiBaseUrl = "https://verexa-ai.onrender.com";
const API_TIMEOUT_MS = 25000;

function isLocalOnlyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  } catch {
    return false;
  }
}

function getBackendBaseUrl(): string {
  const configured =
    process.env.API_BASE_URL?.trim().replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (configured) {
    if (process.env.NODE_ENV === "production" && isLocalOnlyUrl(configured)) {
      return productionApiBaseUrl;
    }
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8000";
  }

  return productionApiBaseUrl;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBackendBaseUrl()}/verexa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { detail: "Backend request timed out" },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        detail:
          "Backend unavailable. Ensure backend is running and API_BASE_URL/NEXT_PUBLIC_API_BASE_URL is correct.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}