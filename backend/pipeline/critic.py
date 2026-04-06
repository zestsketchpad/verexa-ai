from typing import Any
import re

try:
    from backend.pipeline.utils import call_model, normalize_output_text, parse_json_response
except ImportError:
    from pipeline.utils import call_model, normalize_output_text, parse_json_response


def _normalize_percentage(value: Any) -> int:
    try:
        numeric_value = int(round(float(value)))
    except (TypeError, ValueError):
        numeric_value = 0

    return min(max(numeric_value, 0), 100)


def _normalize_tone(value: Any) -> str:
    tone = str(value).strip().lower()
    allowed = {"professional", "friendly", "assertive", "casual", "persuasive"}
    return tone if tone in allowed else "professional"


def _normalize_string_list(value: Any, fallback: list[str]) -> list[str]:
    if not isinstance(value, list):
        return fallback

    normalized = [normalize_output_text(str(item).strip()) for item in value if str(item).strip()]
    return normalized or fallback


def _normalize_text(value: Any, fallback: str) -> str:
    text = str(value).strip()
    return normalize_output_text(text or fallback)


def _build_fallback_insights(generated_text: str, issues_found: list[str]) -> list[str]:
    lower_text = str(generated_text or "").lower()
    insights: list[str] = []

    if not any(token in lower_text for token in ["next", "call", "meeting", "share", "confirm", "let me know"]):
        insights.append("No clear next step for the recipient.")

    if any(token in lower_text for token in ["price", "pricing", "$", "cost", "rate"]):
        insights.append("Pricing appears early; lead with value framing first.")

    if any(token in lower_text for token in ["confident", "happy to", "would love to", "pleased to"]):
        insights.append("Tone sounds generic; make it more specific and outcome-focused.")

    issues_blob = " ".join(issues_found).lower()
    if "tone" in issues_blob:
        insights.append("Message sounds transactional, not collaborative.")
    if "clarity" in issues_blob or "structure" in issues_blob:
        insights.append("Structure can be tighter for faster readability.")

    if not insights:
        insights.append("Value proposition is present but can be made sharper.")

    return insights[:3]


def _extract_fallback_text(raw_text: str, fallback: str) -> str:
    text = str(raw_text or "").strip()
    if not text:
        return fallback

    # Remove markdown fences if model wrapped output.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text).strip()

    # If a JSON-like block exists but failed to parse, try to pull verified_response manually.
    match = re.search(r'"verified_response"\s*:\s*"(.+?)"\s*(,|\n|})', text, flags=re.DOTALL)
    if match:
        extracted = match.group(1).encode("utf-8").decode("unicode_escape").strip()
        if extracted:
            return extracted

    # Fallback to raw text with braces stripped if it looks JSON-ish.
    cleaned = text.strip().strip("{}[]").strip()
    return cleaned or fallback


def _coerce_verifier_payload(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            reparsed = parse_json_response(stripped)
        except Exception:
            return None
        return _coerce_verifier_payload(reparsed)

    if isinstance(value, list):
        for item in value:
            payload = _coerce_verifier_payload(item)
            if payload is not None:
                return payload

    return None


def _pick_value(payload: dict[str, Any], keys: list[str], default: Any = None) -> Any:
    for key in keys:
        if key in payload:
            return payload[key]
    return default


def _build_verifier_prompt(text: str, mode: str, policy_summary: str = "") -> str:
    policy_text = ""
    if policy_summary:
        policy_text = f"""

Policy engine findings:
{policy_summary}

Use these findings to tighten the verified response and highlight the most important issues.
""".strip()

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
    "insight_lines": ["..."],
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

{policy_text}

Mode:
{mode}
""".strip()


def critique_response(
    input_text: str,
    generated_text: str,
    mode: str = "auto",
    policy_summary: str = "",
) -> dict[str, Any]:
    del input_text

    try:
        response = call_model(_build_verifier_prompt(generated_text, mode, policy_summary))
        parsed = parse_json_response(response)
        payload = _coerce_verifier_payload(parsed)
        if payload is None:
            raise ValueError("Verifier returned non-object JSON")
    except Exception:
        fallback_response = _extract_fallback_text(locals().get("response", ""), generated_text)
        fallback_issues: list[str] = []
        return {
            "verified_response": fallback_response,
            "score": 70,
            "confidence": 70,
            "tone": "professional",
            "issues_found": fallback_issues,
            "improvements_made": [],
            "insight_lines": _build_fallback_insights(fallback_response, fallback_issues),
            "reasoning": "Fallback verification applied.",
        }

    normalized_issues = _normalize_string_list(
        _pick_value(payload, ["issues_found", "issuesFound", "issues"], None),
        [],
    )
    normalized_improvements = _normalize_string_list(
        _pick_value(payload, ["improvements_made", "improvementsMade", "improvements"], None),
        [],
    )
    normalized_insights = _normalize_string_list(
        _pick_value(payload, ["insight_lines", "insightLines", "insights"], None),
        [],
    )
    if not normalized_insights:
        normalized_insights = _build_fallback_insights(generated_text, normalized_issues)

    return {
        "verified_response": _normalize_text(
            _pick_value(payload, ["verified_response", "verifiedResponse", "response"]),
            generated_text,
        ),
        "score": _normalize_percentage(_pick_value(payload, ["score", "rating"], 0)),
        "confidence": _normalize_percentage(_pick_value(payload, ["confidence", "certainty"], 0)),
        "tone": _normalize_tone(_pick_value(payload, ["tone", "style"], "professional")),
        "issues_found": normalized_issues,
        "improvements_made": normalized_improvements,
        "insight_lines": normalized_insights[:3],
        "reasoning": _normalize_text(
            _pick_value(payload, ["reasoning", "explanation", "notes"], None),
            "",
        ),
    }
