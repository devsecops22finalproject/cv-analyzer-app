import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createJob,
  deleteJob,
  listCandidates,
  listJobs,
} from "../api/client.js";
import { Empty, LoadingRows, formatDate, reqChips } from "../components/ui.jsx";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [form, setForm] = useState({ title: "", description: "", requirements: "" });
  const [formErrors, setFormErrors] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs();
      setJobs(Array.isArray(data) ? data : []);
      // Fetch candidate counts in background (best-effort)
      Promise.all(
        (Array.isArray(data) ? data : []).map((j) =>
          listCandidates(j.id)
            .then((c) => [j.id, Array.isArray(c) ? c.length : 0])
            .catch(() => [j.id, 0])
        )
      ).then((pairs) => setCounts(Object.fromEntries(pairs)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = jobs.filter(
      (j) =>
        !q ||
        j.title?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.requirements?.toLowerCase().includes(q)
    );
    rows = [...rows].sort((a, b) => {
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      // newest first
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
    return rows;
  }, [jobs, query, sort]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.requirements.trim()) errs.requirements = "Requirements are required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!validate()) return;
    setSaving(true);
    try {
      const created = await createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim(),
      });
      setForm({ title: "", description: "", requirements: "" });
      setFormErrors({});
      setNotice(`Job “${created.title}” created.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (job) => {
    if (!window.confirm(`Delete “${job.title}”? This also removes its candidates.`))
      return;
    try {
      await deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      setNotice(`Deleted “${job.title}”.`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Hiring pipeline</div>
          <h1>Jobs</h1>
          <p className="sub">
            Post a role, upload CVs, and let AI rank candidates by skills,
            experience and education.
          </p>
        </div>
        <div className="row">
          <span className="chip chip-primary">
            {jobs.length} job{jobs.length === 1 ? "" : "s"}
          </span>
          <span className="chip">
            {Object.values(counts).reduce((a, b) => a + (b || 0), 0)} candidates
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error} — is the backend running at{" "}
          <span className="mono">http://localhost:5000</span>?{" "}
          <button className="btn btn-sm btn-secondary" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="grid-2">
        <section>
          <div className="toolbar">
            <div className="search">
              <span className="icon">⌕</span>
              <input
                className="input"
                placeholder="Search jobs…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="select"
              style={{ width: "auto" }}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort jobs"
            >
              <option value="newest">Newest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          {loading ? (
            <LoadingRows n={4} />
          ) : filtered.length === 0 ? (
            <Empty
              title={jobs.length === 0 ? "No jobs yet" : "No matches"}
              body={
                jobs.length === 0
                  ? "Create your first role with the form on the right."
                  : "Try a different search term."
              }
            />
          ) : (
            <div className="grid-jobs">
              {filtered.map((j) => (
                <article key={j.id} className="card job-card">
                  <h3>
                    <Link to={`/jobs/${j.id}`}>{j.title}</Link>
                  </h3>
                  <div className="job-meta">
                    <span>📅 {formatDate(j.created_at)}</span>
                    <span>
                      👥 {counts[j.id] ?? "…"} candidate
                      {(counts[j.id] ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="clamp-2" style={{ margin: 0 }}>
                    {j.description}
                  </p>
                  <div className="tag-list">
                    {reqChips(j.requirements).map((r) => (
                      <span key={r} className="chip">
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="row" style={{ marginTop: "auto" }}>
                    <Link
                      className="btn btn-primary btn-sm"
                      to={`/jobs/${j.id}`}
                    >
                      Open →
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onDelete(j)}
                      title="Delete job"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="card card-pad" style={{ position: "sticky", top: 76 }}>
          <h2 style={{ fontSize: 18 }}>+ New job</h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            Be specific in requirements — the AI scores against them.
          </p>
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                className="input"
                placeholder="e.g. Senior Backend Engineer"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              {formErrors.title && (
                <span className="hint" style={{ color: "var(--danger)" }}>
                  {formErrors.title}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="desc">Description</label>
              <textarea
                id="desc"
                className="textarea"
                placeholder="Team, mission, stack, location…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              {formErrors.description && (
                <span className="hint" style={{ color: "var(--danger)" }}>
                  {formErrors.description}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="reqs">Requirements</label>
              <textarea
                id="reqs"
                className="textarea"
                placeholder="Python, 5y experience, AWS, CS degree… (comma separated helps)"
                value={form.requirements}
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value })
                }
              />
              {formErrors.requirements && (
                <span className="hint" style={{ color: "var(--danger)" }}>
                  {formErrors.requirements}
                </span>
              )}
              <span className="hint">
                {form.requirements.length}/2000 · comma-separated skills rank best
              </span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" /> Creating…
                </>
              ) : (
                "Create job"
              )}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
