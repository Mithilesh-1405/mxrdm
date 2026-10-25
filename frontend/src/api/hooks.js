import { useQuery } from "@tanstack/react-query";
import * as api from "./client";

const options = { staleTime: 300000, retry: 1 };
export const useMeta = () =>
  useQuery({ queryKey: ["meta"], queryFn: api.getMeta, ...options });
export const useDecisionView = (date, cutoff) =>
  useQuery({
    queryKey: ["decision", date, cutoff],
    queryFn: () => api.getDecisionView(date, cutoff),
    enabled: Boolean(date && cutoff),
    ...options,
  });
export const useAccuracySummary = (cutoff) =>
  useQuery({
    queryKey: ["accuracy-summary", cutoff],
    queryFn: () => api.getAccuracySummary(cutoff),
    enabled: Boolean(cutoff),
    ...options,
  });
export const useDailyAccuracy = (cutoff) =>
  useQuery({
    queryKey: ["accuracy-daily", cutoff],
    queryFn: () => api.getDailyAccuracy(cutoff),
    enabled: Boolean(cutoff),
    ...options,
  });
export const useHorizonAccuracy = (cutoff) =>
  useQuery({
    queryKey: ["accuracy-horizon", cutoff],
    queryFn: () => api.getHorizonAccuracy(cutoff),
    enabled: Boolean(cutoff),
    ...options,
  });
export const useErrorDistribution = (cutoff) =>
  useQuery({
    queryKey: ["accuracy-distribution", cutoff],
    queryFn: () => api.getErrorDistribution(cutoff),
    enabled: Boolean(cutoff),
    ...options,
  });
