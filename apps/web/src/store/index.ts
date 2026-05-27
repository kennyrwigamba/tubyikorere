import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/constants";

type AuthState = {
  isAuthenticated: boolean;
  role: Role | null;
  userId: string;
  userName: string;
  entityName: string;
  entityId: string;
  isFirstLogin: boolean;
  setAuth: (
    next: Partial<
      Pick<
        AuthState,
        | "isAuthenticated"
        | "role"
        | "userId"
        | "userName"
        | "entityName"
        | "entityId"
        | "isFirstLogin"
      >
    >,
  ) => void;
  logout: () => void;
};

export const useAppStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      userId: "",
      userName: "",
      entityName: "",
      entityId: "",
      isFirstLogin: false,
      setAuth: (next) => set((state) => ({ ...state, ...next })),
      logout: () =>
        set({
          isAuthenticated: false,
          role: null,
          userId: "",
          userName: "",
          entityName: "",
          entityId: "",
          isFirstLogin: false,
        }),
    }),
    {
      name: "tubikorere-auth",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        userId: state.userId,
        userName: state.userName,
        entityName: state.entityName,
        entityId: state.entityId,
        isFirstLogin: state.isFirstLogin,
      }),
    },
  ),
);
