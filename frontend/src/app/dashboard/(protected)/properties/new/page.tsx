"use client";

import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { CardBasicInfo, type PropertyTypeSlug } from "@/components/dashboard/property-form/card-basic-info";
import {
  CardCompletionSidebar,
  type CompletionItem,
} from "@/components/dashboard/property-form/card-completion-sidebar";
import { CardLocation } from "@/components/dashboard/property-form/card-location";
import { CardMedia, type PhotoItem } from "@/components/dashboard/property-form/card-media";
import { CardPricing } from "@/components/dashboard/property-form/card-pricing";
import { CardSpecs } from "@/components/dashboard/property-form/card-specs";
import { apiRequest } from "@/lib/api/client";
import type { ListingType, MarketType, RentPeriod } from "@/types/property";

export default function NewPropertyPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  // Card 1: Basic Info (Clean state, not pre-filled)
  const [listingType, setListingType] = useState<ListingType>("sale");
  const [marketType, setMarketType] = useState<MarketType>("secondary");
  const [propertyType, setPropertyType] = useState<PropertyTypeSlug>("rumah");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Card 2: Pricing (Clean state)
  const [price, setPrice] = useState<number>(0);
  const [rentPeriod, setRentPeriod] = useState<RentPeriod | null>(null);
  const [isNegotiable, setIsNegotiable] = useState(false);

  // Card 3: Location (Default province & city, but address is clean)
  const [provinceId, setProvinceId] = useState(21);
  const [cityId, setCityId] = useState(2171);
  const [district, setDistrict] = useState("Batam Kota");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Card 4: Specs (Clean state)
  const [landArea, setLandArea] = useState<number | "">("");
  const [buildingArea, setBuildingArea] = useState<number | "">("");
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [maidBedrooms, setMaidBedrooms] = useState<number | "">("");
  const [floors, setFloors] = useState("");
  const [carports, setCarports] = useState("");
  const [electricity, setElectricity] = useState("2200");
  const [waterSource, setWaterSource] = useState("PDAM / ATB Batam");
  const [certificate, setCertificate] = useState("shm");
  const [furnishing, setFurnishing] = useState("semi_furnished");
  const [facing, setFacing] = useState("north");
  const [yearBuilt, setYearBuilt] = useState("");

  // Card 5: Media (Clean state: empty photos list)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // State
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Completion calculation matching checklist items
  const completionItems: CompletionItem[] = useMemo(() => {
    const isSpecsComplete =
      propertyType === "tanah"
        ? landArea !== "" && landArea > 0
        : propertyType === "apartemen"
          ? buildingArea !== "" &&
            buildingArea > 0 &&
            bedrooms !== "" &&
            bedrooms >= 0 &&
            bathrooms !== "" &&
            bathrooms >= 0
          : landArea !== "" &&
            landArea > 0 &&
            buildingArea !== "" &&
            buildingArea > 0 &&
            bedrooms !== "" &&
            bedrooms >= 0 &&
            bathrooms !== "" &&
            bathrooms >= 0;

    return [
      {
        id: "c-title-desc",
        label: t("checkTitleDesc"),
        isComplete: title.trim().length >= 10 && description.trim().length >= 50,
      },
      {
        id: "c-price-cert",
        label: t("checkPriceCert"),
        isComplete: price > 0 && certificate.trim() !== "",
      },
      {
        id: "c-location",
        label: t("checkLocation"),
        isComplete: address.trim().length > 0 && district.trim().length > 0,
      },
      {
        id: "c-specs",
        label: t("checkSpecs"),
        isComplete: isSpecsComplete,
      },
      {
        id: "c-cover-photo",
        label: t("checkCoverPhoto"),
        isComplete: photos.some((p) => p.isCover && !p.isUploading),
      },
      {
        id: "c-map-coords",
        label: t("checkMapCoords"),
        isComplete: latitude !== null && longitude !== null,
        isOptional: true,
      },
    ];
  }, [
    title,
    description,
    price,
    certificate,
    address,
    district,
    landArea,
    buildingArea,
    bedrooms,
    bathrooms,
    photos,
    latitude,
    longitude,
    propertyType,
    t,
  ]);

  const completionPercent = useMemo(() => {
    const completedCount = completionItems.filter((i) => i.isComplete).length;
    if (completedCount === 0) return 0;
    if (completedCount === 5) return 85;
    return Math.round((completedCount / completionItems.length) * 100);
  }, [completionItems]);

  const handleSave = async (targetStatus: "draft" | "active") => {
    if (targetStatus === "active") {
      setIsPublishing(true);
      if (title.trim().length < 10) {
        setToast({ message: t("errorTitleMin10"), isError: true });
        setIsPublishing(false);
        return;
      }
      if (description.trim().length < 50) {
        setToast({ message: t("errorDescriptionMin50"), isError: true });
        setIsPublishing(false);
        return;
      }
      if (price <= 0) {
        setToast({ message: "Harga properti wajib diisi dan lebih dari 0", isError: true });
        setIsPublishing(false);
        return;
      }
      if (!address.trim()) {
        setToast({ message: "Alamat lengkap wajib diisi untuk penayangan", isError: true });
        setIsPublishing(false);
        return;
      }
      if (propertyType !== "apartemen" && (landArea === "" || Number(landArea) <= 0)) {
        setToast({ message: "Luas tanah wajib diisi dan lebih dari 0 m²", isError: true });
        setIsPublishing(false);
        return;
      }
      if (propertyType !== "tanah" && (buildingArea === "" || Number(buildingArea) <= 0)) {
        setToast({ message: "Luas bangunan wajib diisi dan lebih dari 0 m²", isError: true });
        setIsPublishing(false);
        return;
      }
      if (photos.length === 0) {
        setToast({ message: "Minimal 1 foto wajib diunggah untuk menayangkan listing", isError: true });
        setIsPublishing(false);
        return;
      }
    } else {
      setIsSavingDraft(true);
      if (title.trim().length < 5) {
        setToast({ message: "Judul listing minimal 5 karakter untuk menyimpan draf", isError: true });
        setIsSavingDraft(false);
        return;
      }
      if (price <= 0) {
        setToast({ message: "Harga properti harus lebih besar dari 0", isError: true });
        setIsSavingDraft(false);
        return;
      }
    }

    setToast(null);

    const typeMap: Record<PropertyTypeSlug, number> = {
      rumah: 1,
      apartemen: 2,
      ruko: 3,
      kos: 4,
      tanah: 5,
    };

    const payload = {
      listing_type: listingType,
      market_type: marketType,
      property_type_id: typeMap[propertyType] ?? 1,
      title: title.trim(),
      description: description.trim(),
      price: price,
      rent_period: listingType === "rent" ? (rentPeriod ?? "monthly") : null,
      is_price_negotiable: isNegotiable,
      province_id: provinceId,
      city_id: cityId,
      district: district.trim() || undefined,
      address: address.trim() || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      land_area: landArea !== "" && propertyType !== "apartemen" ? Number(landArea) : undefined,
      building_area: buildingArea !== "" && propertyType !== "tanah" ? Number(buildingArea) : undefined,
      bedrooms: bedrooms !== "" && propertyType !== "tanah" ? Number(bedrooms) : undefined,
      bathrooms: bathrooms !== "" && propertyType !== "tanah" ? Number(bathrooms) : undefined,
      maid_bedrooms: maidBedrooms !== "" && propertyType !== "tanah" ? Number(maidBedrooms) : undefined,
      floors: floors && propertyType !== "tanah" ? Number(floors.replace(/\D/g, "")) || undefined : undefined,
      carports:
        carports && propertyType !== "tanah" ? Number(carports.replace(/\D/g, "")) || undefined : undefined,
      electricity_va: electricity ? Number(electricity) : undefined,
      water_source: waterSource || undefined,
      certificate: certificate || undefined,
      furnishing: furnishing || undefined,
      facing: facing || undefined,
      year_built: yearBuilt ? Number(yearBuilt) : undefined,
    };

    try {
      let newId = createdPropertyId;

      if (!newId) {
        // 1. Create property (initial status draft)
        const res = await apiRequest<{ id: string; slug: string }>("/properties", {
          method: "POST",
          body: payload,
        });
        newId = res.id;
        setCreatedPropertyId(newId);
      } else {
        // Jika draf sudah dibuat pada percobaan sebelumnya, perbarui datanya tanpa membuat duplikat
        await apiRequest(`/properties/${newId}`, {
          method: "PATCH",
          body: payload,
        });
      }

      // 2. Upload actual binary photos if any
      const photosWithFiles = photos.filter((p) => p.rawFile);
      if (newId && photosWithFiles.length > 0) {
        const formData = new FormData();
        for (const p of photosWithFiles) {
          if (p.rawFile) {
            formData.append("files", p.rawFile);
          }
        }
        await apiRequest(`/properties/${newId}/images`, {
          method: "POST",
          body: formData,
        });
      }

      // 3. If target is active, activate status
      if (targetStatus === "active" && newId) {
        await apiRequest(`/properties/${newId}/status`, {
          method: "PATCH",
          body: { status: "active" },
        });
        setToast({ message: t("propertyPublishedSuccess") });
      } else {
        setToast({ message: t("propertyDraftSavedSuccess") });
      }

      setTimeout(() => {
        setIsPublishing(false);
        setIsSavingDraft(false);
        router.push("/dashboard/properties");
      }, 1200);
    } catch (err: unknown) {
      setIsPublishing(false);
      setIsSavingDraft(false);
      const msg = err instanceof Error ? err.message : "Gagal menyimpan properti";
      setToast({ message: msg, isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all ${
            toast.isError ? "border border-rose-700 bg-rose-900" : "bg-slate-900"
          }`}
        >
          {toast.isError ? (
            <XCircle className="size-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="size-5 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            {t("addPropertyTitle")}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{t("addPropertySubtitle")}</p>
        </div>

        <NextLink
          href="/dashboard/properties"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 sm:self-auto"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t("backToProperties")}</span>
        </NextLink>
      </div>

      {/* 2-Column Grid (Main Cards Left, Sticky Completion Sidebar Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Main Form Cards) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Informasi Dasar & Tipe Properti */}
          <CardBasicInfo
            listingType={listingType}
            setListingType={setListingType}
            marketType={marketType}
            setMarketType={setMarketType}
            propertyType={propertyType}
            setPropertyType={setPropertyType}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
          />

          {/* Card 2: Harga & Transaksi */}
          <CardPricing
            price={price}
            setPrice={setPrice}
            listingType={listingType}
            rentPeriod={rentPeriod}
            setRentPeriod={setRentPeriod}
            isNegotiable={isNegotiable}
            setIsNegotiable={setIsNegotiable}
          />

          {/* Card 3: Lokasi Properti */}
          <CardLocation
            provinceId={provinceId}
            setProvinceId={setProvinceId}
            cityId={cityId}
            setCityId={setCityId}
            district={district}
            setDistrict={setDistrict}
            postalCode={postalCode}
            setPostalCode={setPostalCode}
            address={address}
            setAddress={setAddress}
            latitude={latitude}
            longitude={longitude}
            setCoordinates={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />

          {/* Card 4: Spesifikasi Hunian / Bangunan */}
          <CardSpecs
            propertyType={propertyType}
            landArea={landArea}
            setLandArea={setLandArea}
            buildingArea={buildingArea}
            setBuildingArea={setBuildingArea}
            bedrooms={bedrooms}
            setBedrooms={setBedrooms}
            bathrooms={bathrooms}
            setBathrooms={setBathrooms}
            maidBedrooms={maidBedrooms}
            setMaidBedrooms={setMaidBedrooms}
            floors={floors}
            setFloors={setFloors}
            carports={carports}
            setCarports={setCarports}
            electricity={electricity}
            setElectricity={setElectricity}
            waterSource={waterSource}
            setWaterSource={setWaterSource}
            certificate={certificate}
            setCertificate={setCertificate}
            furnishing={furnishing}
            setFurnishing={setFurnishing}
            facing={facing}
            setFacing={setFacing}
            yearBuilt={yearBuilt}
            setYearBuilt={setYearBuilt}
          />

          {/* Card 5: Foto & Media */}
          <CardMedia photos={photos} setPhotos={setPhotos} />
        </div>

        {/* Right Column (Sticky Completion Sidebar) */}
        <div className="lg:col-span-4">
          <CardCompletionSidebar
            items={completionItems}
            percent={completionPercent}
            onPublish={() => handleSave("active")}
            onSaveDraft={() => handleSave("draft")}
            isPublishing={isPublishing}
            isSavingDraft={isSavingDraft}
          />
        </div>
      </div>
    </div>
  );
}
