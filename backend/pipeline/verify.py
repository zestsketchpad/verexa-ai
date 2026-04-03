from pipeline.critic import critique_response
from pipeline.generate import generate_response


def verify_pipeline(input_text: str, mode: str = "auto") -> dict:
    max_attempts = 2
    feedback = None
    generated = {}
    critique = {
        "score": 4,
        "issues": ["Critic was not run"],
        "decision": "REGENERATE"
    }

    for attempt in range(max_attempts):
        generated = generate_response(input_text, mode, feedback)

        if "error" in generated:
            return {"error": generated["error"]}

        outputs = generated.get("outputs", {})
        critique = critique_response(input_text, outputs, mode)

        if critique["decision"] == "ACCEPT":
            return {
                "raw_input": generated.get("raw_input", input_text),
                "normalized_input": generated.get("normalized_input", input_text),
                "mode": generated.get("mode", mode),
                "verified_response": generated.get("verified_response", ""),
                "outputs": outputs,
                "score": critique["score"],
                "confidence": generated.get("confidence", 0),
                "tone": generated.get("tone", "neutral"),
                "issues_found": critique["issues"],
                "improvements_made": [] if attempt == 0 else ["Improved after critique"],
                "attempts": attempt + 1
            }

        feedback = critique["issues"]

    return {
        "raw_input": generated.get("raw_input", input_text),
        "normalized_input": generated.get("normalized_input", input_text),
        "mode": generated.get("mode", mode),
        "verified_response": generated.get("verified_response", ""),
        "outputs": generated.get("outputs", {}),
        "score": critique["score"],
        "confidence": generated.get("confidence", 0),
        "tone": generated.get("tone", "neutral"),
        "issues_found": critique["issues"],
        "improvements_made": ["Returned best possible after retries"],
        "attempts": max_attempts
    }
