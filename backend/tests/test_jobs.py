import os

import pytest

os.environ["MOCK_AI"] = "1"

from app import create_app  # noqa: E402
from app.models import db  # noqa: E402


@pytest.fixture()
def client(tmp_path):
    db_file = tmp_path / "test.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_file}"
    app = create_app("testing")
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c
    with app.app_context():
        db.session.remove()


def test_job_crud_round_trip(client):
    r = client.post(
        "/api/jobs",
        json={"title": "Dev", "description": "d", "requirements": "python"},
    )
    assert r.status_code == 201
    job_id = r.get_json()["id"]

    r = client.get("/api/jobs")
    assert r.status_code == 200
    assert any(j["id"] == job_id for j in r.get_json())

    r = client.get(f"/api/jobs/{job_id}")
    assert r.status_code == 200

    r = client.delete(f"/api/jobs/{job_id}")
    assert r.status_code == 204

    r = client.get(f"/api/jobs/{job_id}")
    assert r.status_code == 404


def test_create_job_missing_title_400(client):
    r = client.post(
        "/api/jobs", json={"description": "d", "requirements": "python"}
    )
    assert r.status_code == 400


def test_get_unknown_job_404(client):
    r = client.get("/api/jobs/does-not-exist")
    assert r.status_code == 404
    assert r.get_json()["error"] == "job not found"
