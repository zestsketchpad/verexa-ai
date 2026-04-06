"""
Main API Entry (Verexa Backend)
"""

import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

try:
    from backend.pipeline.memory import (
        answer_memory_prompt,
        extract_profile_facts,
        resolve_style_preferences,
        write_memory_item,
        write_profile_facts,
    )
    from backend.pipeline.verify import verify_pipeline
except ImportError:
    from pipeline.memory import answer_memory_prompt, extract_profile_facts, resolve_style_preferences, write_memory_item, write_profile_facts
    from pipeline.verify import verify_pipeline

app = FastAPI(
    title="Verexa AI",
    description="AI Verification Engine",
    version="0.1"
)


def _allowed_origins() -> list[str]:
    configured = str(os.getenv("ALLOWED_ORIGINS") or "").strip()
    if configured:
        return [item.strip() for item in configured.split(",") if item.strip()]

    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://verixaai.zestsketchpad.in",
    ]


ALLOWED_ORIGINS = _allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEV_MODE = False


class PromptRequest(BaseModel):
    prompt: Optional[str] = Field(default=None, max_length=6000)
    input: Optional[str] = Field(default=None, max_length=6000)
    previous_output: Optional[str] = Field(default=None, max_length=8000)
    refine_instruction: Optional[str] = Field(default=None, max_length=2000)
    mode: Optional[str] = Field(default=None, max_length=40)
    intent: Optional[str] = Field(default=None, max_length=40)
    tone: Optional[str] = Field(default=None, max_length=30)
    style_tone_default: Optional[str] = Field(default=None, max_length=30)
    style_writing_style: Optional[str] = Field(default=None, max_length=30)
    style_industry: Optional[str] = Field(default=None, max_length=40)
    project_context: Optional[str] = Field(default=None, max_length=3000)
    session_id: Optional[str] = None

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip().lower()
        allowed = {"auto", "email", "proposal", "reply", "explain", "coding", "brainstorm"}
        if normalized and normalized not in allowed:
            raise ValueError("Invalid mode")

        return normalized

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip().lower()
        allowed = {"freelance", "email", "strategy"}
        if normalized and normalized not in allowed:
            raise ValueError("Invalid intent")

        return normalized

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip().lower()
        allowed = {"professional", "friendly", "assertive"}
        if normalized and normalized not in allowed:
            raise ValueError("Invalid tone")

        return normalized

    @field_validator("style_tone_default")
    @classmethod
    def validate_style_tone_default(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip().lower()
        allowed = {"professional", "friendly", "assertive"}
        if normalized and normalized not in allowed:
            raise ValueError("Invalid style tone")

        return normalized

    @field_validator("style_writing_style")
    @classmethod
    def validate_style_writing_style(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip().lower()
        allowed = {"concise", "detailed"}
        if normalized and normalized not in allowed:
            raise ValueError("Invalid writing style")

        return normalized

    @field_validator("style_industry")
    @classmethod
    def validate_style_industry(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip().lower()
        allowed = {"freelance", "dev", "design"}
        if normalized and normalized not in allowed:
            raise ValueError("Invalid style industry")

        return normalized


@app.get("/")
def home():
    return {"message": "Verexa backend running"}


@app.post("/verexa")
async def run_verexa(data: PromptRequest):
    prompt = (data.prompt or data.input or "").strip()
    previous_output = (data.previous_output or "").strip()
    refine_instruction = (data.refine_instruction or "").strip()
    mode = (data.mode or "auto").strip().lower()
    intent = (data.intent or "").strip().lower() or None
    tone = (data.tone or "professional").strip().lower()
    session_id = (data.session_id or "").strip()
    project_context = (data.project_context or "").strip()
    request_style = {
        "tone_default": (data.style_tone_default or "").strip().lower(),
        "writing_style": (data.style_writing_style or "").strip().lower(),
        "industry": (data.style_industry or "").strip().lower(),
    }
    style_preferences = resolve_style_preferences(session_id, request_style)

    if tone == "professional" and style_preferences.get("tone_default"):
        tone = str(style_preferences.get("tone_default"))

    if not prompt or len(prompt) < 3:
        raise HTTPException(status_code=400, detail="Invalid prompt")

    memory_result = answer_memory_prompt(prompt, session_id)
    result = memory_result or verify_pipeline(
        prompt,
        mode,
        intent,
        tone,
        style_preferences=style_preferences,
        project_context=project_context,
        refine_instruction=refine_instruction,
        previous_output=previous_output,
    )

    if DEV_MODE:
        return {
            "original": prompt,
            "verified": result
        }

    if session_id:
        memory_payload = {
            "raw_input": result.get("raw_input", prompt),
            "normalized_input": result.get("normalized_input", prompt),
            "verified_response": result.get("verified_response", ""),
            "mode": result.get("mode", mode),
            "intent": result.get("intent", intent),
            "decision": result.get("decision", "MODIFY"),
            "score": result.get("score", 0),
            "confidence": result.get("confidence", 0),
            "tone": result.get("tone", tone),
            "style_preferences": result.get("style_preferences", style_preferences),
            "project_context": result.get("project_context", project_context),
            "insight_lines": result.get("insight_lines", []),
            "client_perspective": result.get("client_perspective", {}),
            "policy_results": result.get("policy_results", {}),
            "variations": result.get("variations", []),
            "reasoning": result.get("reasoning", ""),
        }

        write_memory_item(
            session_id,
            memory_payload,
        )
        write_profile_facts(session_id, extract_profile_facts(memory_payload))

    score = result.get("score", 70)

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
        "intent": result.get("intent", intent),
        "session_id": session_id,
        "verified_response": result.get("verified_response"),
        "outputs": result.get("outputs", {}),
        "score": score,
        "confidence": result.get("confidence", 0),
        "tone": result.get("tone", tone),
        "style_preferences": result.get("style_preferences", style_preferences),
        "project_context": result.get("project_context", project_context),
        "decision": result.get("decision", "MODIFY"),
        "grade": grade,
        "issues_found": result.get("issues_found", []),
        "improvements_made": result.get("improvements_made", []),
        "insight_lines": result.get("insight_lines", []),
        "client_perspective": result.get("client_perspective", {}),
        "variations": result.get("variations", []),
        "policy_results": result.get("policy_results", {}),
        "reasoning": result.get("reasoning", ""),
        "attempts": result.get("attempts", 1)
    }
