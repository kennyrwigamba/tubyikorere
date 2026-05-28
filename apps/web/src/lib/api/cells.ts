import { api } from "@/lib/api";

export type CellProfile = {
  cell: {
    id: string;
    name: string;
    executive_name: string;
    executive_phone: string;
  };
  sector: { name: string };
  district: { name: string };
  province: { name: string };
  villages: Array<{
    id: string;
    name: string;
    coordinator_name: string | null;
  }>;
};

export async function fetchCellProfile(): Promise<CellProfile> {
  const { data } = await api.get<CellProfile>("/api/cells/profile");
  return data;
}
