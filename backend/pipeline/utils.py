import json
import os
import re

import requests
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL_NAME = "openai/gpt-oss-20b"
DEFAULT_MAX_TOKENS = 800
DEFAULT_TIMEOUT_SECONDS = 30


def _is_truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "y", "on"}


def _env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return float(raw_value)
    except ValueError:
        return default


def extract_json_object(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        text = text.lstrip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

    start_index = text.find("{")
    if start_index == -1:
        return text

    depth = 0
    in_string = False
    escape = False

    for index in range(start_index, len(text)):
        char = text[index]

        if in_string:
            if escape:
                escape = False
                continue

            if char == "\\":
                escape = True
                continue

            if char == '"':
                in_string = False

            continue

        if char == '"':
            in_string = True
            continue

        if char == "{":
            depth += 1
            continue

        if char == "}":
            depth -= 1
            if depth == 0:
                return text[start_index : index + 1]

    return text


def extract_json_value(text: str) -> str:
    text = str(text or "").strip()
    if not text:
        return text

    object_candidate = extract_json_object(text)
    if object_candidate != text:
        return object_candidate

    start_index = text.find("[")
    if start_index == -1:
        return text

    depth = 0
    in_string = False
    escape = False

    for index in range(start_index, len(text)):
        char = text[index]

        if in_string:
            if escape:
                escape = False
                continue

            if char == "\\":
                escape = True
                continue

            if char == '"':
                in_string = False

            continue

        if char == '"':
            in_string = True
            continue

        if char == "[":
            depth += 1
            continue

        if char == "]":
            depth -= 1
            if depth == 0:
                return text[start_index : index + 1]

    return text


def _cleanup_json_text(text: str) -> str:
    cleaned = str(text or "").strip()
    if not cleaned:
        return cleaned

    cleaned = cleaned.replace("\u201c", '"').replace("\u201d", '"')
    cleaned = cleaned.replace("\u2018", "'").replace("\u2019", "'")

    # Handle common trailing-comma mistakes from model outputs.
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
    return cleaned


def normalize_output_text(text: str) -> str:
    normalized = str(text or "")
    if not normalized:
        return normalized

    # Try to recover common mojibake caused by UTF-8 bytes decoded as Latin-1/CP1252.
    suspicious_markers = ("â", "Ã", "â€™", "â€œ", "â€", "â€”", "â€“")
    if any(marker in normalized for marker in suspicious_markers):
        try:
            repaired = normalized.encode("latin-1").decode("utf-8")
            if repaired:
                normalized = repaired
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass

    # Final fallback replacements for known artifacts.
    replacements = {
        "â€™": "'",
        "â€˜": "'",
        "â€œ": '"',
        "â€\x9d": '"',
        "â€": '"',
        "â€”": "—",
        "â€“": "–",
        "Ã©": "é",
        "Ã¨": "è",
        "Ã¡": "á",
        "Ã³": "ó",
        "Ãº": "ú",
    }

    for broken, fixed in replacements.items():
        normalized = normalized.replace(broken, fixed)

    return normalized


def call_model(prompt: str, max_tokens: int | None = None) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("Missing GROQ_API_KEY")

    model_name = os.getenv("MODEL_NAME", DEFAULT_MODEL_NAME)
    resolved_max_tokens = max_tokens or _env_int("MAX_TOKENS", DEFAULT_MAX_TOKENS)
    timeout_seconds = _env_float("GROQ_TIMEOUT", DEFAULT_TIMEOUT_SECONDS)
    debug_model = _is_truthy(os.getenv("DEBUG_MODEL"))

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": resolved_max_tokens,
            },
            timeout=timeout_seconds,
        )
    except requests.RequestException as exc:
        raise ValueError(f"GROQ request failed: {exc}") from exc

    try:
        data = response.json()
    except ValueError as exc:
        snippet = (response.text or "").strip().replace("\n", " ")[:300]
        raise ValueError(
            f"GROQ returned non-JSON response (status {response.status_code}): {snippet}"
        ) from exc

    if debug_model:
        print("[MODEL RAW]:", data)

    if response.status_code >= 400:
        raise ValueError(f"GROQ API error (status {response.status_code}): {data}")

    if "choices" not in data:
        raise ValueError(f"API ERROR: {data}")

    try:
        content = data["choices"][0]["message"]["content"]
    except (TypeError, KeyError, IndexError) as exc:
        raise ValueError(f"Unexpected GROQ response format: {data}") from exc

    return str(content)


def parse_json_response(raw_text: str) -> dict:
    raw_text = extract_json_value(raw_text)

    try:
        return json.loads(raw_text)
    except Exception:
        cleaned_text = _cleanup_json_text(raw_text)
        try:
            return json.loads(cleaned_text)
        except Exception as exc:
            snippet = cleaned_text.replace("\n", " ")[:220]
            raise ValueError(f"Invalid JSON from model: {snippet}") from exc
