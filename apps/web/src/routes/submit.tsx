import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CameraIcon,
  CheckCircle2Icon,
  ImageIcon,
  XIcon,
} from "lucide-react";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { convertImageToWebp } from "@/lib/image";
import { notifyError, notifySuccess } from "@/lib/notify";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/phone";
import {
  fetchCells,
  fetchDistricts,
  fetchLocationVillages,
  fetchProvinces,
  fetchSectors,
  formatLocationLabel,
  type LocationOption,
} from "@/lib/api/locations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const submitSchema = z.object({
  raw_text: z
    .string()
    .trim()
    .min(20, "Please provide at least 20 characters so we can understand the problem"),
  submitter_phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => !value || isValidRwandaPhone(value),
      "Enter a valid Rwanda phone number",
    ),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

type LocationLevel = "province" | "district" | "sector" | "cell" | "village";

function LocationField({
  label,
  labelRw,
  placeholder,
  value,
  options,
  loading,
  disabled,
  showBilingualOptions = false,
  onChange,
}: {
  label: string;
  labelRw: string;
  placeholder: string;
  value: string;
  options: LocationOption[];
  loading?: boolean;
  disabled?: boolean;
  showBilingualOptions?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label>
        {label} / {labelRw}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {showBilingualOptions ? formatLocationLabel(option) : option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function SubmitRoute() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [sectors, setSectors] = useState<LocationOption[]>([]);
  const [cells, setCells] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [cellId, setCellId] = useState("");
  const [villageId, setVillageId] = useState("");

  const [locationLoading, setLocationLoading] = useState<LocationLevel | null>("province");
  const [locationError, setLocationError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);
  const [submittedWithPhoto, setSubmittedWithPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubmitFormValues>({
    defaultValues: { raw_text: "", submitter_phone: "" },
  });

  useEffect(() => {
    void (async () => {
      try {
        setLocationLoading("province");
        setLocationError(null);
        setProvinces(await fetchProvinces());
      } catch (error) {
        setLocationError(getApiErrorMessage(error, "Unable to load provinces."));
      } finally {
        setLocationLoading(null);
      }
    })();
  }, []);

  const handleProvinceChange = (value: string) => {
    setProvinceId(value);
    setDistrictId("");
    setSectorId("");
    setCellId("");
    setVillageId("");
    setDistricts([]);
    setSectors([]);
    setCells([]);
    setVillages([]);
  };

  const handleDistrictChange = (value: string) => {
    setDistrictId(value);
    setSectorId("");
    setCellId("");
    setVillageId("");
    setSectors([]);
    setCells([]);
    setVillages([]);
  };

  const handleSectorChange = (value: string) => {
    setSectorId(value);
    setCellId("");
    setVillageId("");
    setCells([]);
    setVillages([]);
  };

  const handleCellChange = (value: string) => {
    setCellId(value);
    setVillageId("");
    setVillages([]);
  };

  useEffect(() => {
    if (!provinceId) return;
    void (async () => {
      try {
        setLocationLoading("district");
        setDistricts(await fetchDistricts(provinceId));
      } catch (error) {
        setLocationError(getApiErrorMessage(error, "Unable to load districts."));
      } finally {
        setLocationLoading(null);
      }
    })();
  }, [provinceId]);

  useEffect(() => {
    if (!districtId) return;
    void (async () => {
      try {
        setLocationLoading("sector");
        setSectors(await fetchSectors(districtId));
      } catch (error) {
        setLocationError(getApiErrorMessage(error, "Unable to load sectors."));
      } finally {
        setLocationLoading(null);
      }
    })();
  }, [districtId]);

  useEffect(() => {
    if (!sectorId) return;
    void (async () => {
      try {
        setLocationLoading("cell");
        setCells(await fetchCells(sectorId));
      } catch (error) {
        setLocationError(getApiErrorMessage(error, "Unable to load cells."));
      } finally {
        setLocationLoading(null);
      }
    })();
  }, [sectorId]);

  useEffect(() => {
    if (!cellId) return;
    void (async () => {
      try {
        setLocationLoading("village");
        setVillages(await fetchLocationVillages(cellId));
      } catch (error) {
        setLocationError(getApiErrorMessage(error, "Unable to load villages."));
      } finally {
        setLocationLoading(null);
      }
    })();
  }, [cellId]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const locationComplete = Boolean(provinceId && districtId && sectorId && cellId && villageId);

  const canSubmit = useMemo(
    () => locationComplete && !locationError && !isSubmitting,
    [locationComplete, locationError, isSubmitting],
  );

  const openPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoSelect = (file: File | null) => {
    setPhotoError(null);
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      setPhotoError("Photo must be JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Photo must be 5 MB or smaller.");
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const onSubmit = async (values: SubmitFormValues) => {
    setSubmitError(null);
    setSubmittedIssueId(null);

    if (!locationComplete) {
      const message = "Please select the full location: province through village.";
      setSubmitError(message);
      notifyError(message);
      return;
    }

    const parsed = submitSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.raw_text?.[0]) setError("raw_text", { message: fieldErrors.raw_text[0] });
      if (fieldErrors.submitter_phone?.[0]) {
        setError("submitter_phone", { message: fieldErrors.submitter_phone[0] });
      }
      return;
    }

    try {
      const selectedPhoto = photoFile;
      const response = await api.post("/api/issues", {
        raw_text: parsed.data.raw_text,
        cell_id: cellId,
        village_id: villageId,
        submission_channel: "web",
        submitter_phone: parsed.data.submitter_phone
          ? (normalizeRwandaPhone(parsed.data.submitter_phone) ?? parsed.data.submitter_phone)
          : null,
      });
      const issueId = typeof response.data?.id === "string" ? response.data.id : null;
      setSubmittedWithPhoto(Boolean(photoFile));
      setSubmittedIssueId(issueId);
      notifySuccess("Issue submitted successfully");
      notifySuccess("Your issue is being reviewed by officials.");

      reset({ raw_text: "", submitter_phone: "" });
      clearPhoto();

      if (selectedPhoto && issueId) {
        void (async () => {
          try {
            const webpPhoto = await convertImageToWebp(selectedPhoto);
            const uploadData = new FormData();
            uploadData.append("photo", webpPhoto);
            await api.post(`/api/issues/${issueId}/photo`, uploadData);
          } catch (uploadError) {
            notifyError(
              getApiErrorMessage(uploadError, "Issue submitted successfully, but photo upload failed."),
            );
          }
        })();
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to submit your issue right now.");
      setSubmitError(message);
      notifyError(message);
    }
  };

  // handleSubmit binds onSubmit once per render; ref access is only inside submit handler.
  // eslint-disable-next-line react-hooks/refs -- react-hook-form submit wiring
  const onFormSubmit = handleSubmit(onSubmit);

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center px-4 py-8">
        <Button asChild variant="ghost" className="mb-4 w-fit">
          <Link to="/">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back to home
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-primary">Tubikorere</p>
            <CardTitle>Submit an issue / Ohereza ikibazo</CardTitle>
            <CardDescription>
              Tell us where the problem is, describe it, and add a photo so we can prioritize fairly
              for Umuganda (once per month).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onFormSubmit} className="space-y-5" noValidate>
              <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-semibold">Location / Aho ikibazo giherereye</p>
                  <p className="text-xs text-muted-foreground">
                    Province → District → Sector → Cell → Village
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <LocationField
                    label="Province"
                    labelRw="Intara"
                    placeholder="Select province"
                    value={provinceId}
                    options={provinces}
                    loading={locationLoading === "province"}
                    showBilingualOptions
                    onChange={handleProvinceChange}
                  />
                  <LocationField
                    label="District"
                    labelRw="Akarere"
                    placeholder="Select district"
                    value={districtId}
                    options={districts}
                    loading={locationLoading === "district"}
                    disabled={!provinceId}
                    onChange={handleDistrictChange}
                  />
                  <LocationField
                    label="Sector"
                    labelRw="Umurenge"
                    placeholder="Select sector"
                    value={sectorId}
                    options={sectors}
                    loading={locationLoading === "sector"}
                    disabled={!districtId}
                    onChange={handleSectorChange}
                  />
                  <LocationField
                    label="Cell"
                    labelRw="Akagari"
                    placeholder="Select cell"
                    value={cellId}
                    options={cells}
                    loading={locationLoading === "cell"}
                    disabled={!sectorId}
                    onChange={handleCellChange}
                  />
                  <LocationField
                    label="Village"
                    labelRw="Umudugudu"
                    placeholder="Select village"
                    value={villageId}
                    options={villages}
                    loading={locationLoading === "village"}
                    disabled={!cellId}
                    onChange={setVillageId}
                  />
                </div>
              </section>

              <div className="space-y-1.5">
                <Label htmlFor="raw_text">Describe the problem / Sobanura ikibazo</Label>
                <Textarea
                  id="raw_text"
                  rows={4}
                  placeholder="e.g. The road to the school floods when it rains / Urugendo rugana ku ishuri rukazwa n'amazi iyo imvura iganye"
                  {...register("raw_text")}
                  aria-invalid={Boolean(errors.raw_text)}
                  className="min-h-28"
                />
                {errors.raw_text ? (
                  <p className="text-xs text-destructive">{errors.raw_text.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Site photo (recommended) / Ifoto y&apos;ahantu</Label>
                <p className="text-xs text-muted-foreground">
                  Helps assess severity when many issues compete for one Umuganda day. Max 5 MB.
                </p>
                <input
                  ref={photoInputRef}
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => handlePhotoSelect(event.target.files?.[0] ?? null)}
                />

                {photoPreview ? (
                  <div className="relative overflow-hidden rounded-lg border">
                    <img
                      src={photoPreview}
                      alt="Selected issue site"
                      className="max-h-56 w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-sm"
                      className="absolute top-2 right-2"
                      onClick={clearPhoto}
                      aria-label="Remove photo"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-24 w-full flex-col gap-2 border-dashed"
                    onClick={openPhotoPicker}
                  >
                    <CameraIcon className="size-5 text-muted-foreground" />
                    <span className="text-sm">Take or upload photo / Fata ifoto</span>
                  </Button>
                )}

                {photoPreview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0"
                    onClick={openPhotoPicker}
                  >
                    <ImageIcon className="size-4" />
                    Replace photo
                  </Button>
                ) : null}

                {photoError ? <p className="text-xs text-destructive">{photoError}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submitter_phone">
                  Your phone (optional) / Telephone yawe (ntibigomba)
                </Label>
                <Input
                  id="submitter_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="078... or +25078..."
                  {...register("submitter_phone")}
                  aria-invalid={Boolean(errors.submitter_phone)}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll notify you when your issue is resolved / Tuzakumenyesha igihe ikibazo
                  cyawe gikemutse
                </p>
                {errors.submitter_phone ? (
                  <p className="text-xs text-destructive">{errors.submitter_phone.message}</p>
                ) : null}
              </div>

              {locationError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertTitle>Unable to load locations</AlertTitle>
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              ) : null}

              {submitError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertTitle>Submission failed</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}

              {submittedIssueId ? (
                <Alert>
                  <CheckCircle2Icon className="size-4 text-primary" />
                  <AlertTitle>Issue received / Ikibazo cyakiriwe</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      Reference:{" "}
                      <span className="font-mono font-semibold">
                        {submittedIssueId.slice(0, 8).toUpperCase()}
                      </span>
                      . The cell executive will review this issue
                      {submittedWithPhoto ? " and your photo" : ""}.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-1">
                      <Link to={`/track/${submittedIssueId}`}>Track status / Reba imiterere</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="h-11 w-full" disabled={!canSubmit}>
                {isSubmitting ? "Submitting..." : "Submit / Ohereza"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
