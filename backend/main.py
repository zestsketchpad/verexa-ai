"""
Main API Entry (Verexa Backend)
"""

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.pipeline.verify import verify_pipeline
except ImportError:
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


@app.get("/")
def home():
    return {"message": "Verexa backend running"}


@app.post("/verexa")
async def run_verexa(data: PromptRequest):
    prompt = (data.prompt or data.input or "").strip()
    mode = (data.mode or "auto").strip().lower()

    if not prompt or len(prompt) < 3:
        raise HTTPException(status_code=400, detail="Invalid prompt")

    result = verify_pipeline(prompt, mode)

    if DEV_MODE:
        return {
            "original": prompt,
            "verified": result
        }

    if "error" in result:
        return {
            "original": prompt,
            "error": result["error"]
        }

    score = result.get("score", 5)

    if score >= 9:
        grade = "S"
    elif score >= 8:
        grade = "A"
    elif score >= 7:
        grade = "B"
    elif score >= 6:
        grade = "C"
    else:
        grade = "D"

    return {
        "original": prompt,
        "raw_input": result.get("raw_input", prompt),
        "normalized_input": result.get("normalized_input", prompt),
        "mode": result.get("mode", mode),
        "verified_response": result.get("verified_response"),
        "outputs": result.get("outputs", {}),
        "score": score,
        "confidence": result.get("confidence", 0),
        "tone": result.get("tone", "neutral"),
        "grade": grade,
        "issues_found": result.get("issues_found", []),
        "improvements_made": result.get("improvements_made", []),
        "attempts": result.get("attempts", 1)
    }
