"""
Main API Entry (Verexa Backend)
"""

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.pipeline.memory import answer_memory_prompt, extract_profile_facts, write_memory_item, write_profile_facts
    from backend.pipeline.verify import verify_pipeline
except ImportError:
    from pipeline.memory import answer_memory_prompt, extract_profile_facts, write_memory_item, write_profile_facts
    from pipeline.verify import verify_pipeline

app = FastAPI(
    title="Verexa AI",
    description="AI Verification Engine",
    version="0.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEV_MODE = False


class PromptRequest(BaseModel):
    prompt: Optional[str] = None
    input: Optional[str] = None
    mode: Optional[str] = None
    session_id: Optional[str] = None


@app.get("/")
def home():
    return {"message": "Verexa backend running"}


@app.post("/verexa")
async def run_verexa(data: PromptRequest):
    prompt = (data.prompt or data.input or "").strip()
    mode = (data.mode or "auto").strip().lower()
    session_id = (data.session_id or "").strip()

    if not prompt or len(prompt) < 3:
        raise HTTPException(status_code=400, detail="Invalid prompt")

    memory_result = answer_memory_prompt(prompt, session_id)
    result = memory_result or verify_pipeline(prompt, mode)

    if DEV_MODE:
        return {
            "original": prompt,
            "verified": result
        }

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    if session_id:
        memory_payload = {
            "raw_input": result.get("raw_input", prompt),
            "normalized_input": result.get("normalized_input", prompt),
            "verified_response": result.get("verified_response", ""),
            "mode": result.get("mode", mode),
            "score": result.get("score", 0),
            "confidence": result.get("confidence", 0),
            "tone": result.get("tone", "neutral"),
            "reasoning": result.get("reasoning", ""),
        }

        write_memory_item(
            session_id,
            memory_payload,
        )
        write_profile_facts(session_id, extract_profile_facts(memory_payload))

    score = result.get("score", 50)

    if score >= 90:
        grade = "S"
    elif score >= 80:
        grade = "A"
    elif score >= 70:
        grade = "B"
    elif score >= 60:
        grade = "C"
    else:
        grade = "D"

    return {
        "original": prompt,
        "raw_input": result.get("raw_input", prompt),
        "normalized_input": result.get("normalized_input", prompt),
        "mode": result.get("mode", mode),
        "session_id": session_id,
        "verified_response": result.get("verified_response"),
        "outputs": result.get("outputs", {}),
        "score": score,
        "confidence": result.get("confidence", 0),
        "tone": result.get("tone", "neutral"),
        "grade": grade,
        "issues_found": result.get("issues_found", []),
        "improvements_made": result.get("improvements_made", []),
        "reasoning": result.get("reasoning", ""),
        "attempts": result.get("attempts", 1)
    }
