from flask import Blueprint, jsonify

from ..metrics import ai_failures_total
from ..models import Candidate, Job, db

analytics_bp = Blueprint("analytics", __name__)


def _stats(candidates):
    if not candidates:
        return {
            "candidate_count": 0,
            "average_score": 0,
            "min_score": 0,
            "max_score": 0,
            "avg_processing_time_ms": 0,
        }
    scores = [c.score for c in candidates]
    times = [c.processing_time_ms or 0 for c in candidates]
    return {
        "candidate_count": len(candidates),
        "average_score": round(sum(scores) / len(scores), 1),
        "min_score": min(scores),
        "max_score": max(scores),
        "avg_processing_time_ms": round(sum(times) / len(times), 1),
    }


@analytics_bp.get("/jobs/<job_id>/analytics")
def job_analytics(job_id):
    job = db.session.get(Job, job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    candidates = Candidate.query.filter_by(job_id=job_id).all()
    return jsonify(_stats(candidates)), 200


@analytics_bp.get("/analytics/overview")
def overview():
    total_jobs = Job.query.count()
    candidates = Candidate.query.all()
    stats = _stats(candidates)
    try:
        failures = ai_failures_total._value.get()
    except Exception:
        failures = 0
    return jsonify(
        {
            "total_jobs": total_jobs,
            "total_candidates": stats["candidate_count"],
            "average_score": stats["average_score"],
            "ai_failures": failures,
            "avg_processing_time_ms": stats["avg_processing_time_ms"],
        }
    ), 200
