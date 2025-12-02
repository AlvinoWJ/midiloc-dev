"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomSelect from "../ui/customselect";
import { KpltCreatePayload } from "@/lib/validations/kplt";
import PrefillKpltCard from "../ui/prefillkpltcard";
import { KpltBaseUIMapped } from "@/types/common";

interface TambahKpltLayoutProps {
  prefillData: KpltBaseUIMapped | undefined;
  formData: any;
  errors: any;
  isSubmitting: boolean;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
}

interface FileInputConfig {
  name: keyof KpltCreatePayload;
  label: string;
  accept: string;
  helpertext: string;
  maxSize: number; // in bytes
}

export default function TambahKpltLayout({
  prefillData,
  formData,
  errors,
  isSubmitting,
  handleChange,
  handleFileChange,
  handleFormSubmit,
}: TambahKpltLayoutProps) {
  const router = useRouter();

  const karakterLokasiOptions = [
    "High Traffic",
    "Residential",
    "High Traffic & Residential",
  ];
  const SocialEconomyOptions = ["Upper", "Upper & Middle", "Upper & Lower"];
  const PeStatusOptions = ["OK", "NOK"];

  const fileInputList: FileInputConfig[] = [
    {
      name: "pdf_foto",
      label: "Foto",
      accept: ".pdf",
      helpertext: "PDF, maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "pdf_pembanding",
      label: "Data Pembanding",
      accept: ".pdf",
      helpertext: "PDF, maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "pdf_kks",
      label: "Kertas Kerja Survei",
      accept: ".pdf",
      helpertext: "PDF, maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "counting_kompetitor",
      label: "Counting Kompetitor",
      accept: ".xlsx, .xls",
      helpertext: "Excel (XLSX/XLS), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "excel_fpl",
      label: "Form Pembobotan Lokasi",
      accept: ".xlsx, .xls",
      helpertext: "Excel (XLSX/XLS), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "excel_pe",
      label: "Project Evaluation",
      accept: ".xlsx, .xls",
      helpertext: "Excel (XLSX/XLS), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "video_traffic_siang",
      label: "Video Traffic Siang",
      accept: ".mp4, .mov, .avi, .webm",
      helpertext: "Video (MP4/MOV/AVI/WEBM), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "video_traffic_malam",
      label: "Video Traffic Malam",
      accept: ".mp4, .mov, .avi, .webm",
      helpertext: "Video (MP4/MOV/AVI/WEBM), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "video_360_siang",
      label: "Video 360 Siang",
      accept: ".mp4, .mov, .avi, .webm",
      helpertext: "Video (MP4/MOV/AVI/WEBM), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "video_360_malam",
      label: "Video 360 Malam",
      accept: ".mp4, .mov, .avi, .webm",
      helpertext: "Video (MP4/MOV/AVI/WEBM), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
    {
      name: "peta_coverage",
      label: "Peta Coverage",
      accept: ".png, .jpg, .jpeg, .webp",
      helpertext: "Gambar (PNG/JPG/WEBP), maks. 15MB",
      maxSize: 15 * 1024 * 1024,
    },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatNumber = (value: string) => {
    if (!value) return "";
    const parts = value.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(",");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      e.target instanceof HTMLElement &&
      e.target.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
    }
  };

  return (
    <main className="space-y-4 lg:space-y-6">
      <form
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        noValidate
        className="max-w-7xl mx-auto"
      >
        <Button
          type="button"
          onClick={() => router.back()}
          variant="back"
          className="mb-6 bg-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>

        {prefillData && <PrefillKpltCard baseData={prefillData} />}
        <div className="relative mt-10 mx-auto max-w-7xl">
          <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow font-semibold text-base lg:text-lg">
            Analisis Kelayakan Lokasi
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl px-6 py-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomSelect
                id="karakter_lokasi"
                name="karakter_lokasi"
                label="Karakter Lokasi"
                placeholder="Pilih Karakter Lokasi"
                options={karakterLokasiOptions}
                value={formData.karakter_lokasi}
                onChange={handleChange}
                error={errors.karakter_lokasi}
              />
              <CustomSelect
                id="sosial_ekonomi"
                name="sosial_ekonomi"
                label="Sosial Ekonomi"
                placeholder="Pilih Sosial Ekonomi"
                options={SocialEconomyOptions}
                value={formData.sosial_ekonomi}
                onChange={handleChange}
                error={errors.sosial_ekonomi}
              />
              <div className="flex-1">
                <div className="space-y-2">
                  <Label
                    htmlFor="skor_fpl"
                    className="font-semibold text-base lg:text-lg"
                  >
                    Skor FPL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="skor_fpl"
                    name="skor_fpl"
                    placeholder="Masukkan skor FPL"
                    value={formatNumber(formData.skor_fpl)}
                    onChange={handleChange}
                    inputMode="numeric"
                    className={errors.apc ? "border-red-500" : ""}
                  />
                  {errors.skor_fpl && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.skor_fpl}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <Label
                    htmlFor="std"
                    className="font-semibold text-base lg:text-lg"
                  >
                    STD <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="std"
                    name="std"
                    placeholder="Masukkan std"
                    value={formatNumber(formData.std)}
                    inputMode="numeric"
                    onChange={handleChange}
                    className={errors.apc ? "border-red-500" : ""}
                  />
                  {errors.std && (
                    <p className="text-sm text-red-500 mt-1">{errors.std}</p>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <Label
                    htmlFor="apc"
                    className="font-semibold text-base lg:text-lg"
                  >
                    APC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apc"
                    name="apc"
                    placeholder="Masukkan apc"
                    value={formatNumber(formData.apc)}
                    inputMode="numeric"
                    onChange={handleChange}
                    className={errors.apc ? "border-red-500" : ""}
                  />
                  {errors.apc && (
                    <p className="text-sm text-red-500 mt-1">{errors.apc}</p>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <Label
                    htmlFor="spd"
                    className="font-semibold text-base lg:text-lg"
                  >
                    SPD <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="spd"
                    name="spd"
                    placeholder="Masukkan spd"
                    value={formatNumber(formData.spd)}
                    inputMode="numeric"
                    onChange={handleChange}
                    tabIndex={-1}
                    readOnly
                    className={errors.spd ? "border-red-500" : ""}
                  />
                  {errors.spd && (
                    <p className="text-sm text-red-500 mt-1">{errors.spd}</p>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <CustomSelect
                  id="pe_status"
                  name="pe_status"
                  label="PE Status"
                  placeholder="Pilih Status PE"
                  options={PeStatusOptions}
                  value={formData.pe_status}
                  onChange={handleChange}
                  error={errors.pe_status}
                />
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <Label
                    htmlFor="pe_rab"
                    className="font-semibold text-base lg:text-lg"
                  >
                    PE RAB <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pe_rab"
                    name="pe_rab"
                    placeholder="Masukkan PE RAB"
                    value={formatNumber(formData.pe_rab)}
                    inputMode="numeric"
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={errors.pe_rab ? "border-red-500" : ""}
                  />
                  {errors.pe_rab && (
                    <p className="text-sm text-red-500 mt-1">{errors.pe_rab}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-10">
          <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow font-semibold text-base lg:text-lg">
            Evaluasi Lokasi Potensial
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fileInputList.map((file) => (
              <div className="space-y-2" key={file.name}>
                <Label
                  htmlFor={file.name}
                  className="font-semibold text-base lg:text-lg"
                >
                  {file.label} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={file.name}
                  name={file.name}
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className={`file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:text-red-700 ${
                    errors[file.name] ? "border-red-500" : ""
                  }`}
                  accept={file.accept}
                />

                {!errors[file.name] && !formData[file.name] && (
                  <p className="text-xs text-gray-500">{file.helpertext}</p>
                )}

                {formData[file.name] && !errors[file.name] && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-2 rounded">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate flex-1">
                      {formData[file.name].name}
                    </span>
                    <span className="text-gray-600 flex-shrink-0">
                      ({formatFileSize(formData[file.name].size)})
                    </span>
                  </div>
                )}

                {/* Error message */}
                {errors[file.name] && (
                  <div className="flex items-start gap-1 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
                    <X className="w-3 h-3  flex-shrink-0 mt-0.5" />
                    <span>{errors[file.name]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6 mb-2">
          <Button
            type="submit"
            variant="submit"
            size="lg"
            className="w-full lg:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Data KPLT
          </Button>
        </div>
      </form>
    </main>
  );
}
