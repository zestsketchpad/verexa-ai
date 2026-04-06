try:
    from backend.pipeline.critic import critique_response
    from backend.pipeline.generate import generate_response, generate_variations
    from backend.pipeline.policy import evaluate_policy
    from backend.pipeline.simulate import simulate_client_outcome
    from backend.pipeline.utils import normalize_output_text
except ImportError:
    from pipeline.critic import critique_response
    from pipeline.generate import generate_response, generate_variations
    from pipeline.policy import evaluate_policy
    from pipeline.simulate import simulate_client_outcome
    from pipeline.utils import normalize_output_text


def _contains_keywords(text: str, keywords: list[str]) -> bool:
    normalized = str(text or "").lower()
    return any(keyword in normalized for keyword in keywords)


def _classify_decision(score: int, issues_found: list[str], verified_response: str) -> str:
    risky_issue_keywords = [
        "misleading",
        "overpromise",
        "over-promis",
        "guarantee",
        "legal risk",
        "compliance",
        "unsafe",
        "vague commitment",
        "false claim",
    ]
    risky_response_keywords = [
        "guaranteed",
        "100%",
        "no risk",
        "can't fail",
        "definitely will",
        "always works",
        "as soon as possible",
    ]
    modify_issue_keywords = [
        "unclear tone",
        "tone",
        "weak structure",
        "structure",
        "clarity",
        "wordy",
        "awkward",
    ]

    issues_blob = "\n".join(str(item) for item in issues_found)

    if score < 55:
        return "RISKY"
    if _contains_keywords(issues_blob, risky_issue_keywords):
        return "RISKY"
    if _contains_keywords(verified_response, risky_response_keywords):
        return "RISKY"

    if score < 85:
        return "MODIFY"
    if issues_found:
        return "MODIFY"
    if _contains_keywords(issues_blob, modify_issue_keywords):
        return "MODIFY"

    return "SAFE"


def _policy_policy_summary(policy_report: dict[str, object]) -> str:
    rules = policy_report.get("rules") if isinstance(policy_report, dict) else []
    if not isinstance(rules, list):
        return ""

    lines: list[str] = []
    for rule in rules:
        if not isinstance(rule, dict):
            continue

        rule_name = str(rule.get("rule_name", "")).strip()
        status = str(rule.get("status", "")).strip().lower()
        reason = str(rule.get("reason", "")).strip()
        if not rule_name:
            continue

        if status == "pass":
            lines.append(f"- {rule_name}: pass")
        else:
            lines.append(f"- {rule_name}: fail - {reason or 'Policy violated.'}")

    return "\n".join(lines)


def _build_outputs(final_text: str) -> dict[str, str]:
    cleaned = normalize_output_text(final_text)
    return {
        "professional": cleaned,
        "casual": cleaned,
        "short": cleaned,
        "persuasive": cleaned,
    }


def verify_pipeline(
    input_text: str,
    mode: str = "auto",
    intent: str | None = None,
    tone: str = "professional",
    style_preferences: dict[str, str] | None = None,
    project_context: str = "",
    refine_instruction: str = "",
    previous_output: str = "",
) -> dict:
    max_attempts = 2
    feedback = None
    generated = {}
    critique = {
        "verified_response": input_text,
        "score": 70,
        "confidence": 70,
        "tone": "professional",
        "issues_found": [],
        "improvements_made": [],
        "insight_lines": [],
        "reasoning": "",
    }

    for attempt in range(max_attempts):
        generated = generate_response(
            input_text,
            mode,
            feedback,
            intent,
            tone,
            style_preferences=style_preferences,
            project_context=project_context,
            refine_instruction=refine_instruction,
            previous_output=previous_output,
        )

        candidate_response = generated.get("generated_response", "").strip()
        policy_report = evaluate_policy(input_text, candidate_response, generated.get("mode", mode), generated.get("intent", intent))
        policy_summary = _policy_policy_summary(policy_report)
        critique = critique_response(
            input_text,
            candidate_response,
            generated.get("mode", mode),
            policy_summary,
        )
        final_response = normalize_output_text(
            critique.get("verified_response", candidate_response).strip() or candidate_response
        )

        if critique.get("score", 0) >= 75 and policy_report.get("overall_status") == "pass":
            resolved_score = int(critique.get("score", 70) or 70)
            resolved_issues = critique.get("issues_found") or []
            decision = _classify_decision(resolved_score, resolved_issues, final_response)
            client_perspective = simulate_client_outcome(
                input_text,
                final_response,
                decision,
                resolved_issues,
                policy_report,
                generated.get("intent", intent),
            )
            variations = generate_variations(
                input_text,
                final_response,
                generated.get("mode", mode),
                generated.get("intent", intent),
            )
            return {
                "raw_input": generated.get("raw_input", input_text),
                "normalized_input": generated.get("normalized_input", input_text),
                "mode": generated.get("mode", mode),
                "intent": generated.get("intent", intent),
                "verified_response": final_response,
                "outputs": _build_outputs(final_response),
                "score": resolved_score,
                "confidence": critique.get("confidence", 70),
                "tone": critique.get("tone", tone),
                "style_preferences": generated.get("style_preferences", style_preferences or {}),
                "project_context": generated.get("project_context", project_context),
                "issues_found": resolved_issues,
                "improvements_made": critique.get("improvements_made") or [],
                "insight_lines": critique.get("insight_lines") or [],
                "variations": variations,
                "client_perspective": client_perspective,
                "policy_results": policy_report,
                "reasoning": critique.get("reasoning", ""),
                "decision": decision,
                "attempts": attempt + 1,
            }

        feedback = (critique.get("issues_found", []) or []) + [
            f"Policy fail: {rule.get('rule_name')} - {rule.get('reason')}"
            for rule in (policy_report.get("failed_rules") or [])
            if isinstance(rule, dict)
        ]

    final_response = normalize_output_text(
        critique.get("verified_response", generated.get("generated_response", "")).strip()
    )
    final_score = int(critique.get("score", 70) or 70)
    final_issues = critique.get("issues_found") or []
    final_policy_report = evaluate_policy(input_text, final_response, generated.get("mode", mode), generated.get("intent", intent))
    final_variations = generate_variations(
        input_text,
        final_response,
        generated.get("mode", mode),
        generated.get("intent", intent),
    )
    final_decision = _classify_decision(final_score, final_issues, final_response)
    if final_policy_report.get("overall_status") == "fail" and final_decision == "SAFE":
        final_decision = "MODIFY"
    final_client_perspective = simulate_client_outcome(
        input_text,
        final_response,
        final_decision,
        final_issues,
        final_policy_report,
        generated.get("intent", intent),
    )

    return {
        "raw_input": generated.get("raw_input", input_text),
        "normalized_input": generated.get("normalized_input", input_text),
        "mode": generated.get("mode", mode),
        "intent": generated.get("intent", intent),
        "verified_response": final_response,
        "outputs": _build_outputs(final_response),
        "score": final_score,
        "confidence": critique.get("confidence", 70),
        "tone": critique.get("tone", tone),
        "style_preferences": generated.get("style_preferences", style_preferences or {}),
        "project_context": generated.get("project_context", project_context),
        "issues_found": final_issues,
        "improvements_made": critique.get("improvements_made") or [],
        "insight_lines": critique.get("insight_lines") or [],
        "variations": final_variations,
        "client_perspective": final_client_perspective,
        "policy_results": final_policy_report,
        "reasoning": critique.get("reasoning", ""),
        "decision": final_decision,
        "attempts": max_attempts,
    }
