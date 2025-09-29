"use client";

import React, { useState } from "react";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { useSidebar } from "@/hooks/useSidebar";
import { MappedKpltData } from "@/hooks/useKpltDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Asumsi path ini benar
import { Label } from "@/components/ui/label"; // Asumsi path ini benar
import { ArrowLeft, LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomSelect from "../ui/customselect";
import { KpltCreatePayload } from "@/lib/validations/kplt";
import {
  ChevronDownIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";

// --- 1. PROPS DISESUAIKAN UNTUK MENERIMA LOGIKA DARI PARENT ---
interface TambahKpltLayoutProps {
  prefillData: MappedKpltData | undefined; // Menggantikan 'data'
  formData: any;
  errors: any;
  isSubmitting: boolean;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;

  // --- UBAH BAGIAN INI ---
  // Dari: (fieldName: keyof KpltCreatePayload, file: File | null) => void;
  // Menjadi:
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // <-- Tipe standar React

  handleFormSubmit: (e: React.FormEvent) => void;
}

// --- Komponen Skeleton (Tidak ada perubahan) ---
const TambahKpltSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-1/3 bg-gray-200 rounded-md mb-6"></div>
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="h-6 w-3/4 bg-gray-200 rounded-md"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded-md mt-2"></div>
      <div className="h-4 w-1/3 bg-gray-200 rounded-md mt-4"></div>
    </div>
  </div>
);

// --- TIPE UNTUK ARRAY FILE INPUT (MEMPERBAIKI ERROR TYPESCRIPT) ---
interface FileInputConfig {
  name: keyof KpltCreatePayload;
  label: string;
  accept: string;
}

// --- Komponen DetailField (Tidak ada perubahan) ---
const DetailField = ({ label, value }: { label: string; value: any }) => (
  <div>
    <label className="text-gray-600 font-medium text-sm mb-1 block">
      {label}
    </label>
    <div className="text-gray-900 py-2 text-sm bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-center w-full break-words">
      {value || "-"}
    </div>
  </div>
);

// --- Komponen FileLink untuk menampilkan link file ---
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

// --- Komponen UTAMA YANG SUDAH DIINTEGRASIKAN ---
export default function TambahKpltLayout({
  prefillData, // Menggunakan prop baru
  formData,
  errors,
  isSubmitting,
  handleChange,
  handleFileChange,
  handleFormSubmit,
}: TambahKpltLayoutProps) {
  const { isCollapsed } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false); // State lokal untuk UI tetap ada
  const router = useRouter();

  const karakterLokasiOptions = [
    "High Traffic",
    "Residential",
    "High Traffic & Residential",
  ];
  const SocialEconomyOptions = ["Upper", "Upper & Middle", "Upper & Lower"];
  const PeStatusOptions = ["OK", "NOK"];

  // Daftar file input dengan tipe yang benar
  const fileInputList: FileInputConfig[] = [
    { name: "pdf_foto", label: "Foto", accept: ".pdf" },
    {
      name: "counting_kompetitor",
      label: "Counting Kompetitor",
      accept: ".pdf",
    },
    { name: "pdf_pembanding", label: "Data Pembanding", accept: ".pdf" },
    { name: "pdf_kks", label: "Kertas Kerja Survei", accept: ".pdf" },
    {
      name: "excel_fpl",
      label: "Form Pembobotan Lokasi",
      accept: ".xlsx, .xls",
    },
    { name: "excel_pe", label: "Project Evaluation", accept: ".xlsx, .xls" },
    { name: "pdf_form_ukur", label: "Form Ukur Lokasi", accept: ".pdf" },
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
    { name: "peta_coverage", label: "Peta Coverage", accept: ".pdf, image/*" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-100 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          {/* Form akan membungkus semua konten input */}
          <form
            onSubmit={handleFormSubmit}
            noValidate
            className="max-w-7xl mx-auto"
          >
            <Button
              type="button" // Type button agar tidak submit form
              onClick={() => router.back()}
              variant="back"
              className="mb-6 bg-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Kembali
            </Button>

            {/* Bagian ini sekarang menampilkan prefillData */}
            {prefillData && (
              <div className="bg-white rounded-xl shadow-md transition-all duration-500">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="flex-1 min-w-0 pr-4">
                      <h1 className="text-xl font-bold text-gray-800">
                        {prefillData.namaKplt}
                      </h1>
                      <p className="text-lg text-gray-500 mt-1">
                        {prefillData.alamat}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bagian detail ULOK (expandable) tidak diubah, hanya sumber datanya */}
                <div
                  className={`transition-[max-height] duration-700 ease-in-out overflow-hidden ${
                    isExpanded ? "max-h-[2000px]" : "max-h-0"
                  }`}
                >
                  <div className="px-6 pb-6">
                    <div className="space-y-6">
                      {/* --- DATA USULAN LOKASI --- */}
                      <div className="border-t border-gray-300 pt-5">
                        <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                          <MapPinIcon className="w-5 h-5 mr-2 text-red-500" />{" "}
                          Data Usulan Lokasi
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailField
                            label="Provinsi"
                            value={prefillData.provinsi}
                          />
                          <DetailField
                            label="Kabupaten/Kota"
                            value={prefillData.kabupaten}
                          />
                          <DetailField
                            label="Kecamatan"
                            value={prefillData.kecamatan}
                          />
                          <DetailField
                            label="Kelurahan/Desa"
                            value={prefillData.desa}
                          />
                          <DetailField
                            label="Lat/Long"
                            value={`${prefillData.latitude}, ${prefillData.longitude}`}
                          />
                        </div>
                      </div>

                      {/* --- DATA STORE --- */}
                      <div className="border-t border-gray-300 pt-5">
                        <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                          <BuildingStorefrontIcon className="w-5 h-5 mr-2 text-blue-500" />{" "}
                          Data Store
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailField
                            label="Format Store"
                            value={prefillData.formatStore}
                          />
                          <DetailField
                            label="Bentuk Objek"
                            value={prefillData.bentukObjek}
                          />
                          <DetailField
                            label="Alas Hak"
                            value={prefillData.alasHak}
                          />
                          <DetailField
                            label="Jumlah Lantai"
                            value={prefillData.jumlahLantai}
                          />
                          <DetailField
                            label="Panjang"
                            value={<>{prefillData.panjang} m</>}
                          />
                          <DetailField
                            label="Lebar Depan"
                            value={<>{prefillData.lebarDepan} m</>}
                          />
                          <DetailField
                            label="Luas"
                            value={
                              <>
                                {prefillData.luas.toLocaleString("id-ID")} m
                                <sup>2</sup>
                              </>
                            }
                          />
                          <DetailField
                            label="Harga Sewa (+PPN 10%)"
                            value={`Rp ${prefillData.hargaSewa.toLocaleString(
                              "id-ID"
                            )}`}
                          />
                        </div>
                      </div>

                      {/* --- DATA PEMILIK --- */}
                      <div className="border-t border-gray-300 pt-5">
                        <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                          <UserIcon className="w-5 h-5 mr-2 text-green-500" />{" "}
                          Data Pemilik
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailField
                            label="Nama Pemilik"
                            value={prefillData.pemilik}
                          />
                          <DetailField
                            label="Kontak Pemilik"
                            value={prefillData.kontakPemilik}
                          />
                        </div>
                      </div>

                      {/* --- FORM KELENGKAPAN --- */}
                      <div className="border-t border-gray-300  pt-5">
                        <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                          <DocumentTextIcon className="w-5 h-5 mr-2 text-purple-500" />{" "}
                          Form Kelengkapan
                        </h4>
                        <div className="space-y-4">
                          <FileLink
                            label="File Intip"
                            url={prefillData.fileIntip}
                          />
                          <FileLink
                            label="Form ULOK"
                            url={prefillData.formUlok}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Toggle Expand/Collapse */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`p-2 w-full text-gray-500 rounded-b-xl hover:bg-gray-50 focus-visible:bg-gray-100 transition-colors`}
                  aria-expanded={isExpanded}
                >
                  <ChevronDownIcon
                    className={`w-6 h-6 mx-auto transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}

            {/* --- MULAI AREA FORM INPUT KPLT --- */}
            <div className="relative mt-10 mx-auto max-w-7xl">
              {/* Header */}
              <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded-md shadow-md font-semibold">
                Analisis Kelayakan Lokasi
              </div>

              {/* Card */}
              <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Karakter Lokasi */}
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

                  {/* Sosial Ekonomi */}
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

                  {/* Skor FPL */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label
                        htmlFor="skor_fpl"
                        className="font-semibold text-base"
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

                  {/* STD */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="std" className="font-semibold text-base">
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
                        <p className="text-sm text-red-500 mt-1">
                          {errors.std}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* APC */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="apc" className="font-semibold text-base">
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
                        <p className="text-sm text-red-500 mt-1">
                          {errors.apc}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SPD */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="spd" className="font-semibold text-base">
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
                        <p className="text-sm text-red-500 mt-1">
                          {errors.spd}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* PE Status */}
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

                  {/* PE RAB */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label
                        htmlFor="pe_rab"
                        className="font-semibold text-base"
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
                        <p className="text-sm text-red-500 mt-1">
                          {errors.pe_rab}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seksi: Kelengkapan Dokumen (File Inputs) */}
            <div className="relative mt-10">
              <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
                Evalasi Lokasi Potensial
              </div>
              <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fileInputList.map((file) => (
                  <div className="space-y-2" key={file.name}>
                    <Label htmlFor={file.name} className="font-semibold">
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

            {/* Tombol Aksi Submit */}
            <div className="flex justify-end mt-8">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data KPLT"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
