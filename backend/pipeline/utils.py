import json
import os
import re

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "openai/gpt-oss-20b")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", 800))


def extract_json_object(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(r"```(?:json)?", "", text)
        text = text.replace("```", "").strip()

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)

    return text


def call_model(prompt: str, max_tokens: int | None = None) -> str:
    if not API_KEY:
        raise ValueError("Missing GROQ_API_KEY")

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": MODEL_NAME,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens or MAX_TOKENS
        },
        timeout=10
    )

    data = response.json()
    print("[MODEL RAW]:", data)

    if "choices" not in data:
        raise ValueError(f"API ERROR: {data}")

    return extract_json_object(data["choices"][0]["message"]["content"])


def parse_json_response(raw_text: str) -> dict:
    raw_text = raw_text[:4000]

    if not raw_text.strip().endswith("}"):
      raise ValueError("Incomplete JSON response")

    try:
        return json.loads(raw_text)
    except Exception as exc:
        raise ValueError("Invalid JSON from model") from exc
