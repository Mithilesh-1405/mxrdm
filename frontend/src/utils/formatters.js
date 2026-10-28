export const formatNumber = (value, digits = 0) =>
  value == null || !Number.isFinite(Number(value))
    ? "Unavailable"
    : new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(
        value,
      );
export const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
export const formatTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Unavailable";
