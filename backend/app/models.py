import uuid
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def _uuid_hex():
    return uuid.uuid4().hex


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.String(36), primary_key=True, default=_uuid_hex)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class Candidate(db.Model):
    __tablename__ = "candidates"

    id = db.Column(db.String(36), primary_key=True, default=_uuid_hex)
    job_id = db.Column(
        db.String(36), db.ForeignKey("jobs.id"), nullable=False, index=True
    )
    name = db.Column(db.String(200), nullable=False, default="")
    email = db.Column(db.String(200), nullable=False, default="")
    cv_filename = db.Column(db.String(255), nullable=False, default="")
    cv_text = db.Column(db.Text, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    strengths = db.Column(db.JSON, nullable=False, default=list)
    missing_skills = db.Column(db.JSON, nullable=False, default=list)
    recommendation = db.Column(db.Text, nullable=False, default="")
    processing_time_ms = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
