"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Asumsi path ini benar
import { Label } from "@/components/ui/label"; // Asumsi path ini benar
import { ArrowLeft, LinkIcon, Loader2 } from "lucide-react";
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
}

const FileLink = ({ label, url }: { label: string; url: string | null }) => {
  if (!url) return null;
  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <span className="text-sm text-gray-700">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
      >
        <LinkIcon className="w-3 h-3 mr-1.5" />
        Lihat
      </a>
    </div>
  );
};

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
    { name: "pdf_foto", label: "Foto", accept: ".pdf" },
    { name: "pdf_pembanding", label: "Data Pembanding", accept: ".pdf" },
    { name: "pdf_kks", label: "Kertas Kerja Survei", accept: ".pdf" },
    {
      name: "counting_kompetitor",
      label: "Counting Kompetitor",
      accept: ".xlsx, .xls",
    },
    {
      name: "excel_fpl",
      label: "Form Pembobotan Lokasi",
      accept: ".xlsx, .xls",
    },
    { name: "excel_pe", label: "Project Evaluation", accept: ".xlsx, .xls" },
    {
      name: "video_traffic_siang",
      label: "Video Traffic Siang",
      accept: "video/*",
    },
    {
      name: "video_traffic_malam",
      label: "Video Traffic Malam",
      accept: "video/*",
    },
    { name: "video_360_siang", label: "Video 360 Siang", accept: "video/*" },
    { name: "video_360_malam", label: "Video 360 Malam", accept: "video/*" },
    {
      name: "peta_coverage",
      label: "Peta Coverage",
      accept: "image/*",
    },
  ];

  return (
    <main className="space-y-4 lg:space-y-6">
      <form
        onSubmit={handleFormSubmit}
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
                    type="number"
                    placeholder="Masukkan skor FPL"
                    value={formData.skor_fpl}
                    onChange={handleChange}
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
                    type="number"
                    placeholder="Masukkan std"
                    value={formData.std}
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
                    type="number"
                    placeholder="Masukkan apc"
                    value={formData.apc}
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
                    type="number"
                    placeholder="Masukkan spd"
                    value={formData.spd}
                    onChange={handleChange}
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
                    type="number"
                    placeholder="Masukkan PE RAB"
                    value={formData.pe_rab}
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
                  className={`file:mr-4 ...`}
                  accept={file.accept}
                />
                {errors[file.name] && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors[file.name]}
                  </p>
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
