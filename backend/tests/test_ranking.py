from app.services.ranking import rank_candidates  # noqa: E402


def test_ranking_orders_by_score_desc():
    cands = [
        {"score": 70, "created_at": "2026-01-01"},
        {"score": 90, "created_at": "2026-01-02"},
        {"score": 80, "created_at": "2026-01-03"},
    ]
    ranked = rank_candidates(cands)
    assert [c["score"] for c in ranked] == [90, 80, 70]
