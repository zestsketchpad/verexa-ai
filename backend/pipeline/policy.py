from __future__ import annotations

import re
from typing import Any


def _normalize_text(value: Any) -> str:
    return str(value or "").strip()


def _has_any(text: str, patterns: list[str]) -> bool:
    normalized = text.lower()
    return any(pattern in normalized for pattern in patterns)


def _rule(rule_name: str, passed: bool, reason: str = "") -> dict[str, str]:
    return {
        "rule_name": rule_name,
        "status": "pass" if passed else "fail",
        "reason": "" if passed else reason,
    }


def _split_sentences(text: str) -> list[str]:
    segments = [segment.strip() for segment in re.split(r"(?<=[.!?])\s+", text) if segment.strip()]
    return segments or [text.strip()]


def _has_value_framing(text: str) -> bool:
    value_terms = [
        "value",
        "save",
        "improve",
        "faster",
        "clear",
        "reduce",
        "increase",
        "deliver",
        "help",
        "results",
        "outcome",
        "benefit",
        "impact",
    ]
    return _has_any(text, value_terms)


def _has_clear_cta(text: str) -> bool:
    cta_terms = [
        "let me know",
        "if you'd like",
        "if you’d like",
        "happy to",
        "share more details",
        "can you share",
        "can i",
        "please let me know",
        "i can get started",
        "jump on a quick call",
        "send over",
        "next step",
    ]
    return _has_any(text, cta_terms)


def evaluate_policy(input_text: str, generated_text: str, mode: str = "auto", intent: str | None = None) -> dict[str, Any]:
    del input_text, mode, intent

    text = _normalize_text(generated_text)
    lowered = text.lower()
    sentences = _split_sentences(text)
    first_sentence = sentences[0].lower() if sentences else lowered

    vague_patterns = [
        "great results",
        "excellent results",
        "best possible",
        "high quality",
        "world-class",
        "top-notch",
        "strong results",
        "powerful solution",
        "can help",
        "ready to help",
        "deliver value",
    ]
    overpromise_patterns = [
        "guaranteed",
        "100%",
        "no risk",
        "can't fail",
        "definitely will",
        "always works",
        "will definitely",
        "promise",
    ]
    generic_ai_patterns = [
        "how can i help you today",
        "how can i help",
        "i'm here to help",
        "let me know how i can assist",
        "i am confident",
        "i would be happy",
        "i would love to",
        "pleased to",
    ]
    pricing_terms = ["price", "pricing", "cost", "rate", "$", "usd", "quote", "budget"]
    value_terms = ["value", "benefit", "save", "reduce", "improve", "outcome", "deliver", "impact"]

    failed_rules: list[dict[str, str]] = []

    vague_found = _has_any(lowered, vague_patterns)
    if vague_found and not any(char.isdigit() for char in text):
        failed_rules.append(
            _rule(
                "No vague claims",
                False,
                "Claims are too broad; add concrete specifics, outcomes, or details.",
            )
        )
    else:
        failed_rules.append(_rule("No vague claims", True))

    overpromise_found = _has_any(lowered, overpromise_patterns)
    if overpromise_found:
        failed_rules.append(
            _rule(
                "No overpromising",
                False,
                "Avoid unrealistic guarantees or absolute outcomes.",
            )
        )
    else:
        failed_rules.append(_rule("No overpromising", True))

    cta_found = _has_clear_cta(lowered)
    if not cta_found:
        failed_rules.append(
            _rule(
                "Must include clear CTA",
                False,
                "End with a direct next step or invitation to continue.",
            )
        )
    else:
        failed_rules.append(_rule("Must include clear CTA", True))

    pricing_index = -1
    for token in pricing_terms:
        idx = lowered.find(token)
        if idx != -1 and (pricing_index == -1 or idx < pricing_index):
            pricing_index = idx

    value_index = -1
    for token in value_terms:
        idx = lowered.find(token)
        if idx != -1 and (value_index == -1 or idx < value_index):
            value_index = idx

    if pricing_index != -1 and (value_index == -1 or pricing_index < value_index or first_sentence.find("$") != -1):
        failed_rules.append(
            _rule(
                "Must lead with value before pricing",
                False,
                "Lead with value, outcome, or benefits before introducing pricing.",
            )
        )
    else:
        failed_rules.append(_rule("Must lead with value before pricing", True))

    generic_found = _has_any(lowered, generic_ai_patterns)
    if generic_found:
        failed_rules.append(
            _rule(
                "No generic AI phrases",
                False,
                "Remove assistant-style filler and write like a real sender.",
            )
        )
    else:
        failed_rules.append(_rule("No generic AI phrases", True))

    failed_rules_only = [rule for rule in failed_rules if rule["status"] == "fail"]
    overall_status = "pass" if not failed_rules_only else "fail"

    return {
        "overall_status": overall_status,
        "rules": failed_rules,
        "failed_rules": failed_rules_only,
        "failed_count": len(failed_rules_only),
    }