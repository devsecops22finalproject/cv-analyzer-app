def validate_scoring(result: dict, min_score: int) -> dict:
    score = result.get("score", 0)
    try:
        score = int(score)
    except (TypeError, ValueError):
        score = 0
    score = max(0, min(100, score))

    def _clean_list(value):
        if not isinstance(value, list):
            return []
        return [s for s in (str(v).strip() for v in value) if s]

    validated = {
        "score": score,
        "strengths": _clean_list(result.get("strengths")),
        "missing_skills": _clean_list(result.get("missing_skills")),
        "recommendation": str(result.get("recommendation") or ""),
    }
    validated["meets_minimum"] = validated["score"] >= min_score
    return validated
