"""
Generate Module
---------------
Responsible for creating a first-pass rewritten response.
"""

import re
from typing import Any

try:
    from backend.pipeline.utils import call_model, normalize_output_text, parse_json_response
except ImportError:
    from pipeline.utils import call_model, normalize_output_text, parse_json_response


def _normalize_mode(value: Any) -> str:
    mode = str(value).strip().lower()
    allowed = {"auto", "email", "proposal", "reply", "explain", "coding", "brainstorm"}
    return mode if mode in allowed else "auto"


def _normalize_intent(value: Any, mode: str) -> str:
    intent = str(value or "").strip().lower()
    if intent in {"freelance", "email", "strategy"}:
        return intent

    normalized_mode = _normalize_mode(mode)
    if normalized_mode == "proposal":
        return "freelance"
    if normalized_mode == "brainstorm":
        return "strategy"
    return "email"


def _normalize_tone(value: Any) -> str:
    tone = str(value or "").strip().lower()
    allowed = {"professional", "friendly", "assertive"}
    return tone if tone in allowed else "professional"


def _normalize_text(value: Any, fallback: str) -> str:
    text = str(value).strip()
    return normalize_output_text(text or fallback)


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", str(text or "")))


def _looks_like_generic_assistant_reply(text: str) -> bool:
    normalized = str(text or "").strip().lower()
    generic_patterns = [
        "how can i help you today",
        "how can i help",
        "i'm here to help",
        "let me know how i can assist",
    ]
    return any(pattern in normalized for pattern in generic_patterns)


def _is_short_social_message(text: str) -> bool:
    normalized = str(text or "").strip().lower()
    if _word_count(normalized) > 7:
        return False

    markers = ["yo", "hey", "hi", "hello", "sup", "what's up", "whats up"]
    return any(marker in normalized for marker in markers)


def _rewrite_short_social_message(text: str, mode: str, intent: str) -> str:
    normalized = str(text or "").strip().lower()
    resolved_mode = _normalize_mode(mode)
    resolved_intent = _normalize_intent(intent, resolved_mode)

    if resolved_intent == "freelance":
        return "Hi, I hope you're doing well. I'd be glad to help with your project and share a clear plan."
    if resolved_intent == "strategy":
        return "Hello, I hope you're doing well. I'd like to share a structured approach for this idea."
    if resolved_intent == "email":
        return "Hi, I hope you're doing well."

    if resolved_mode == "proposal":
        return "Hello, I hope you're doing well. I would be glad to discuss your project requirements."
    if resolved_mode == "email":
        return "Hi, I hope you're doing well."
    if resolved_mode == "reply":
        return "Hi, I hope you're doing well."
    if resolved_mode in {"coding", "explain"}:
        return "Hello, I can help with this. Please share more context so I can provide a precise response."
    if resolved_mode == "brainstorm":
        return "Hello, I hope you're doing well. I'd like to explore this idea with you."

    if "yo" in normalized and ("whats up" in normalized or "what's up" in normalized or "sup" in normalized):
        return "Hi, I hope you're doing well."
    if "whats up" in normalized or "what's up" in normalized or "sup" in normalized:
        return "Hi, I hope you're doing well."
    if "yo" in normalized:
        return "Hi."

    cleaned = str(text or "").strip()
    if not cleaned:
        return "Hi."

    cleaned = cleaned[0].upper() + cleaned[1:] if len(cleaned) > 1 else cleaned.upper()
    if cleaned[-1] not in ".!?":
        cleaned += "."
    return cleaned


