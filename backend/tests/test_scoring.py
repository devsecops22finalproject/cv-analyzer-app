import os

os.environ["MOCK_AI"] = "1"

from app.services.ai_client import score_candidate  # noqa: E402
from app.services.scoring import validate_scoring  # noqa: E402


def test_mock_score_candidate_returns_required_keys():
    result = score_candidate("python developer 5 years", "Dev", "python")
    assert set(result) == {
        "score",
        "strengths",
        "missing_skills",
        "recommendation",
    }
    assert isinstance(result["score"], int)
    assert 0 <= result["score"] <= 100


def test_validate_scoring_clamps():
    validated = validate_scoring(
        {
            "score": 140,
            "strengths": ["  python  ", ""],
            "missing_skills": "nope",
            "recommendation": None,
        },
        0,
    )
    assert validated["score"] == 100
    assert validated["strengths"] == ["python"]
    assert validated["missing_skills"] == []
    assert validated["recommendation"] == ""
