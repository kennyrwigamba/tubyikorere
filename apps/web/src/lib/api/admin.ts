import { api } from "@/lib/api";
import type { Role } from "@/lib/constants";

export type AdminDashboard = {
  counts: {
    provinces: number;
    districts: number;
    sectors: number;
    cells: number;
    villages: number;
    users: number;
  };
  recent_activity: AdminActivityEntry[];
};

export type AdminActivityEntry = {
  id: string;
  timestamp: string;
  action: string;
  actor_role: string;
  actor_name: string;
  entity: string;
  detail: string;
};

export type AdminUser = {
  id: string;
  name: string;
  role: Role;
  entity_name: string;
  phone: string;
  status: "active";
};

export type HierarchyVillage = {
  id: string;
  cellId: string;
  name: string;
  nameKinyarwanda: string;
  coordinatorName: string | null;
  coordinatorPhone: string | null;
  pin: string | null;
  pin_masked: string | null;
  isFirstLogin: boolean;
  createdAt: string;
};

export type HierarchyCell = {
  id: string;
  sectorId: string;
  name: string;
  nameKinyarwanda: string;
  executiveName: string;
  executivePhone: string;
  pin: string;
  pin_masked: string;
  isFirstLogin: boolean;
  createdAt: string;
  villages: HierarchyVillage[];
};

export type HierarchySector = {
  id: string;
  districtId: string;
  name: string;
  nameKinyarwanda: string;
  code: string;
  officialName: string | null;
  officialPhone: string | null;
  pin: string | null;
  pin_masked: string | null;
  isFirstLogin: boolean;
  cells: HierarchyCell[];
};

export type HierarchyDistrict = {
  id: string;
  provinceId: string;
  name: string;
  nameKinyarwanda: string;
  code: string;
  sectors: HierarchySector[];
};

export type HierarchyProvince = {
  id: string;
  name: string;
  nameKinyarwanda: string;
  code: string;
  districts: HierarchyDistrict[];
};

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboard>("/api/admin/dashboard");
  return data;
}

export async function fetchAdminHierarchy(): Promise<HierarchyProvince[]> {
  const { data } = await api.get<HierarchyProvince[]>("/api/admin/hierarchy");
  return data;
}

export async function fetchAdminUsers(role?: Role | "all"): Promise<AdminUser[]> {
  const { data } = await api.get<AdminUser[]>("/api/admin/users", {
    params: role && role !== "all" ? { role } : undefined,
  });
  return data;
}

export async function fetchAdminActivity(params?: {
  limit?: number;
  role?: string;
}): Promise<AdminActivityEntry[]> {
  const { data } = await api.get<AdminActivityEntry[]>("/api/admin/activity", { params });
  return data;
}

export async function updateAdminCell(
  id: string,
  payload: Partial<{
    name: string;
    name_kinyarwanda: string;
    executive_name: string;
    executive_phone: string;
    pin: string;
  }>,
) {
  const { data } = await api.patch(`/api/admin/cells/${id}`, payload);
  return data;
}

export async function updateAdminVillage(
  id: string,
  payload: Partial<{
    name: string;
    name_kinyarwanda: string;
    coordinator_name: string;
    coordinator_phone: string;
    pin: string;
  }>,
) {
  const { data } = await api.patch(`/api/admin/villages/${id}`, payload);
  return data;
}

export async function updateAdminSector(
  id: string,
  payload: Partial<{
    name: string;
    name_kinyarwanda: string;
    code: string;
    official_name: string;
    official_phone: string;
    pin: string;
  }>,
) {
  const { data } = await api.patch(`/api/admin/sectors/${id}`, payload);
  return data;
}

export async function updateAdminDistrict(
  id: string,
  payload: Partial<{ name: string; name_kinyarwanda: string; code: string }>,
) {
  const { data } = await api.patch(`/api/admin/districts/${id}`, payload);
  return data;
}

export async function updateAdminProvince(
  id: string,
  payload: Partial<{ name: string; name_kinyarwanda: string; code: string }>,
) {
  const { data } = await api.patch(`/api/admin/provinces/${id}`, payload);
  return data;
}
