import { api } from "@/lib/api";

export type LocationOption = {
  id: string;
  name: string;
  name_kinyarwanda: string | null;
};

export function formatLocationLabel(option: LocationOption) {
  return option.name_kinyarwanda
    ? `${option.name} / ${option.name_kinyarwanda}`
    : option.name;
}

export async function fetchProvinces() {
  const { data } = await api.get<LocationOption[]>("/api/locations/provinces");
  return data;
}

export async function fetchDistricts(provinceId: string) {
  const { data } = await api.get<LocationOption[]>("/api/locations/districts", {
    params: { province_id: provinceId },
  });
  return data;
}

export async function fetchSectors(districtId: string) {
  const { data } = await api.get<LocationOption[]>("/api/locations/sectors", {
    params: { district_id: districtId },
  });
  return data;
}

export async function fetchCells(sectorId: string) {
  const { data } = await api.get<LocationOption[]>("/api/locations/cells", {
    params: { sector_id: sectorId },
  });
  return data;
}

export async function fetchLocationVillages(cellId: string) {
  const { data } = await api.get<LocationOption[]>("/api/locations/villages", {
    params: { cell_id: cellId },
  });
  return data;
}
