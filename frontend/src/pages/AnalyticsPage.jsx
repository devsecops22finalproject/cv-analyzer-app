import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getJobAnalytics,
  getOverview,
  listCandidates,
  listJobs,
} from "../api/client.js";
import { Empty, LoadingRows, Stat } from "../components/ui.jsx";

const BUCKETS = ["0–19", "20–39", "40–59", "60–79", "80–100"];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [perJob, setPerJob] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const ov = await getOverview();
      setOverview(ov);
      const jobs = await listJobs().catch(() => []);
      const rows = await Promise.all(
        (Array.isArray(jobs) ? jobs : []).map(async (j) => {
          const [cands, stats] = await Promise.all([
            listCandidates(j.id).catch(() => []),
            getJobAnalytics(j.id).catch(() => null),
          ]);
          return { job: j, stats, count: Array.isArray(cands) ? cands.length : 0, cands: Array.isArray(cands) ? cands : [] };
        })
      );
      setPerJob(rows);
      setScores(rows.flatMap((r) => r.cands.map((c) => c.score ?? 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    scores.forEach((s) => {
      const v = Number(s) || 0;
      const idx = v >= 80 ? 4 : v >= 60 ? 3 : v >= 40 ? 2 : v >= 20 ? 1 : 0;
      counts[idx] += 1;
    });
    const max = Math.max(1, ...counts);
    return counts.map((c, i) => ({ label: BUCKETS[i], count: c, pct: (c / max) * 100 }));
  }, [scores]);

  const topJobs = useMemo(
    () => [...perJob].sort((a, b) => (b.stats?.average_score ?? 0) - (a.stats?.average_score ?? 0)).slice(0, 5),
    [perJob]
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Insights</div>
          <h1>Analytics</h1>
          <p className="sub">Pipeline health, score distribution and per-role breakdown.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingRows n={4} />
      ) : !overview ? (
        <Empty title="No data" body="Could not load analytics." />
      ) : (
        <>
          <div className="grid-stats">
            <Stat label="Total jobs" value={overview.total_jobs} hint="roles posted" />
            <Stat label="Total candidates" value={overview.total_candidates} hint="CVs scored" />
            <Stat label="Average score" value={overview.average_score} hint="0–100 scale" />
            <Stat
              label="Avg processing"
              value={`${overview.avg_processing_time_ms} ms`}
              hint="per CV"
            />
            <Stat
              label="AI failures"
              value={overview.ai_failures}
              hint={overview.ai_failures > 0 ? "needs attention" : "all healthy"}
            />
          </div>

          <div className="grid-2">
            <div className="card card-pad">
              <h3>Score distribution</h3>
              <p className="muted small" style={{ marginTop: 0 }}>
                {scores.length} scored candidate{scores.length === 1 ? "" : "s"} across all jobs.
              </p>
              {scores.length === 0 ? (
                <Empty title="No scores yet" body="Upload a CV to see the distribution." />
              ) : (
                <div className="hist">
                  {hist.map((b) => (
                    <div key={b.label} className="hist-bar">
                      <span className="hist-count">{b.count}</span>
                      <div className="hist-col" style={{ height: `${Math.max(4, b.pct * 1.1)}px` }} />
                      <span className="hist-label">{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card card-pad">
              <h3>Top roles by avg score</h3>
              {topJobs.length === 0 ? (
                <p className="muted small">No jobs yet.</p>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  {topJobs.map(({ job, stats }) => (
                    <div key={job.id} className="row" style={{ justifyContent: "space-between" }}>
                      <Link to={`/jobs/${job.id}`} style={{ fontWeight: 700, color: "var(--text)" }}>
                        {job.title}
                      </Link>
                      <span className="chip chip-primary">
                        avg {stats?.average_score ?? "—"} · {stats?.candidate_count ?? 0} cands
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h2 style={{ margin: "22px 0 10px", fontSize: 18 }}>Per-job breakdown</h2>
          {perJob.length === 0 ? (
            <Empty title="No jobs" body="Create a job to start tracking." />
          ) : (
            <div className="table-wrap">
              <table className="cands">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Candidates</th>
                    <th>Avg</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Avg time</th>
                  </tr>
                </thead>
                <tbody>
                  {perJob.map(({ job, stats }) => (
                    <tr key={job.id}>
                      <td>
                        <Link to={`/jobs/${job.id}`} style={{ fontWeight: 700, color: "var(--text)" }}>
                          {job.title}
                        </Link>
                      </td>
                      <td>{stats?.candidate_count ?? 0}</td>
                      <td><strong>{stats?.average_score ?? "—"}</strong></td>
                      <td>{stats?.min_score ?? "—"}</td>
                      <td>{stats?.max_score ?? "—"}</td>
                      <td className="muted">{stats?.avg_processing_time_ms ?? "—"} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
