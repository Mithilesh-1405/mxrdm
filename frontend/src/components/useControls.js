import { useLocation, useNavigate } from "react-router-dom";

export function useControls(meta) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const date = params.get("date") || meta?.delivery_dates?.[14] || "2026-01-15";
  const cutoff = params.get("cutoff") || meta?.default_cutoff || "09:00";

  const update = (key, value) => {
    const next = new URLSearchParams(location.search);
    next.set(key, String(value));
    const search = `?${next.toString().replace(/%3A/g, ":")}`;
    navigate({ pathname: location.pathname, search });
  };

  return {
    date,
    cutoff,
    setDate: (value) => update("date", value),
    setCutoff: (value) => update("cutoff", value),
  };
}
