from typing import Any

try:
    from backend.pipeline.utils import call_model, parse_json_response
except ImportError:
    from pipeline.utils import call_model, parse_json_response


def _normalize_percentage(value: Any) -> int:
    try:
        numeric_value = int(round(float(value)))
    except (TypeError, ValueError):
        numeric_value = 0

    return min(max(numeric_value, 0), 100)


def _normalize_tone(value: Any) -> str:
    tone = str(value).strip().lower()
    allowed = {"professional", "casual", "persuasive"}
    return tone if tone in allowed else "professional"


def _normalize_string_list(value: Any, fallback: list[str]) -> list[str]:
    if not isinstance(value, list):
        return fallback

    normalized = [str(item).strip() for item in value if str(item).strip()]
    return normalized or fallback


def _normalize_text(value: Any, fallback: str) -> str:
    text = str(value).strip()
    return text or fallback


def _build_verifier_prompt(text: str, mode: str) -> str:
    return f"""
You are an expert communication reviewer.

Your job:
1. Evaluate the response quality
2. Improve it further
3. Explain what was wrong

Return STRICT JSON:

{{
  "verified_response": "...",
  "score": 0-100,
  "confidence": 0-100,
  "tone": "professional / casual / persuasive",
  "issues_found": ["..."],
  "improvements_made": ["..."],
  "reasoning": "short explanation"
}}

Rules:
- Be strict but fair
- Focus on clarity, tone, and usefulness
- The verified_response must remain a direct user-facing answer
- Do not turn the answer into a critique, analysis, or commentary about the answer
- Do not mention "the response", "the assistant", "the user asked", or similar meta framing unless the mode explicitly requires critique
- If the draft answers a question, keep the verified_response as the improved answer to that question
- Do NOT include markdown
- Return ONLY JSON

Response to evaluate:
{text}

Mode:
{mode}
""".strip()


def critique_response(input_text: str, generated_text: str, mode: str = "auto") -> dict[str, Any]:
    del input_text

    try:
        response = call_model(_build_verifier_prompt(generated_text, mode))
        parsed = parse_json_response(response)
    except Exception as exc:
        return {
            "verified_response": generated_text,
            "score": 0,
            "confidence": 0,
            "tone": "professional",
            "issues_found": ["Verifier failed to return valid JSON"],
            "improvements_made": [],
            "reasoning": str(exc),
        }

    return {
        "verified_response": _normalize_text(parsed.get("verified_response"), generated_text),
        "score": _normalize_percentage(parsed.get("score", 0)),
        "confidence": _normalize_percentage(parsed.get("confidence", 0)),
        "tone": _normalize_tone(parsed.get("tone", "professional")),
        "issues_found": _normalize_string_list(
            parsed.get("issues_found"),
            ["Verifier did not provide specific issues"],
        ),
        "improvements_made": _normalize_string_list(
            parsed.get("improvements_made"),
            ["Verifier did not describe improvements"],
        ),
        "reasoning": _normalize_text(parsed.get("reasoning"), "Verifier did not explain the review."),
    }
