"""
Outcome Simulation Module
-------------------------
Predicts likely recipient reaction and communication risks.
"""

import re
from typing import Any


def _find_price_early_risk(text: str) -> bool:
    normalized = str(text or "")
    lower = normalized.lower()
    price_match = re.search(r"(\$\s*\d+|\b(?:price|pricing|cost|rate|budget|fee)\b)", lower)
    if not price_match:
        return False

    value_match = re.search(r"\b(?:result|outcome|value|benefit|impact|solve|deliver)\b", lower)
    if value_match and value_match.start() < price_match.start():
        return False

    threshold = max(30, int(len(lower) * 0.4))
    return price_match.start() <= threshold


def _contains_any(text: str, tokens: list[str]) -> bool:
    lower = str(text or "").lower()
    return any(token in lower for token in tokens)


def _normalize_policy_fails(policy_report: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not isinstance(policy_report, dict):
        return []

    failed_rules = policy_report.get("failed_rules")
    if isinstance(failed_rules, list):
        return [rule for rule in failed_rules if isinstance(rule, dict)]

    rules = policy_report.get("rules")
    if not isinstance(rules, list):
        return []

    normalized: list[dict[str, Any]] = []
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        status = str(rule.get("status", "")).strip().lower()
        if status == "fail":
            normalized.append(rule)

    return normalized


def simulate_client_outcome(
    source_text: str,
    verified_response: str,
    decision: str,
    issues_found: list[str] | None,
    policy_report: dict[str, Any] | None,
    intent: str | None = None,
) -> dict[str, Any]:
    combined = f"{source_text}\n{verified_response}"
    issues = [str(item).strip() for item in (issues_found or []) if str(item).strip()]
    issues_blob = " ".join(issues).lower()
    policy_fails = _normalize_policy_fails(policy_report)
    response_text = str(verified_response or "").strip()

    risk_factors: list[str] = []

    if _find_price_early_risk(response_text):
        risk_factors.append("Price objection")

    if _contains_any(issues_blob, ["clarity", "confusing", "unclear", "structure", "wordy"]):
        risk_factors.append("Confusion risk")

    if _contains_any(combined, ["guaranteed", "100%", "no risk", "always works", "definitely"]):
        risk_factors.append("Credibility risk")

    if _contains_any(combined, ["urgent", "immediately", "right now", "last chance"]) and _contains_any(combined, ["price", "pricing", "cost", "rate", "$"]):
        risk_factors.append("Pressure-backfire risk")

    if not _contains_any(response_text, ["let me know", "if you'd like", "please let me know", "happy to", "can we", "share"]):
        risk_factors.append("No clear next-step")

    for rule in policy_fails:
        rule_name = str(rule.get("rule_name", "")).strip().lower()
        if "clear cta" in rule_name and "No clear next-step" not in risk_factors:
            risk_factors.append("No clear next-step")
        elif "vague" in rule_name and "Confusion risk" not in risk_factors:
            risk_factors.append("Confusion risk")
        elif "overprom" in rule_name and "Credibility risk" not in risk_factors:
            risk_factors.append("Credibility risk")

    seen = set()
    deduped_risks: list[str] = []
    for risk in risk_factors:
        key = risk.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped_risks.append(risk)

    resolved_decision = str(decision or "MODIFY").upper()
    if resolved_decision == "RISKY" or len(deduped_risks) >= 3:
        reaction = "negative"
    elif resolved_decision == "SAFE" and len(deduped_risks) == 0:
        reaction = "positive"
    else:
        reaction = "neutral"

    audience = "client" if str(intent or "").lower() == "freelance" else "recipient"
    top_risk = deduped_risks[0] if deduped_risks else "Low friction"

    if reaction == "positive":
        likely_reaction = f"{audience.capitalize()} is likely to respond positively because the message is clear and actionable."
    elif top_risk == "Price objection":
        likely_reaction = f"{audience.capitalize()} may hesitate due to pricing shown before value framing."
    elif top_risk == "Confusion risk":
        likely_reaction = f"{audience.capitalize()} may pause because the message flow can feel unclear."
    elif top_risk == "Credibility risk":
        likely_reaction = f"{audience.capitalize()} may question credibility due to absolute claims."
    elif top_risk == "No clear next-step":
        likely_reaction = f"{audience.capitalize()} may delay replying because there is no concrete next step."
    else:
        likely_reaction = f"{audience.capitalize()} reaction is mixed; there are signs of hesitation before commitment."

    if top_risk == "Price objection":
        suggestion = "Delay pricing until after value framing and expected outcomes."
    elif top_risk == "Confusion risk":
        suggestion = "Tighten structure into short blocks: value, proof, and next step."
    elif top_risk == "Credibility risk":
        suggestion = "Replace absolute promises with concrete evidence and realistic commitments."
    elif top_risk == "No clear next-step":
        suggestion = "End with one direct CTA and a specific action request."
    else:
        suggestion = "Keep the message concise and add one concrete next step."

    return {
        "reaction": reaction,
        "likely_reaction": likely_reaction,
        "risk_factors": deduped_risks,
        "suggested_adjustment": suggestion,
    }
