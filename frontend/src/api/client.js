const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const listJobs = () => req("/jobs");
export const createJob = (payload) =>
  req("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
export const getJob = (id) => req(`/jobs/${id}`);
export const deleteJob = (id) => req(`/jobs/${id}`, { method: "DELETE" });

export const listCandidates = (jobId) => req(`/jobs/${jobId}/candidates`);
export const uploadCandidate = (jobId, { name, email, file }) => {
  const form = new FormData();
  form.append("name", name);
  form.append("email", email);
  form.append("file", file);
  return req(`/jobs/${jobId}/candidates`, { method: "POST", body: form });
};
export const getCandidate = (id) => req(`/candidates/${id}`);
export const rescoreCandidate = (id) =>
  req(`/candidates/${id}/rescore`, { method: "POST" });

export const getJobAnalytics = (jobId) => req(`/jobs/${jobId}/analytics`);
export const getOverview = () => req("/analytics/overview");
export const getHealth = async () => {
  const res = await fetch(`${BASE}/health`).catch(() => null);
  if (!res || !res.ok) throw new Error("offline");
  return res.json().catch(() => ({}));
};

export const apiBase = BASE;
