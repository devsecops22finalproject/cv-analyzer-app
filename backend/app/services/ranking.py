def rank_candidates(candidates: list) -> list:
    def _key(c):
        if isinstance(c, dict):
            score = c.get("score", 0)
            created = c.get("created_at") or ""
        else:
            score = getattr(c, "score", 0)
            created = getattr(c, "created_at", None) or ""
        return (-score, str(created))

    return sorted(candidates, key=_key)
