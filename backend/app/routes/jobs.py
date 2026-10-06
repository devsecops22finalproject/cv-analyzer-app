from flask import Blueprint, jsonify, request

from ..models import Candidate, Job, db

jobs_bp = Blueprint("jobs", __name__)


def _job_to_dict(job):
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "requirements": job.requirements,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


@jobs_bp.post("/jobs")
def create_job():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    requirements = (data.get("requirements") or "").strip()
    if not title or not description or not requirements:
        return jsonify({"error": "title, description and requirements are required"}), 400
    job = Job(title=title, description=description, requirements=requirements)
    db.session.add(job)
    db.session.commit()
    return jsonify(_job_to_dict(job)), 201


@jobs_bp.get("/jobs")
def list_jobs():
    jobs = Job.query.order_by(Job.created_at.desc()).all()
    return jsonify([_job_to_dict(j) for j in jobs]), 200


@jobs_bp.get("/jobs/<job_id>")
def get_job(job_id):
    job = db.session.get(Job, job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    return jsonify(_job_to_dict(job)), 200


@jobs_bp.delete("/jobs/<job_id>")
def delete_job(job_id):
    job = db.session.get(Job, job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    Candidate.query.filter_by(job_id=job_id).delete()
    db.session.delete(job)
    db.session.commit()
    return "", 204
