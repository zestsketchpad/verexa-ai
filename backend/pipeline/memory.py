import os
import re
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

LOCAL_MEMORY_WORKER_URL = "http://127.0.0.1:8787"
REQUEST_TIMEOUT_SECONDS = 10
MAX_MEMORY_ITEMS = 10


def get_memory_worker_url() -> str | None:
    configured_url = str(os.getenv("MEMORY_WORKER_URL") or "").strip().rstrip("/")
    if configured_url:
        return configured_url

    render_environment = str(os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL") or "").strip()
    if render_environment:
        return None

    return LOCAL_MEMORY_WORKER_URL


def write_memory_item(session_id: str, payload: dict[str, Any]) -> None:
    worker_url = get_memory_worker_url()
    resolved_session_id = str(session_id or "").strip()

    if not worker_url or not resolved_session_id:
        return

    verified_response = str(payload.get("verified_response", "")).strip()
    raw_input = str(payload.get("raw_input", "")).strip()

    if not verified_response or not raw_input:
        return

    request_payload = {
      "sessionId": resolved_session_id,
      "userInput": raw_input,
      "normalizedInput": str(payload.get("normalized_input", "")).strip(),
      "verifiedResponse": verified_response,
      "mode": str(payload.get("mode", "")).strip(),
      "score": payload.get("score"),
      "confidence": payload.get("confidence"),
      "tone": str(payload.get("tone", "")).strip(),
      "reasoning": str(payload.get("reasoning", "")).strip(),
    }

    try:
        response = requests.post(
            f"{worker_url}/memory/write",
            json=request_payload,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"[memory] failed to write item: {exc}")


def write_profile_facts(session_id: str, facts: list[dict[str, Any]]) -> None:
    worker_url = get_memory_worker_url()
    resolved_session_id = str(session_id or "").strip()

    if not worker_url or not resolved_session_id or not facts:
        return

    try:
        response = requests.post(
            f"{worker_url}/profile/upsert",
            json={"sessionId": resolved_session_id, "facts": facts},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"[memory] failed to write profile facts: {exc}")


def _normalized_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _get_json(url: str) -> dict[str, Any] | None:
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        print(f"[memory] failed to fetch json: {exc}")
        return None


def _post_json(url: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        response = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        print(f"[memory] failed to post json: {exc}")
        return None


def fetch_session_history(session_id: str) -> list[dict[str, Any]]:
    worker_url = get_memory_worker_url()
    resolved_session_id = str(session_id or "").strip()

    if not worker_url or not resolved_session_id:
        return []

    payload = _get_json(f"{worker_url}/sessions/{resolved_session_id}/history")
    items = payload.get("items") if isinstance(payload, dict) else []
    return items if isinstance(items, list) else []


def fetch_profile_facts(session_id: str) -> list[dict[str, Any]]:
    worker_url = get_memory_worker_url()
    resolved_session_id = str(session_id or "").strip()

    if not worker_url or not resolved_session_id:
        return []

    payload = _get_json(f"{worker_url}/sessions/{resolved_session_id}/profile")
    facts = payload.get("facts") if isinstance(payload, dict) else []
    return facts if isinstance(facts, list) else []


def search_memory_items(session_id: str, query: str) -> list[dict[str, Any]]:
    worker_url = get_memory_worker_url()
    resolved_session_id = str(session_id or "").strip()
    resolved_query = str(query or "").strip()

    if not worker_url or not resolved_session_id or not resolved_query:
        return []

    payload = _post_json(
        f"{worker_url}/memory/search",
        {"sessionId": resolved_session_id, "query": resolved_query},
    )
    items = payload.get("items") if isinstance(payload, dict) else []
    return items if isinstance(items, list) else []


def is_memory_prompt(prompt: str) -> bool:
    normalized_prompt = _normalized_text(prompt)
    memory_markers = (
        "remember",
        "history",
        "previous",
        "before",
        "last question",
        "last prompt",
        "what did i ask",
        "what have i asked",
        "what questions did i ask",
        "what did we talk about",
        "what did i tell you",
        "what was my last",
        "summary of our chat",
        "summarize our chat",
        "did i ask about",
        "have i asked about",
        "my name",
        "tell me my name",
        "what is my name",
        "what's my name",
        "who am i",
    )
    return any(marker in normalized_prompt for marker in memory_markers)


def _extract_name_from_text(text: str) -> str:
    patterns = (
        r"\bmy name is ([a-z][a-z\s'-]{1,40})",
        r"\bi am ([a-z][a-z\s'-]{1,40})",
        r"\bi'm ([a-z][a-z\s'-]{1,40})",
    )

    for pattern in patterns:
        match = re.search(pattern, _normalized_text(text), flags=re.IGNORECASE)
        if match:
            candidate = match.group(1).strip(" .,!?:;\"'")
            candidate = re.split(
                r"\b(?:and|im|i'm|i am|the|founder|ceo|cto|developer|designer|engineer|from|at|of)\b",
                candidate,
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0].strip(" .,!?:;\"'")
            candidate_words = [
                word for word in candidate.split()
                if word not in {"and", "im", "i'm", "i", "am"}
            ]
            if candidate_words:
                return " ".join(word.capitalize() for word in candidate_words[:4])

    return ""


def _sanitize_profile_name(value: str) -> str:
    cleaned = str(value or "").strip()
    if not cleaned:
        return ""

    cleaned = re.split(
        r"\b(?:and|im|i'm|i am|the|founder|ceo|cto|developer|designer|engineer|from|at|of)\b",
        cleaned,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip(" .,!?:;\"'")

    words = [
        word.capitalize()
        for word in cleaned.split()
        if word and word.lower() not in {"and", "im", "i'm", "i", "am"}
    ]
    return " ".join(words[:4])


def extract_profile_facts(payload: dict[str, Any]) -> list[dict[str, Any]]:
    text_chunks = [
        str(payload.get("raw_input", "")).strip(),
        str(payload.get("normalized_input", "")).strip(),
        str(payload.get("verified_response", "")).strip(),
    ]
    combined_text = " ".join(chunk for chunk in text_chunks if chunk)

    facts: list[dict[str, Any]] = []

    extracted_name = _extract_name_from_text(combined_text)
    if extracted_name:
        facts.append(
            {
                "key": "name",
                "value": extracted_name,
                "confidence": 96,
                "source": "session_message",
            }
        )

    role_patterns = (
        r"\bi am (?:the )?(founder|ceo|cto|developer|designer|engineer)\b",
        r"\bi[' ]?m (?:the )?(founder|ceo|cto|developer|designer|engineer)\b",
    )
    normalized_text = _normalized_text(combined_text)
    for pattern in role_patterns:
        match = re.search(pattern, normalized_text, flags=re.IGNORECASE)
        if match:
            facts.append(
                {
                    "key": "role",
                    "value": match.group(1).upper() if match.group(1).lower() in {"ceo", "cto"} else match.group(1).capitalize(),
                    "confidence": 88,
                    "source": "session_message",
                }
            )
            break

    company_match = re.search(r"\bfounder of ([a-z0-9][a-z0-9\s&'_-]{1,60})", normalized_text, flags=re.IGNORECASE)
    if company_match:
        company = company_match.group(1).strip(" .,!?:;\"'")
        if company:
            facts.append(
                {
                    "key": "company",
                    "value": " ".join(word.capitalize() for word in company.split()),
                    "confidence": 86,
                    "source": "session_message",
                }
            )

    return facts


def _build_memory_result(
    prompt: str,
    session_id: str,
    verified_response: str,
    score: int = 96,
    confidence: int = 98,
) -> dict[str, Any]:
    return {
        "raw_input": prompt,
        "normalized_input": prompt,
        "mode": "memory",
        "verified_response": verified_response,
        "outputs": {
            "professional": verified_response,
            "casual": verified_response,
            "short": verified_response,
            "persuasive": verified_response,
        },
        "score": score,
        "confidence": confidence,
        "tone": "professional",
        "issues_found": [],
        "improvements_made": ["Answered from stored D1 session memory instead of inferring context."],
        "reasoning": f"This answer is grounded in session {session_id} history stored in D1.",
        "attempts": 1,
    }


def answer_memory_prompt(prompt: str, session_id: str) -> dict[str, Any] | None:
    resolved_session_id = str(session_id or "").strip()
    normalized_prompt = _normalized_text(prompt)

    if not resolved_session_id or not is_memory_prompt(prompt):
        return None

    history_items = fetch_session_history(resolved_session_id)
    profile_facts = fetch_profile_facts(resolved_session_id)
    if not history_items:
        return _build_memory_result(
            prompt,
            resolved_session_id,
            "I do not have any stored session history yet, so I cannot answer that from memory.",
            score=88,
            confidence=95,
        )

    fact_map = {}
    for fact in profile_facts:
        fact_key = str(fact.get("fact_key", "")).strip().lower()
        fact_value = str(fact.get("fact_value", "")).strip()
        if not fact_key or not fact_value:
            continue
        fact_map[fact_key] = _sanitize_profile_name(fact_value) if fact_key == "name" else fact_value

    if any(marker in normalized_prompt for marker in ("my name", "tell me my name", "what is my name", "what's my name")):
        for fact in profile_facts:
            if str(fact.get("fact_key", "")).strip().lower() == "name":
                fact_value = _sanitize_profile_name(str(fact.get("fact_value", "")).strip())
                if fact_value:
                    return _build_memory_result(
                        prompt,
                        resolved_session_id,
                        f"Your name is {fact_value}.",
                    )

        for item in history_items:
            combined_text = " ".join(
                value
                for value in (
                    str(item.get("user_input", "")).strip(),
                    str(item.get("normalized_input", "")).strip(),
                    str(item.get("verified_response", "")).strip(),
                )
                if value
            )
            extracted_name = _extract_name_from_text(combined_text)
            if extracted_name:
                return _build_memory_result(
                    prompt,
                    resolved_session_id,
                    f"You told me your name is {extracted_name}.",
                )

        return _build_memory_result(
            prompt,
            resolved_session_id,
            "I checked the stored session history, but I could not confidently find your name there.",
            score=90,
            confidence=94,
        )

    if (
        "who am i" in normalized_prompt
        or "what do i do" in normalized_prompt
        or "what is my role" in normalized_prompt
        or "what's my role" in normalized_prompt
        or "founder" in normalized_prompt
        or "company" in normalized_prompt
        or "what company" in normalized_prompt
    ):
        if fact_map:
            name = fact_map.get("name", "")
            role = fact_map.get("role", "")
            company = fact_map.get("company", "")

            if "what do i do" in normalized_prompt and role:
                return _build_memory_result(
                    prompt,
                    resolved_session_id,
                    f"You told me that you work as {role}{f' at {company}' if company else ''}.",
                )

            if ("what company" in normalized_prompt or "company" in normalized_prompt) and company:
                return _build_memory_result(
                    prompt,
                    resolved_session_id,
                    f"You mentioned {company} as your company.",
                )

            if "who am i" in normalized_prompt:
                details: list[str] = []
                if name:
                    details.append(name)
                if role and company:
                    details.append(f"{role} at {company}")
                elif role:
                    details.append(role)
                elif company:
                    details.append(f"connected to {company}")

                if details:
                    return _build_memory_result(
                        prompt,
                        resolved_session_id,
                        f"From what you've shared with me, you're {' and '.join(details)}.",
                    )

            if role or company or name:
                summary_parts: list[str] = []
                if name:
                    summary_parts.append(f"your name is {name}")
                if role:
                    summary_parts.append(f"you work as {role}")
                if company:
                    summary_parts.append(f"you're connected to {company}")

                return _build_memory_result(
                    prompt,
                    resolved_session_id,
                    f"From your saved profile, {', '.join(summary_parts)}.",
                )

    if any(marker in normalized_prompt for marker in ("last question", "last prompt", "what was my last", "previous question")):
        latest_item = history_items[0]
        latest_question = str(latest_item.get("user_input", "")).strip()
        if latest_question:
            return _build_memory_result(
                prompt,
                resolved_session_id,
                f"Your most recent stored question in this session was: {latest_question}",
            )

    if "did i ask about" in normalized_prompt or "have i asked about" in normalized_prompt:
        query_text = normalized_prompt.split("about", 1)[-1].strip(" ?.")
        if query_text:
            matches = search_memory_items(resolved_session_id, query_text)
            if matches:
                matched_questions = [
                    str(item.get("user_input", "")).strip()
                    for item in matches[:MAX_MEMORY_ITEMS]
                    if str(item.get("user_input", "")).strip()
                ]
                if matched_questions:
                    joined = "; ".join(matched_questions)
                    return _build_memory_result(
                        prompt,
                        resolved_session_id,
                        f"Yes. I found these related questions in this session: {joined}",
                    )

            return _build_memory_result(
                prompt,
                resolved_session_id,
                f"I could not find a stored session question specifically about {query_text}.",
                score=90,
                confidence=94,
            )

    recent_questions = [
        str(item.get("user_input", "")).strip()
        for item in history_items[:MAX_MEMORY_ITEMS]
        if str(item.get("user_input", "")).strip()
    ]

    if not recent_questions:
        return _build_memory_result(
            prompt,
            resolved_session_id,
            "I do not have any usable stored prompts in this session yet.",
            score=88,
            confidence=95,
        )

    formatted_questions = " ".join(
        f"{index}. {question}" for index, question in enumerate(recent_questions, start=1)
    )

    return _build_memory_result(
        prompt,
        resolved_session_id,
        f"Here are the most recent questions stored in this session: {formatted_questions}",
    )
