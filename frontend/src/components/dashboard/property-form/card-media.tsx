"use client";

import { Image as ImageIcon, Loader2, Plus, Star, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

export interface PhotoItem {
  id: string;
  url: string;
  name: string;
  size: string;
  isCover: boolean;
  rawFile?: File;
  isUploading?: boolean;
  progress?: number;
}

interface CardMediaProps {
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
}

export function CardMedia({ photos = [], setPhotos }: CardMediaProps) {
  const t = useTranslations("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readyCount = photos.filter((p) => !p.isUploading).length;
  const processCount = photos.filter((p) => p.isUploading).length;

  const handleMakeCover = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === photoId,
      })),
    );
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== photoId);
      // If removed was cover, make first remaining as cover
      if (remaining.length > 0 && !remaining.some((p) => p.isCover)) {
        if (remaining[0]) remaining[0].isCover = true;
      }
      return remaining;
    });
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentHasCover = photos.some((p) => p.isCover);
    const newItems: PhotoItem[] = Array.from(files).map((file, idx) => ({
      id: `new-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isCover: !currentHasCover && idx === 0,
      rawFile: file,
    }));
    setPhotos((prev) => [...prev, ...newItems]);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#EBF5FF] text-[#2563EB]">
            <ImageIcon className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("cardMediaTitle")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("cardMediaSubtitle")}</p>
          </div>
        </div>

        <span className="self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 sm:self-auto">
          {t("maxPhotosHint")}
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFilesAdded(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
            isDragging ? "border-sky-500 bg-sky-50/70" : "border-sky-300 bg-[#F0F8FF]/40 hover:bg-sky-50/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFilesAdded(e.target.files)}
            className="hidden"
          />

          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <UploadCloud className="size-6" />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Seret dan lepas foto listing ke area ini, atau{" "}
            <span className="font-bold text-sky-700 underline">klik untuk pilih file</span> dari komputer
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{t("dropzoneSupported")}</p>
        </div>

        {/* Uploaded Photos Section */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              {t("uploadedPhotosTitle", { ready: readyCount, process: processCount })}
            </h3>
            <span className="text-[11px] font-medium text-slate-400">{t("dragOrderHint")}</span>
          </div>

          {/* Grid of Photos */}
          <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => {
              if (photo.isUploading) {
                return (
                  <div
                    key={photo.id}
                    className="flex h-36 flex-col justify-between rounded-xl border border-sky-200 bg-sky-50/60 p-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-sky-600" />
                      <span className="truncate text-xs font-bold text-slate-900">Mengunggah Foto...</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                        <span>{photo.progress ?? 87}%</span>
                        <span>2.2 MB / {photo.size}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sky-200">
                        <div
                          className="h-full rounded-full bg-sky-600 transition-all duration-300"
                          style={{ width: `${photo.progress ?? 87}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={photo.id}
                  className="group relative h-36 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs transition-all hover:shadow-xs"
                >
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />

                  {/* Top Badges & Actions */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent p-2">
                    {photo.isCover ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <Star className="size-3 fill-current" />
                        <span>FOTO UTAMA (COVER)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(photo.id)}
                        className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                      >
                        Jadikan Cover
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      title="Hapus foto"
                      className="rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Photo Box */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center transition-colors hover:border-sky-400 hover:bg-sky-50/30"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Plus className="size-4" />
              </div>
              <span className="mt-2 text-xs font-semibold text-slate-600">{t("addPhotoBox")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
