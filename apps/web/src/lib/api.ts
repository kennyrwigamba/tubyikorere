import axios from "axios";

import { useAppStore } from "@/store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});

const ADMIN_API_TOKEN =
  import.meta.env.VITE_ADMIN_API_TOKEN ?? "tubikorere-dev-admin";

api.interceptors.request.use((config) => {
  const { isAuthenticated, role, entityId } = useAppStore.getState();
  if (!isAuthenticated) return config;

  if (role === "admin") {
    config.headers.set("x-admin-token", ADMIN_API_TOKEN);
    return config;
  }

  if (entityId) {
    if (role === "sector_official") {
      config.headers.set("x-sector-id", entityId);
    } else {
      config.headers.set("x-cell-id", entityId);
    }
  }
  return config;
});
