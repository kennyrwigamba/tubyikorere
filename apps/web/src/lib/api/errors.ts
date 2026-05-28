import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (typeof data?.error === "string") return data.error;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
