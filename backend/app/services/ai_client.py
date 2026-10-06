import json
import os
import uuid

import requests
from flask import current_app

SESSION_ID = uuid.uuid4().hex
USER_AGENT = "job-screener/1.0"


def _headers(key: str) -> dict:
    return {
        "Authorization": f"Bearer {key}",
        "User-Agent": USER_AGENT,
        "x-opencode-session": SESSION_ID,
    }

SYSTEM_PROMPT = (
    "You are a job application screener. Return ONLY JSON with keys "
    "score (0-100 integer), strengths (string array), "
    "missing_skills (string array), recommendation (string)."
)


def _mock_result(cv_text: str) -> dict:
    return {
        "score": min(95, 40 + len(cv_text) % 50),
        "strengths": ["Mock: text extracted"],
        "missing_skills": [],
        "recommendation": "Mock scoring — set MUSE_SPARK_API_KEY for real scoring.",
    }


def _cfg(key: str, default: str = "") -> str:
    try:
        return current_app.config.get(key, default)
    except RuntimeError:
        return os.environ.get(key, default)


def _extract_json(text: str) -> dict:
    text = (text or "").strip()
    try:
        return json.loads(text)
    except ValueError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _responses_output_text(data: dict) -> str:
    chunks = []
    for item in data.get("output", []) or []:
        if item.get("type") != "message":
            continue
        for part in item.get("content", []) or []:
            if part.get("type") == "output_text" and part.get("text"):
                chunks.append(part["text"])
    if chunks:
        return "".join(chunks)
    if isinstance(data.get("output_text"), str):
        return data["output_text"]
    return ""


def _finalize(result: dict) -> dict:
    score = int(result.get("score", 0))
    result["score"] = max(0, min(100, score))
    result.setdefault("strengths", [])
    result.setdefault("missing_skills", [])
    result.setdefault("recommendation", "")
    return result


def _call_responses(base: str, key: str, model: str, prompt: str) -> dict:
    resp = requests.post(
        f"{base}/responses",
        headers=_headers(key),
        json={
            "model": model,
            "instructions": SYSTEM_PROMPT,
            "input": [
                {
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": prompt}],
                }
            ],
            "temperature": 0.2,
            "max_output_tokens": 1000,
        },
        timeout=60,
    )
    resp.raise_for_status()
    return _finalize(_extract_json(_responses_output_text(resp.json())))


def _call_chat(base: str, key: str, model: str, prompt: str) -> dict:
    resp = requests.post(
        f"{base}/chat/completions",
        headers=_headers(key),
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
        timeout=60,
    )
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    return _finalize(_extract_json(content))


def score_candidate(cv_text: str, job_title: str, job_requirements: str) -> dict:
    use_mock = os.environ.get("MOCK_AI") == "1"
    api_key = _cfg("MUSE_SPARK_API_KEY", "")
    if use_mock or not api_key:
        return _mock_result(cv_text)

    base = _cfg("MUSE_SPARK_BASE_URL", "https://opencode.ai/zen/go/v1").rstrip("/")
    model = _cfg("AI_MODEL", "muse-spark-1.3-contributor")
    api = _cfg("AI_API", "responses")
    prompt = (
        f"JOB TITLE: {job_title}\n"
        f"REQUIREMENTS: {job_requirements}\n"
        f"CV TEXT: {cv_text[:8000]}"
    )

    try:
        if api == "chat":
            return _call_chat(base, api_key, model, prompt)
        return _call_responses(base, api_key, model, prompt)
    except Exception:
        try:
            from ..metrics import ai_failures_total

            ai_failures_total.inc()
        except Exception:
            pass
        raise RuntimeError("AI scoring failed")
