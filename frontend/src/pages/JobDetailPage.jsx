import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getJob,
  getJobAnalytics,
  listCandidates,
  rescoreCandidate,
  uploadCandidate,
} from "../api/client.js";
import {
  Empty,
  LoadingRows,
  ScoreBadge,
  Stat,
  formatDate,
  reqChips,
} from "../components/ui.jsx";

const ACCEPT = ".pdf,.docx,.txt";
const MAX_BYTES = 5 * 1024 * 1024;

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [rescoringId, setRescoringId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [j, c, s] = await Promise.all([
        getJob(id),
        listCandidates(id).catch(() => []),
        getJobAnalytics(id).catch(() => null),
      ]);
      setJob(j);
      setCandidates(Array.isArray(c) ? c : []);
      setStats(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => (c.score ?? 0) >= minScore)
      .filter(
        (c) =>
          !q ||
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          (c.strengths || []).join(" ").toLowerCase().includes(q)
      );
  }, [candidates, query, minScore]);

  const pickFile = (f) => {
    if (!f) return;
    const okExt = /\.(pdf|docx|txt)$/i.test(f.name);
    if (!okExt) {
      setError("Only PDF, DOCX or TXT files are accepted.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File too large — max 5 MB.");
      return;
    }
    setError("");
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.name.trim()) {
      setError("Candidate name is required.");
      return;
    }
    if (!file) {
      setError("Please attach a CV file.");
      return;
    }
    setUploading(true);
    try {
      const created = await uploadCandidate(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        file,
      });
      setForm({ name: "", email: "" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setNotice(`Scored ${created.name} at ${created.score}/100.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const onRescore = async (c) => {
    setRescoringId(c.id);
    setError("");
    try {
      const updated = await rescoreCandidate(c.id);
      setCandidates((prev) =>
        [...prev.map((x) => (x.id === c.id ? updated : x))].sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0)
        )
      );
      setNotice(`Rescored ${updated.name}: ${updated.score}/100.`);
      getJobAnalytics(id)
        .then(setStats)
        .catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setRescoringId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <Link to="/">← Back to jobs</Link>
        <div style={{ marginTop: 16 }}>
          <LoadingRows n={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/">← Back to jobs</Link>
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
      {notice && (
        <div className="alert alert-success" role="status" style={{ marginTop: 12 }}>
          {notice}
        </div>
      )}

      <div className="page-head" style={{ marginTop: 12 }}>
        <div>
          <div className="eyebrow">Job detail</div>
          <h1>{job ? job.title : "Job"}</h1>
          <p className="sub muted small">
            Created {formatDate(job?.created_at)} · ID{" "}
            <span className="mono">{job?.id}</span>
          </p>
        </div>
      </div>

      <div className="grid-stats">
        <Stat
          label="Candidates"
          value={stats?.candidate_count ?? candidates.length}
          hint={`${filtered.length} shown`}
        />
        <Stat label="Avg score" value={stats?.average_score ?? "—"} hint="0–100 scale" />
        <Stat
          label="Range"
          value={
            stats ? `${stats.min_score}–${stats.max_score}` : "—"
          }
          hint="min – max"
        />
        <Stat
          label="Avg scoring time"
          value={`${stats?.avg_processing_time_ms ?? "—"} ms`}
          hint="AI latency"
        />
      </div>

      <div className="grid-2">
        <section>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <h3 style={{ marginBottom: 6 }}>About this role</h3>
            <p style={{ margin: "0 0 10px", whiteSpace: "pre-wrap" }}>
              {job?.description}
            </p>
            <div className="tag-list">
              {reqChips(job?.requirements).map((r) => (
                <span key={r} className="chip chip-primary">
                  {r}
                </span>
              ))}
            </div>
            {job?.requirements && (
              <details style={{ marginTop: 10 }}>
                <summary className="small muted" style={{ cursor: "pointer" }}>
                  Full requirements text
                </summary>
                <p className="small" style={{ whiteSpace: "pre-wrap" }}>
                  {job.requirements}
                </p>
              </details>
            )}
          </div>

          <div className="toolbar">
            <h2 style={{ margin: 0, fontSize: 18 }}>
              Ranked candidates ({filtered.length})
            </h2>
            <div className="row">
              <div className="search">
                <span className="icon">⌕</span>
                <input
                  className="input"
                  placeholder="Search name, email, skill…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                className="select"
                style={{ width: "auto" }}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                aria-label="Minimum score"
              >
                <option value={0}>All scores</option>
                <option value={50}>50+ only</option>
                <option value={70}>70+ only</option>
                <option value={85}>85+ only</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Empty
              title={candidates.length === 0 ? "No candidates yet" : "No candidates match"}
              body={
                candidates.length === 0
                  ? "Upload the first CV with the form on the right."
                  : "Lower the minimum score or clear the search."
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="cands">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Candidate</th>
                    <th>Score</th>
                    <th>Highlights</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => {
                    const expanded = expandedId === c.id;
                    return (
                      <Fragment key={c.id}>
                        <tr
                          className={expanded ? "expanded" : ""}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setExpandedId(expanded ? null : c.id)
                          }
                          title="Click to expand"
                        >
                          <td>
                            <span
                              className={`rank ${idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : ""}`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td>
                            <div className="cand-name">{c.name || "—"}</div>
                            <div className="cand-email">{c.email || "—"}</div>
                            <div className="muted small mono">
                              {c.cv_filename} · {c.processing_time_ms ?? 0} ms
                            </div>
                          </td>
                          <td>
                            <ScoreBadge score={c.score} />
                          </td>
                          <td>
                            <div className="tag-list">
                              {(c.strengths || []).slice(0, 3).map((s) => (
                                <span key={s} className="tag">
                                  {s}
                                </span>
                              ))}
                              {(c.missing_skills || []).slice(0, 2).map((s) => (
                                <span key={s} className="tag miss">
                                  ✕ {s}
                                </span>
                              ))}
                            </div>
                            <div className="reco" style={{ marginTop: 6 }}>
                              {c.recommendation?.slice(0, 140)}
                              {c.recommendation?.length > 140 ? "…" : ""}
                            </div>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={rescoringId === c.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRescore(c);
                              }}
                            >
                              {rescoringId === c.id ? "…" : "↻ Rescore"}
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="expanded">
                            <td colSpan={5}>
                              <div className="detail-panel">
                                <dl className="kv">
                                  <dt>Recommendation</dt>
                                  <dd>{c.recommendation || "—"}</dd>
                                  <dt>Strengths</dt>
                                  <dd>
                                    {(c.strengths || []).length ? (
                                      <div className="tag-list">
                                        {c.strengths.map((s) => (
                                          <span key={s} className="tag">
                                            ✓ {s}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      "—"
                                    )}
                                  </dd>
                                  <dt>Missing skills</dt>
                                  <dd>
                                    {(c.missing_skills || []).length ? (
                                      <div className="tag-list">
                                        {c.missing_skills.map((s) => (
                                          <span key={s} className="tag miss">
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      "None flagged"
                                    )}
                                  </dd>
                                  <dt>Scored</dt>
                                  <dd className="muted small">
                                    {formatDate(c.created_at)} ·{" "}
                                    {c.processing_time_ms ?? 0} ms ·{" "}
                                    <span className="mono">{c.id}</span>
                                  </dd>
                                </dl>
                                <details>
                                  <summary
                                    className="small"
                                    style={{ cursor: "pointer", fontWeight: 700 }}
                                  >
                                    View extracted CV text
                                  </summary>
                                  <div className="cv-text" style={{ marginTop: 8 }}>
                                    {c.cv_text || "—"}
                                  </div>
                                </details>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted small" style={{ marginTop: 10 }}>
            Tip: click a row to expand full AI feedback. Candidates are auto-sorted
            by score (highest first).
          </p>
        </section>

        <aside className="card card-pad" style={{ position: "sticky", top: 76 }}>
          <h3>Upload CV</h3>
          <p className="muted small" style={{ marginTop: 0 }}>
            PDF, DOCX or TXT · max 5 MB · scored instantly.
          </p>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="cname">Name</label>
              <input
                id="cname"
                className="input"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cemail">Email</label>
              <input
                id="cemail"
                className="input"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>CV file</label>
              <div
                className={`dropzone ${drag ? "drag" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => pickFile(e.target.files[0])}
                />
                {file ? (
                  <div>
                    📄 <strong>{file.name}</strong>
                    <div className="muted small">
                      {(file.size / 1024).toFixed(1)} KB · click to replace
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong>Drop CV here or click to browse</strong>
                    <div className="muted small">{ACCEPT} · up to 5 MB</div>
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              type="submit"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner" /> Scoring…
                </>
              ) : (
                "Upload & score"
              )}
            </button>
          </form>
          <div className="divider" />
          <div className="small muted">
            <strong style={{ color: "var(--text)" }}>How scoring works</strong>
            <br />
            Skills 50% · Experience 30% · Education 20%. Scores are 0–100 with
            AI-generated strengths, gaps and recommendation.
          </div>
        </aside>
      </div>
    </div>
  );
}
