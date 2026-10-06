# AI Job Screener — App

## Local run

```bash
cd app
docker compose up --build
```

Backend: http://localhost:5000 · Frontend: http://localhost:3000

## Tests

```bash
cd backend
MOCK_AI=1 pytest -q
```

## Env

| Key | Default | Purpose |
| --- | ------- | ------- |
| `DATABASE_URL` | `sqlite:///screener.db` | Postgres in compose/K8s |
| `MUSE_SPARK_API_KEY` | _(empty → mock)_ | Real AI scoring |
| `MUSE_SPARK_BASE_URL` | `https://opencode.ai/zen/go/v1` | AI endpoint (Go subscription) |
| `AI_MODEL` | `muse-spark-1.3-contributor` | Model name |
| `AI_API` | `responses` | `responses` (Muse Spark) or `chat` (chat/completions models) |
| `MIN_SCORE` | `0` | Minimum display floor |
| `MAX_CV_SIZE` | `5242880` | Upload cap bytes |
| `SCORING_WEIGHTS` | `skills:0.5,experience:0.3,education:0.2` | Documented weights |
| `MOCK_AI` | `1` in compose | Force deterministic mock scorer |

## API

- `POST /api/jobs` `{title,description,requirements}` → 201
- `GET /api/jobs`, `GET /api/jobs/<id>`, `DELETE /api/jobs/<id>`
- `POST /api/jobs/<id>/candidates` (multipart `name,email,file`) → 201
- `GET /api/jobs/<id>/candidates?sort=rank` (ranked)
- `GET /api/candidates/<id>`, `POST /api/candidates/<id>/rescore`
- `GET /api/jobs/<id>/analytics`, `GET /api/analytics/overview`
- `GET /health`, `GET /metrics`
