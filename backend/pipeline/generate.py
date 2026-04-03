"""
Generate Module
---------------
Responsible for creating candidate AI outputs.
"""

from typing import Any

from pipeline.utils import call_model, parse_json_response


def _normalize_score(score: Any) -> float:
    try:
        numeric_score = float(score)
    except (TypeError, ValueError):
        numeric_score = 0.0

    return min(max(numeric_score, 0), 10)


def _normalize_confidence(confidence: Any) -> float:
    try:
        numeric_confidence = float(confidence)
    except (TypeError, ValueError):
        numeric_confidence = 0.0

    return min(max(numeric_confidence, 0), 1)


def _normalize_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    return [str(item).strip() for item in value if str(item).strip()]


def _normalize_tone(value: Any) -> str:
    tone = str(value).strip().lower()
    allowed = {"formal", "informal", "neutral"}
    return tone if tone in allowed else "neutral"


def _normalize_mode(value: Any) -> str:
    mode = str(value).strip().lower()
    allowed = {"auto", "email", "explain", "coding", "brainstorm"}
    return mode if mode in allowed else "auto"


def _normalize_outputs(value: Any, fallback: str) -> dict[str, str]:
    default_outputs = {
        "professional": fallback,
        "casual": fallback,
        "short": fallback,
        "persuasive": fallback,
    }

    if not isinstance(value, dict):
        return default_outputs

    normalized: dict[str, str] = {}
    for key in default_outputs:
        candidate = str(value.get(key, "")).strip()
        normalized[key] = candidate if candidate else fallback

    return normalized


def _validate_payload(payload: dict[str, Any], input_text: str, mode: str) -> dict[str, Any]:
    raw_input = str(payload.get("raw_input", "")).strip()
    normalized_input = str(payload.get("normalized_input", "")).strip()
    verified_response = str(payload.get("verified_response", "")).strip()

    if not verified_response:
        raise ValueError("Model failed to return valid JSON")

    return {
        "raw_input": raw_input or input_text,
        "normalized_input": normalized_input or input_text,
        "mode": _normalize_mode(payload.get("mode", mode)),
        "verified_response": verified_response,
        "outputs": _normalize_outputs(payload.get("outputs"), verified_response),
        "score": _normalize_score(payload.get("score", 0)),
        "confidence": _normalize_confidence(payload.get("confidence", 0)),
        "tone": _normalize_tone(payload.get("tone", "neutral")),
        "issues_found": _normalize_string_list(payload.get("issues_found")),
        "improvements_made": _normalize_string_list(payload.get("improvements_made"))
    }


def generate_response(input_text: str, mode: str = "auto", feedback: list[str] | None = None) -> dict[str, Any]:
    feedback_text = ""

    if feedback:
        feedback_text = f"""
Previous issues:
{feedback}

Fix these in the new output.
""".strip()

    prompt = f"""
You are Verexa AI.

Mode: {mode}

{feedback_text}

Generate 4 outputs:
- professional
- casual
- short
- persuasive

Each must be clearly different.

Return JSON:
{{
  "raw_input": "{input_text}",
  "normalized_input": "clean version of the input",
  "mode": "{mode}",
  "verified_response": "best default output",
  "outputs": {{
    "professional": "...",
    "casual": "...",
    "short": "...",
    "persuasive": "..."
  }},
  "score": number (0-10),
  "confidence": number (0-1),
  "tone": "formal/informal/neutral",
  "issues_found": [],
  "improvements_made": []
}}
""".strip()

    try:
        response = call_model(prompt)
        parsed = parse_json_response(response)
        return _validate_payload(parsed, input_text, mode)
    except Exception as exc:
        return {"error": str(exc)}
