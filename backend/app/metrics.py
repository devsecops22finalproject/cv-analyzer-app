from flask import Blueprint, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Histogram,
    generate_latest,
)

metrics_bp = Blueprint("metrics", __name__)

screening_requests_total = Counter(
    "screening_requests_total", "CV screenings", labelnames=["job_id"]
)
ai_failures_total = Counter("ai_failures_total", "AI failures")
screening_duration_seconds = Histogram(
    "screening_duration_seconds", "Scoring latency"
)


@metrics_bp.get("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
