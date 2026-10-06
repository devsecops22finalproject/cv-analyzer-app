import time

from flask import Blueprint, current_app, jsonify, request

from ..metrics import screening_duration_seconds, screening_requests_total
from ..models import Candidate, Job, db
from ..services.ai_client import score_candidate
from ..services.cv_extract import extract_text
from ..services.ranking import rank_candidates
from ..services.scoring import validate_scoring

candidates_bp = Blueprint("candidates", __name__)


def _candidate_to_dict(c):
    return {
        "id": c.id,
        "job_id": c.job_id,
        "name": c.name,
        "email": c.email,
        "cv_filename": c.cv_filename,
        "cv_text": c.cv_text,
        "score": c.score,
        "strengths": c.strengths,
        "missing_skills": c.missing_skills,
        "recommendation": c.recommendation,
        "processing_time_ms": c.processing_time_ms,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@candidates_bp.post("/jobs/<job_id>/candidates")
def upload_candidate(job_id):
    job = db.session.get(Job, job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    name = (request.form.get("name") or "").strip()
    email = (request.form.get("email") or "").strip()
    file = request.files.get("file")
    if file is None:
        return jsonify({"error": "file is required"}), 400
    try:
        max_bytes = current_app.config.get("MAX_CV_SIZE", 5242880)
        cv_text, filename = extract_text(file, max_bytes)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    start = time.perf_counter_ns()
    try:
        with screening_duration_seconds.time():
            result = score_candidate(cv_text, job.title, job.requirements)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502
    elapsed_ms = (time.perf_counter_ns() - start) // 1_000_000
    validated = validate_scoring(
        result, current_app.config.get("MIN_SCORE", 0)
    )
    candidate = Candidate(
        job_id=job_id,
        name=name,
        email=email,
        cv_filename=filename,
        cv_text=cv_text,
        score=validated["score"],
        strengths=validated["strengths"],
        missing_skills=validated["missing_skills"],
        recommendation=validated["recommendation"],
        processing_time_ms=int(elapsed_ms),
    )
    db.session.add(candidate)
    db.session.commit()
    screening_requests_total.labels(job_id=job_id).inc()
    return jsonify(_candidate_to_dict(candidate)), 201


@candidates_bp.get("/jobs/<job_id>/candidates")
def list_candidates(job_id):
    job = db.session.get(Job, job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    candidates = Candidate.query.filter_by(job_id=job_id).all()
    ranked = rank_candidates([_candidate_to_dict(c) for c in candidates])
    return jsonify(ranked), 200


@candidates_bp.get("/candidates/<candidate_id>")
def get_candidate(candidate_id):
    candidate = db.session.get(Candidate, candidate_id)
    if candidate is None:
        return jsonify({"error": "candidate not found"}), 404
    return jsonify(_candidate_to_dict(candidate)), 200


@candidates_bp.post("/candidates/<candidate_id>/rescore")
def rescore_candidate(candidate_id):
    candidate = db.session.get(Candidate, candidate_id)
    if candidate is None:
        return jsonify({"error": "candidate not found"}), 404
    job = db.session.get(Job, candidate.job_id)
    start = time.perf_counter_ns()
    try:
        with screening_duration_seconds.time():
            result = score_candidate(
                candidate.cv_text,
                job.title if job else "",
                job.requirements if job else "",
            )
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502
    elapsed_ms = (time.perf_counter_ns() - start) // 1_000_000
    validated = validate_scoring(
        result, current_app.config.get("MIN_SCORE", 0)
    )
    candidate.score = validated["score"]
    candidate.strengths = validated["strengths"]
    candidate.missing_skills = validated["missing_skills"]
    candidate.recommendation = validated["recommendation"]
    candidate.processing_time_ms = int(elapsed_ms)
    db.session.commit()
    return jsonify(_candidate_to_dict(candidate)), 200
