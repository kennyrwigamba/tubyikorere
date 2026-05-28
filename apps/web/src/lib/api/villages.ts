import { api } from "@/lib/api";

export type VillageOption = {
  id: string;
  name: string;
  name_kinyarwanda: string;
  cell_id: string;
  coordinator_name: string | null;
};

export async function fetchCellVillages(cellId: string): Promise<VillageOption[]> {
  const { data } = await api.get<VillageOption[]>("/api/villages", {
    params: { cell_id: cellId },
  });
  return data;
}
