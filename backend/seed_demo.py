"""Seed one demo job + two mock-scored candidates. Run: MOCK_AI=1 python seed_demo.py"""

import os

os.environ.setdefault("MOCK_AI", "1")

from app import create_app  # noqa: E402
from app.models import Candidate, Job, db  # noqa: E402
from app.services.ai_client import score_candidate  # noqa: E402
from app.services.scoring import validate_scoring  # noqa: E402

app = create_app("seed")
with app.app_context():
    job = Job(
        title="Backend Developer",
        description="Build Flask APIs",
        requirements="python, flask, postgres",
    )
    db.session.add(job)
    db.session.flush()
    for name, email, text in [
        ("Alice", "alice@example.com", "python flask developer 5 years postgres"),
        ("Bob", "bob@example.com", "junior python developer 1 year"),
    ]:
        result = validate_scoring(
            score_candidate(text, job.title, job.requirements), 0
        )
        db.session.add(
            Candidate(
                job_id=job.id,
                name=name,
                email=email,
                cv_filename=f"{name.lower()}.txt",
                cv_text=text,
                score=result["score"],
                strengths=result["strengths"],
                missing_skills=result["missing_skills"],
                recommendation=result["recommendation"],
            )
        )
    db.session.commit()
    print(f"seeded job {job.id}")