def _enforce_context_quality(input_text: str, generated_text: str, mode: str, intent: str, tone: str) -> str:
    candidate = _normalize_text(generated_text, input_text)

    # Strip generic AI filler and enforce direct real-world phrasing.
    replacement_rules = [
        (r"\bI\s+am\s+confident\s+I\s+can\s+deliver\b", "I can deliver"),
        (r"\bI\s+would\s+be\s+happy\s+to\b", "I can"),
        (r"\bI\s+would\s+love\s+to\b", "I can"),
        (r"\bI\s+am\s+pleased\s+to\b", "I can"),
        (r"\bI\s+believe\s+I\s+can\b", "I can"),
        (r"\bI\s+look\s+forward\s+to\s+the\s+opportunity\s+to\b", "I can"),
    ]
    for pattern, replacement in replacement_rules:
        candidate = re.sub(pattern, replacement, candidate, flags=re.IGNORECASE)

    candidate = re.sub(r"\s+", " ", candidate).strip()

    cta_map = {
        "freelance": [
            "If you'd like, I can start right away.",
            "If you'd like, share the details and I can get started.",
            "Happy to jump on a quick call to discuss.",
            "Can you share more details so I can get started?",
        ],
        "email": [
            "Let me know if you'd like me to send the next version.",
            "If you'd like, I can send a revised draft.",
            "Please let me know how you'd like to proceed.",
        ],
        "strategy": [
            "If you'd like, I can map out the next step.",
            "Happy to turn this into a concrete plan if helpful.",
            "Share any extra context and I can sharpen the recommendation.",
        ],
    }

    def _has_cta(text: str) -> bool:
        lowered = text.lower()
        return any(
            phrase in lowered
            for phrase in [
                "let me know",
                "if you'd like",
                "if you’d like",
                "happy to",
                "share the details",
                "can you share",
                "please let me know",
                "i can get started",
                "jump on a quick call",
                "map out the next step",
            ]
        )

    def _strip_weak_closure(text: str) -> str:
        text = re.sub(r"\b(best regards|kind regards|regards|thanks|thank you)[,!.\s]*$", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\b(i\'m|i am) available if you need anything\b.*$", "", text, flags=re.IGNORECASE)
        return text.strip(" -\n\t")

    if not _has_cta(candidate):
        base = _strip_weak_closure(candidate)
        resolved_intent = _normalize_intent(intent, mode)
        cta_options = cta_map.get(resolved_intent, cta_map["email"])

        if base:
            joiner = " " if not base.endswith(('.', '!', '?')) else " "
            candidate = f"{base}{joiner}{cta_options[0]}"
        else:
            candidate = cta_options[0]

    # Prevent assistant-help template replies for casual message rewrites.
    if _looks_like_generic_assistant_reply(candidate) and _is_short_social_message(input_text):
        return _rewrite_short_social_message(input_text, mode, intent)

    # Apply light tone shaping as a final pass.
    resolved_tone = _normalize_tone(tone)
    if resolved_tone == "assertive":
        candidate = re.sub(r"\b(might|maybe|perhaps|could)\b", "can", candidate, flags=re.IGNORECASE)
        candidate = re.sub(r"\bI\s+think\b", "I recommend", candidate, flags=re.IGNORECASE)
    elif resolved_tone == "friendly":
        if candidate and not any(greeting in candidate.lower() for greeting in ["hi", "hello", "hey"]):
            candidate = f"Hi, {candidate[0].lower() + candidate[1:] if len(candidate) > 1 else candidate}"

    return candidate


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


def _build_generator_prompt(
    text: str,
    mode: str,
    feedback: list[str] | None,
    intent: str,
    tone: str,
    style_preferences: dict[str, str] | None = None,
    project_context: str = "",
    refine_instruction: str = "",
    previous_output: str = "",
) -> str:
    mode_instruction = get_mode_instruction(mode)
    feedback_text = ""
    resolved_tone = _normalize_tone(tone)

    intent_constraints = {
        "freelance": "Write as client-facing communication. Be value-driven, specific, concise, and outcome-focused like a top freelancer.",
        "email": "Write as structured formal email communication. Keep tone professional, concise, and clearly organized.",
        "strategy": "Write as analytical and critical strategic communication. Include reasoning, trade-offs, and practical direction.",
    }
    tone_constraints = {
        "professional": "Use composed, concise business language.",
        "friendly": "Use warm, collaborative language while staying professional.",
        "assertive": "Use direct, decisive language with clear recommendations and next steps.",
    }
    context_constraint = intent_constraints.get(intent, intent_constraints["email"])
    tone_constraint = tone_constraints.get(resolved_tone, tone_constraints["professional"])
    style_preferences = style_preferences or {}
    style_writing = str(style_preferences.get("writing_style", "concise")).strip().lower()
    style_industry = str(style_preferences.get("industry", "freelance")).strip().lower()

    writing_constraint = (
        "Keep it concise and compact."
        if style_writing != "detailed"
        else "Use richer detail with rationale and context when useful."
    )
    industry_constraints = {
        "freelance": "Use practical client-delivery language focused on outcomes and next steps.",
        "dev": "Use precise technical language with implementation clarity.",
        "design": "Use UX and design language focused on user impact and rationale.",
    }
    industry_constraint = industry_constraints.get(style_industry, industry_constraints["freelance"])
    project_context_block = ""
    if str(project_context or "").strip():
        project_context_block = f"""

Project context supplied by user:
{project_context.strip()}

Use this context as hard background when shaping scope, pricing language, trade-offs, and CTA.
If user context includes client type, project scope, or budget, reflect it naturally in the final message.
""".strip()

    if feedback:
        feedback_lines = "\n".join(f"- {item}" for item in feedback if str(item).strip())
        if feedback_lines:
            feedback_text = f"""
Previous reviewer feedback:
{feedback_lines}

Fix these issues in your rewrite.
""".strip()

    refine_block = ""
    if refine_instruction.strip() and previous_output.strip():
        refine_block = f"""

Refinement request:
- Previous output to refine:
{previous_output}

- User instruction:
{refine_instruction}

Apply the instruction directly while preserving the core intent and context.
""".strip()

    return f"""
You are a professional business communication editor.

Your task:
Transform the user's draft into a context-aware, purpose-driven message that is ready to send.

Context:
- Mode: {mode}
- Selected Context: {intent}
- Selected Tone: {resolved_tone}
- Style Memory Writing Style: {style_writing}
- Style Memory Industry: {style_industry}
- Instruction: {mode_instruction}
- Audience: client or professional

Rules:
- Preserve the user's intent, but upgrade clarity, tone, and structure
- If input contains slang or casual phrasing, convert it to professional language suitable for the selected mode
- Strictly follow selected context: {context_constraint}
- Strictly follow selected tone: {tone_constraint}
- Strictly follow style writing preference: {writing_constraint}
- Strictly follow style industry preference: {industry_constraint}
- Keep the message human and specific, not robotic or generic
- Use short direct sentences over polite filler
- Avoid generic phrases such as "I am confident", "I would be happy", "I would love to", and vague promises
- Prefer concrete delivery language (timelines, actions, outcomes) whenever possible
- End with a natural call-to-action that matches the selected context
- Avoid weak closings like "Best regards" unless they are paired with a real next step
- Do not output assistant-support templates (for example: "How can I help you today?") unless the input explicitly asks for support
- In email/proposal/reply modes, output message text the user can send directly
- In auto mode, infer likely business context and produce a practical professional version
- Do not talk about prompts, rewriting, or critique
- Do not explain your process
- Return ONLY the final user-facing message

Example:
- Input: "yo whats up"
- Good output: "Hi, I hope you're doing well."
- Bad output: "Hey there! How can I help you today?"

Freelance style example:
- Weak: "I am confident I can deliver this quickly."
- Strong: "I can deliver this within 2 business days."

CTA example:
- Weak: "Best regards,"
- Strong: "I can deliver this within 2 business days. If you'd like, I can start right away."

{feedback_text}

{project_context_block}

{refine_block}

User Input:
{text}
""".strip()


def _build_variations_prompt(
    input_text: str,
    improved_text: str,
    mode: str,
    intent: str,
) -> str:
    return f"""
You are an expert communication optimizer.

Create exactly 3 high-quality alternative versions of the improved message.

Context:
- Mode: {mode}
- Intent: {intent}

Source input:
{input_text}

Current improved version:
{improved_text}

Return STRICT JSON as an array with exactly 3 objects in this order:
[
  {{"label": "Direct & concise", "text": "..."}},
  {{"label": "Friendly & conversational", "text": "..."}},
  {{"label": "Premium & polished", "text": "..."}}
]

Rules:
- Keep each version ready to send
- Keep each version aligned to the original intent
- Make each version meaningfully different in tone and style
- Keep them practical and human, not generic assistant text
- Do not include markdown
- Return ONLY JSON
""".strip()


def _fallback_variations(base_text: str) -> list[dict[str, str]]:
    base = _normalize_text(base_text, "")
    if not base:
        base = "I can help with this. Let me know if you'd like me to proceed."

    direct = re.sub(r"\s+", " ", base).strip()
    friendly = direct if direct.lower().startswith(("hi", "hello", "hey")) else f"Hi, {direct[0].lower() + direct[1:] if len(direct) > 1 else direct}"
    premium = f"Thank you for the opportunity. {direct}"

    return [
        {"label": "Direct & concise", "text": direct},
        {"label": "Friendly & conversational", "text": friendly},
        {"label": "Premium & polished", "text": premium},
    ]


def generate_variations(
    input_text: str,
    improved_text: str,
    mode: str,
    intent: str,
) -> list[dict[str, str]]:
    try:
        raw = call_model(_build_variations_prompt(input_text, improved_text, mode, intent), max_tokens=700)
        parsed = parse_json_response(raw)
    except Exception:
        return _fallback_variations(improved_text)

    if not isinstance(parsed, list):
        return _fallback_variations(improved_text)

    normalized: list[dict[str, str]] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        label = _normalize_text(item.get("label"), "")
        text = _normalize_text(item.get("text"), "")
        if not label or not text:
            continue
        normalized.append({"label": label, "text": text})

    if len(normalized) < 2:
        return _fallback_variations(improved_text)

    # Keep exactly 3 in the intended order labels when possible.
    target_labels = ["Direct & concise", "Friendly & conversational", "Premium & polished"]
    by_label = {item["label"].lower(): item for item in normalized}
    ordered: list[dict[str, str]] = []
    for target in target_labels:
        match = by_label.get(target.lower())
        if match:
            ordered.append({"label": target, "text": match["text"]})

    # Fill missing slots from remaining generated entries.
    if len(ordered) < 3:
        used_texts = {item["text"] for item in ordered}
        for item in normalized:
            if item["text"] in used_texts:
                continue
            ordered.append(item)
            used_texts.add(item["text"])
            if len(ordered) >= 3:
                break

    if len(ordered) < 3:
        fallback = _fallback_variations(improved_text)
        for item in fallback:
            if len(ordered) >= 3:
                break
            ordered.append(item)

    return ordered[:3]


def generate_response(
    input_text: str,
    mode: str = "auto",
    feedback: list[str] | None = None,
    intent: str | None = None,
    tone: str = "professional",
    style_preferences: dict[str, str] | None = None,
    project_context: str = "",
    refine_instruction: str = "",
    previous_output: str = "",
) -> dict[str, Any]:
    resolved_mode = _normalize_mode(mode)
    resolved_intent = _normalize_intent(intent, resolved_mode)
    resolved_tone = _normalize_tone(tone)
    normalized_input = " ".join(input_text.split())

    try:
        response = call_model(
            _build_generator_prompt(
                input_text,
                resolved_mode,
                feedback,
                resolved_intent,
                resolved_tone,
                style_preferences=style_preferences,
                project_context=project_context,
                refine_instruction=refine_instruction,
                previous_output=previous_output,
            )
        )
    except Exception:
        response = input_text

    rewritten_message = _enforce_context_quality(
        input_text,
        response,
        resolved_mode,
        resolved_intent,
        resolved_tone,
    )

    return {
        "raw_input": input_text,
        "normalized_input": normalized_input or input_text,
        "mode": resolved_mode,
        "intent": resolved_intent,
        "tone": resolved_tone,
        "style_preferences": style_preferences or {},
        "project_context": project_context.strip(),
        "generated_response": rewritten_message,
    }
