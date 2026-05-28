export function normalizeApiBaseUrl(rawUrl?: string) {
  const fallback = "http://localhost:3001";
  const trimmed = (rawUrl ?? fallback).trim().replace(/\/$/, "");
  return trimmed.replace(/\/api$/i, "");
}

function extractMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (typeof record.error === "object" && record.error !== null) {
      return extractMessage(record.error);
    }
  }
  return null;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response;
    const fromBody = extractMessage(response?.data);
    if (fromBody) return fromBody;
    if (response?.status === 404) {
      return "API route not found. Check VITE_API_URL on Vercel (no /api suffix).";
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
