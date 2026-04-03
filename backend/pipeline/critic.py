import json
from typing import Any

try:
    from backend.pipeline.utils import call_model, parse_json_response
except ImportError:
    from pipeline.utils import call_model, parse_json_response


def _normalize_score(score: Any) -> float:
    try:
        numeric_score = float(score)
    except (TypeError, ValueError):
        numeric_score = 4.0

    return min(max(numeric_score, 0), 10)


def _normalize_issues(value: Any) -> list[str]:
    if not isinstance(value, list):
        return ["Invalid issues returned by critic"]

    return [str(item).strip() for item in value if str(item).strip()]


def _normalize_decision(value: Any) -> str:
    decision = str(value).strip().upper()
    return decision if decision in {"ACCEPT", "REGENERATE"} else "REGENERATE"


def critique_response(input_text: str, outputs: dict[str, str], mode: str = "explain") -> dict:
    prompt = f"""
You are Verexa AI Critic.

Your job is to STRICTLY evaluate AI outputs.

INPUT:
{input_text}

MODE:
{mode}

OUTPUTS:
{json.dumps(outputs, indent=2)}

---

Evaluate:
- clarity
- usefulness
- correctness
- tone match with mode
- difference between styles

---

SCORING RULES:
- 9-10 -> excellent, clear, useful
- 7-8 -> good but minor issues
- 5-6 -> average, missing depth
- below 5 -> bad, vague, generic

---

RETURN JSON ONLY:

{{
  "score": number (0-10),
  "issues": [
    "issue 1",
    "issue 2"
  ],
  "decision": "ACCEPT" or "REGENERATE"
}}

---

STRICT RULES:
- If outputs are similar -> REGENERATE
- If output is generic -> REGENERATE
- If missing detail -> REGENERATE
- If styles not clearly different -> REGENERATE
""".strip()

    try:
        response = call_model(prompt)
        parsed = parse_json_response(response)
    except Exception:
        return {
            "score": 4,
            "issues": ["Invalid JSON from critic"],
            "decision": "REGENERATE"
        }

    return {
        "score": _normalize_score(parsed.get("score", 4)),
        "issues": _normalize_issues(parsed.get("issues", ["Critic returned no issues"])),
        "decision": _normalize_decision(parsed.get("decision", "REGENERATE"))
    }
