"""
Generate Module
---------------
Responsible for creating a first-pass rewritten response.
"""

from typing import Any

try:
    from backend.pipeline.utils import call_model
except ImportError:
    from pipeline.utils import call_model


def _normalize_mode(value: Any) -> str:
    mode = str(value).strip().lower()
    allowed = {"auto", "email", "proposal", "reply", "explain", "coding", "brainstorm"}
    return mode if mode in allowed else "auto"


def _normalize_text(value: Any, fallback: str) -> str:
    text = str(value).strip()
    return text or fallback


def get_mode_instruction(mode: str) -> str:
    normalized_mode = _normalize_mode(mode)

    if normalized_mode == "email":
        return "Write a professional email."
    if normalized_mode == "proposal":
        return "Write a persuasive client proposal."
    if normalized_mode == "reply":
        return "Write a clear and polite reply."
    if normalized_mode == "coding":
        return "Rewrite the input as a clear, professional technical explanation or coding response."
    if normalized_mode == "brainstorm":
        return "Rewrite the input as a polished idea exploration for a professional audience."
    if normalized_mode == "explain":
        return "Answer the user's request with a clear professional explanation."

    return "Understand the user's intent and produce the best direct response."


def _build_generator_prompt(text: str, mode: str, feedback: list[str] | None) -> str:
    mode_instruction = get_mode_instruction(mode)
    feedback_text = ""

    if feedback:
        feedback_lines = "\n".join(f"- {item}" for item in feedback if str(item).strip())
        if feedback_lines:
            feedback_text = f"""
Previous reviewer feedback:
{feedback_lines}

Fix these issues in your rewrite.
""".strip()

    return f"""
You are a professional communication assistant.

Your task:
Understand the user's intent and produce a clear, polished, professional response for the user.

Context:
- Mode: {mode}
- Instruction: {mode_instruction}
- Audience: client or professional

Rules:
- In auto mode, infer the user's goal and answer it directly
- If the user asks a question, answer the question
- If the user asks for writing help, rewrite it cleanly
- Keep the response useful, direct, and natural
- Do not talk about prompts, rewriting, or critique
- Do not explain your process
- Return ONLY the final user-facing message

{feedback_text}

User Input:
{text}
""".strip()


def generate_response(input_text: str, mode: str = "auto", feedback: list[str] | None = None) -> dict[str, Any]:
    resolved_mode = _normalize_mode(mode)
    normalized_input = " ".join(input_text.split())

    try:
        response = call_model(_build_generator_prompt(input_text, resolved_mode, feedback))
    except Exception as exc:
        return {"error": str(exc)}

    rewritten_message = _normalize_text(response, input_text)

    return {
        "raw_input": input_text,
        "normalized_input": normalized_input or input_text,
        "mode": resolved_mode,
        "generated_response": rewritten_message,
    }
