import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, KeyRoundIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAdminHierarchy,
  updateAdminCell,
  updateAdminDistrict,
  updateAdminProvince,
  updateAdminSector,
  updateAdminVillage,
  type HierarchyCell,
  type HierarchyDistrict,
  type HierarchyProvince,
  type HierarchySector,
  type HierarchyVillage,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/errors";

type SelectedEntity =
  | { level: "province"; data: HierarchyProvince }
  | { level: "district"; data: HierarchyDistrict }
  | { level: "sector"; data: HierarchySector }
  | { level: "cell"; data: HierarchyCell }
  | { level: "village"; data: HierarchyVillage };

export default function AdminHierarchyRoute() {
  const queryClient = useQueryClient();
  const [provinceId, setProvinceId] = useState<string>("");
  const [districtId, setDistrictId] = useState<string>("");
  const [sectorId, setSectorId] = useState<string>("");
  const [cellId, setCellId] = useState<string>("");
  const [villageId, setVillageId] = useState<string>("");
  const [newPin, setNewPin] = useState("");

  const { data: tree = [], isLoading, error } = useQuery({
    queryKey: ["admin-hierarchy"],
    queryFn: fetchAdminHierarchy,
  });

  const province = tree.find((row) => row.id === provinceId);
  const district = province?.districts.find((row) => row.id === districtId);
  const sector = district?.sectors.find((row) => row.id === sectorId);
  const cell = sector?.cells.find((row) => row.id === cellId);
  const village = cell?.villages.find((row) => row.id === villageId);

  const selected: SelectedEntity | null = useMemo(() => {
    if (village) return { level: "village", data: village };
    if (cell) return { level: "cell", data: cell };
    if (sector) return { level: "sector", data: sector };
    if (district) return { level: "district", data: district };
    if (province) return { level: "province", data: province };
    return null;
  }, [province, district, sector, cell, village]);

  const saveMutation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!selected) return;
      const payload = Object.fromEntries(form.entries()) as Record<string, string>;

      switch (selected.level) {
        case "province":
          return updateAdminProvince(selected.data.id, payload);
        case "district":
          return updateAdminDistrict(selected.data.id, payload);
        case "sector":
          return updateAdminSector(selected.data.id, payload);
        case "cell":
          return updateAdminCell(selected.data.id, payload);
        case "village":
          return updateAdminVillage(selected.data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setNewPin("");
      void queryClient.invalidateQueries({ queryKey: ["admin-hierarchy"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Unable to save changes."));
    },
  });

  const resetPinMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !/^\d{4}$/.test(newPin)) {
        throw new Error("Enter a valid 4-digit PIN.");
      }
      if (selected.level === "cell") {
        return updateAdminCell(selected.data.id, { pin: newPin });
      }
      if (selected.level === "village") {
        return updateAdminVillage(selected.data.id, { pin: newPin });
      }
      if (selected.level === "sector") {
        return updateAdminSector(selected.data.id, { pin: newPin });
      }
      throw new Error("PIN reset is only available for cells, villages, and sectors.");
    },
    onSuccess: () => {
      toast.success("PIN reset — user must change on next login");
      setNewPin("");
      void queryClient.invalidateQueries({ queryKey: ["admin-hierarchy"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Unable to reset PIN."));
    },
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading hierarchy..." fullPage />;
  }

  return (
    <>
      <PageHeader
        title="Hierarchy"
        description="Browse and edit Rwanda administrative structure"
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-8 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load hierarchy</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Navigate</CardTitle>
            <CardDescription>Province → District → Sector → Cell → Village</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label>Province</Label>
              <Select
                value={provinceId}
                onValueChange={(value) => {
                  setProvinceId(value);
                  setDistrictId("");
                  setSectorId("");
                  setCellId("");
                  setVillageId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {tree.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>District</Label>
              <Select
                value={districtId}
                onValueChange={(value) => {
                  setDistrictId(value);
                  setSectorId("");
                  setCellId("");
                  setVillageId("");
                }}
                disabled={!province}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {(province?.districts ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Select
                value={sectorId}
                onValueChange={(value) => {
                  setSectorId(value);
                  setCellId("");
                  setVillageId("");
                }}
                disabled={!district}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {(district?.sectors ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Cell</Label>
              <Select
                value={cellId}
                onValueChange={(value) => {
                  setCellId(value);
                  setVillageId("");
                }}
                disabled={!sector}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select cell" />
                </SelectTrigger>
                <SelectContent>
                  {(sector?.cells ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Village</Label>
              <Select value={villageId} onValueChange={setVillageId} disabled={!cell}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select village" />
                </SelectTrigger>
                <SelectContent>
                  {(cell?.villages ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selected ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base capitalize">{selected.level} details</CardTitle>
              <CardDescription>
                {selected.level === "cell"
                  ? `${selected.data.villages.length} villages · PIN ${selected.data.pin_masked}`
                  : selected.level === "village"
                    ? `PIN ${selected.data.pin_masked ?? "not set"}`
                    : selected.level === "sector"
                      ? `PIN ${selected.data.pin_masked ?? "not set"}`
                      : "Edit names and codes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveMutation.mutate(new FormData(event.currentTarget));
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">English name</Label>
                    <Input id="name" name="name" defaultValue={selected.data.name} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name_kinyarwanda">Kinyarwanda name</Label>
                    <Input
                      id="name_kinyarwanda"
                      name="name_kinyarwanda"
                      defaultValue={selected.data.nameKinyarwanda}
                    />
                  </div>
                  {"code" in selected.data ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="code">Code</Label>
                      <Input id="code" name="code" defaultValue={selected.data.code} />
                    </div>
                  ) : null}
                  {selected.level === "cell" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="executive_name">Executive name</Label>
                        <Input
                          id="executive_name"
                          name="executive_name"
                          defaultValue={selected.data.executiveName}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="executive_phone">Executive phone</Label>
                        <Input
                          id="executive_phone"
                          name="executive_phone"
                          defaultValue={selected.data.executivePhone}
                        />
                      </div>
                    </>
                  ) : null}
                  {selected.level === "village" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="coordinator_name">Coordinator name</Label>
                        <Input
                          id="coordinator_name"
                          name="coordinator_name"
                          defaultValue={selected.data.coordinatorName ?? ""}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="coordinator_phone">Coordinator phone</Label>
                        <Input
                          id="coordinator_phone"
                          name="coordinator_phone"
                          defaultValue={selected.data.coordinatorPhone ?? ""}
                        />
                      </div>
                    </>
                  ) : null}
                  {selected.level === "sector" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="official_name">Official name</Label>
                        <Input
                          id="official_name"
                          name="official_name"
                          defaultValue={selected.data.officialName ?? ""}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="official_phone">Official phone</Label>
                        <Input
                          id="official_phone"
                          name="official_phone"
                          defaultValue={selected.data.officialPhone ?? ""}
                        />
                      </div>
                    </>
                  ) : null}
                </div>

                <Button type="submit" disabled={saveMutation.isPending}>
                  <SaveIcon className="size-4" aria-hidden />
                  {saveMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </form>

              {selected.level === "cell" ||
              selected.level === "village" ||
              selected.level === "sector" ? (
                <div className="mt-6 space-y-3 border-t pt-6">
                  <h3 className="text-sm font-semibold">Reset PIN</h3>
                  <p className="text-sm text-muted-foreground">
                    Sets a temporary PIN. The user must change it on next login.
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_pin">New PIN</Label>
                      <Input
                        id="new_pin"
                        inputMode="numeric"
                        maxLength={4}
                        value={newPin}
                        onChange={(event) => setNewPin(event.target.value)}
                        className="w-28"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resetPinMutation.isPending}
                      onClick={() => resetPinMutation.mutate()}
                    >
                      <KeyRoundIcon className="size-4" aria-hidden />
                      Reset PIN
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Select a province to browse and edit the hierarchy.
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
