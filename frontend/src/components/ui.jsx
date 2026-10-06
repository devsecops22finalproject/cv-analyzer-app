import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { getHealth, apiBase } from "../api/client.js";

export function Layout({ children }) {
  const [online, setOnline] = useState(null);
  useEffect(() => {
    let alive = true;
    getHealth()
      .then(() => alive && setOnline(true))
      .catch(() => alive && setOnline(false));
    const t = setInterval(() => {
      getHealth()
        .then(() => alive && setOnline(true))
        .catch(() => alive && setOnline(false));
    }, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">AI</span>
            <span>
              Job Screener
              <small>Rank CVs in seconds</small>
            </span>
          </Link>
          <nav className="nav-links">
            <span
              className={`api-dot ${online === false ? "offline" : ""}`}
              title={apiBase}
            >
              <span className="pulse" />
              {online === null
                ? "checking API…"
                : online
                  ? "API connected"
                  : "API offline"}
            </span>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Jobs
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Analytics
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container">{children}</main>
      <footer className="footer">
        <div className="footer-inner">
          <span>AI Job Screener · mock AI when no API key</span>
          <span className="mono">{apiBase}</span>
        </div>
      </footer>
    </div>
  );
}

export function ScoreBadge({ score }) {
  const s = Number(score ?? 0);
  const cls = s >= 75 ? "pill-high" : s >= 50 ? "pill-mid" : "pill-low";
  const bar = s >= 75 ? "score-high" : s >= 50 ? "score-mid" : "score-low";
  return (
    <span className="score">
      <span className={`score-bar ${bar}`}>
        <i style={{ width: `${Math.max(0, Math.min(100, s))}%` }} />
      </span>
      <span className={`score-pill ${cls}`}>{s}</span>
    </span>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="hint muted small">{hint}</div>}
    </div>
  );
}

export function Empty({ title, body, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <div className="small">{body}</div>
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

export function LoadingRows({ n = 3 }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 64 }} />
      ))}
    </div>
  );
}

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function reqChips(text) {
  if (!text) return [];
  return text
    .split(/[,;\n•\-]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}
