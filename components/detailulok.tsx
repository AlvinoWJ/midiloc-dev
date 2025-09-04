"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UlokData {
  namaUlok: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  latlong: string;
  tanggalUlok: string;
  formatStore: string;
  bentukObjek: string;
  alasHak: string;
  jumlahlantai: string;
  lebardepan: string;
  panjang: string;
  luas: string;
  hargasewa: string;
  namapemilik: string;
  kontakpemilik: string;
}

// --- PERBAIKAN DI SINI ---
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <p className="block font-bold mb-1 text-sm text-gray-700">{label}</p>
    {/* Mengganti <p> menjadi <div> agar bisa menerima elemen blok seperti <div> */}
    <div className="text-gray-900">{value || "-"}</div>
  </div>
);
// --- BATAS PERBAIKAN ---

export default function DetailUlok({ data }: { data: UlokData }) {
  const router = useRouter();

  return (
    <div className="relative max-w-7xl mx-auto my-10 px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
      </Button>

      {/* --- KARTU INFORMASI LOKASI --- */}
      <div className="relative mb-8">
        <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
          Data Lokasi
        </div>
        <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 pt-10 space-y-5">
          <DetailItem label="Nama ULOK" value={data.namaUlok} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DetailItem label="Provinsi" value={data.provinsi} />
            <DetailItem label="Kabupaten/Kota" value={data.kabupaten} />
            <DetailItem label="Kecamatan" value={data.kecamatan} />
            <DetailItem label="Kelurahan/Desa" value={data.kelurahan} />
          </div>
          <DetailItem label="Alamat" value={data.alamat} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DetailItem
              label="LatLong"
              value={
                <div className="flex items-center">
                  <span>{data.latlong}</span>
                  <MapPin className="ml-2 text-red-500" size={18} />
                </div>
              }
            />
            <DetailItem
              label="Tanggal ULOK"
              value={new Date(data.tanggalUlok).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </div>
        </div>
      </div>

      {/* --- KARTU DATA STORE --- */}
      <div className="relative mb-8">
        <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
          Data Store
        </div>
        <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 pt-10 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DetailItem label="Format Store" value={data.formatStore} />
            <DetailItem label="Bentuk Objek" value={data.bentukObjek} />
            <DetailItem label="Alas Hak" value={data.alasHak} />
            <DetailItem label="Jumlah Lantai" value={data.jumlahlantai} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <DetailItem label="Lebar Depan (m)" value={data.lebardepan} />
            <DetailItem label="Panjang (m)" value={data.panjang} />
            <DetailItem label="Luas (m²)" value={data.luas} />
          </div>
          <DetailItem label="Harga Sewa (+PPH 10%)" value={data.hargasewa} />
        </div>
      </div>

      {/* --- KARTU DATA PEMILIK --- */}
      <div className="relative mb-8">
        <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-bold">
          Data Pemilik
        </div>
        <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 pt-10 space-y-5">
          <DetailItem label="Nama Pemilik" value={data.namapemilik} />
          <DetailItem label="Kontak Pemilik" value={data.kontakpemilik} />
        </div>
      </div>
    </div>
  );
}
