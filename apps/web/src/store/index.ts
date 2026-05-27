import { create } from "zustand";
import type { Role } from "@/lib/constants";

type AuthState = {
  isAuthenticated: boolean;
  role: Role;
  userName: string;
  setAuth: (next: Partial<Pick<AuthState, "isAuthenticated" | "role" | "userName">>) => void;
};

export const useAppStore = create<AuthState>((set) => ({
  isAuthenticated: true,
  role: "cell_executive",
  userName: "Uwimana Jean Pierre",
  setAuth: (next) => set((state) => ({ ...state, ...next })),
}));
