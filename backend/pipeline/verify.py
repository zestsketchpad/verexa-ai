try:
    from backend.pipeline.critic import critique_response
    from backend.pipeline.generate import generate_response
except ImportError:
    from pipeline.critic import critique_response
    from pipeline.generate import generate_response


def _build_outputs(final_text: str) -> dict[str, str]:
    return {
        "professional": final_text,
        "casual": final_text,
        "short": final_text,
        "persuasive": final_text,
    }


def verify_pipeline(input_text: str, mode: str = "auto") -> dict:
    max_attempts = 2
    feedback = None
    generated = {}
    critique = {
        "verified_response": "",
        "score": 0,
        "confidence": 0,
        "tone": "professional",
        "issues_found": ["Verifier was not run"],
        "improvements_made": [],
        "reasoning": "Verifier was not run.",
    }

    for attempt in range(max_attempts):
        generated = generate_response(input_text, mode, feedback)

        if "error" in generated:
            return {"error": generated["error"]}

        candidate_response = generated.get("generated_response", "").strip()
        critique = critique_response(input_text, candidate_response, generated.get("mode", mode))
        final_response = critique.get("verified_response", candidate_response).strip() or candidate_response

        if critique.get("score", 0) >= 75:
            return {
                "raw_input": generated.get("raw_input", input_text),
                "normalized_input": generated.get("normalized_input", input_text),
                "mode": generated.get("mode", mode),
                "verified_response": final_response,
                "outputs": _build_outputs(final_response),
                "score": critique.get("score", 0),
                "confidence": critique.get("confidence", 0),
                "tone": critique.get("tone", "professional"),
                "issues_found": critique.get("issues_found", []),
                "improvements_made": critique.get("improvements_made", []),
                "reasoning": critique.get("reasoning", ""),
                "attempts": attempt + 1,
            }

        feedback = critique.get("issues_found", [])

    final_response = critique.get("verified_response", generated.get("generated_response", "")).strip()

    return {
        "raw_input": generated.get("raw_input", input_text),
        "normalized_input": generated.get("normalized_input", input_text),
        "mode": generated.get("mode", mode),
        "verified_response": final_response,
        "outputs": _build_outputs(final_response),
        "score": critique.get("score", 0),
        "confidence": critique.get("confidence", 0),
        "tone": critique.get("tone", "professional"),
        "issues_found": critique.get("issues_found", []),
        "improvements_made": critique.get("improvements_made", []),
        "reasoning": critique.get("reasoning", ""),
        "attempts": max_attempts,
    }
