const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      payload?.error?.message ||
        `Request failed with status ${response.status}`,
    );
  return payload;
}
const query = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ).toString();
export const getMeta = () => request("/api/v1/meta");
export const getDecisionView = (deliveryDate, cutoff) =>
  request(
    `/api/v1/forecast/decision-view?${query({ delivery_date: deliveryDate, cutoff })}`,
  );
export const getAccuracySummary = (
  cutoff,
  start = "2026-01-01",
  end = "2026-01-31",
) => request(`/api/v1/accuracy/summary?${query({ cutoff, start, end })}`);
export const getDailyAccuracy = (cutoff) =>
  request(`/api/v1/accuracy/daily?${query({ cutoff })}`);
export const getHorizonAccuracy = (cutoff) =>
  request(`/api/v1/accuracy/by-horizon?${query({ cutoff })}`);
export const getErrorDistribution = (cutoff) =>
  request(`/api/v1/accuracy/error-distribution?${query({ cutoff })}`);
