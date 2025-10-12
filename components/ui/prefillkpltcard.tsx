"use client";

import React, { useState } from "react";
import { KpltBaseUIMapped } from "@/types/common";
import { LinkIcon } from "lucide-react";
import {
  ChevronDownIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

// Komponen-komponen kecil ini kita pindahkan ke sini juga
const DetailField = ({ label, value }: { label: string; value: any }) => (
  <div>
    <label className="text-gray-600 font-medium text-sm lg:text-base mb-1 block">
      {label}
    </label>
    <div className="text-gray-900 py-2 text-sm lg:text-base bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-center w-full break-words">
      {value || "-"}
    </div>
  </div>
);

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

// Komponen Utama Kartu Prefill
export default function PrefillKpltCard({ data }: { data: KpltBaseUIMapped }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] transition-all duration-500">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-lg lg:text-xl font-bold text-gray-800">
              {data.namaKplt}
            </h1>
            <p className="text-base lg:text-lg text-gray-500 mt-1">
              {data.alamat}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`transition-[max-height] duration-700 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="px-6 pb-6">
          <div className="space-y-6">
            {/* --- DATA USULAN LOKASI --- */}
            <div className="border-t border-gray-300 pt-5">
              <h4 className="flex items-center text-base lg:text-lg font-semibold text-gray-700 mb-3">
                <MapPinIcon className="w-5 h-5 mr-2 text-red-500" />
                Data Usulan Lokasi
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Provinsi" value={data.provinsi} />
                <DetailField label="Kabupaten/Kota" value={data.kabupaten} />
                <DetailField label="Kecamatan" value={data.kecamatan} />
                <DetailField
                  label="Kelurahan/Desa"
                  value={data.desaKelurahan}
                />
                <DetailField
                  label="Lat/Long"
                  value={`${data.latitude}, ${data.longitude}`}
                />
              </div>
            </div>

            {/* --- DATA STORE --- */}
            <div className="border-t border-gray-300 pt-5">
              <h4 className="flex items-center text-base lg:text-lg font-semibold text-gray-700 mb-3">
                <BuildingStorefrontIcon className="w-5 h-5 mr-2 text-blue-500" />{" "}
                Data Store
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Format Store" value={data.formatStore} />
                <DetailField label="Bentuk Objek" value={data.bentukObjek} />
                <DetailField label="Alas Hak" value={data.alasHak} />
                <DetailField label="Jumlah Lantai" value={data.jumlahLantai} />
                <DetailField label="Panjang" value={<>{data.panjang} m</>} />
                <DetailField
                  label="Lebar Depan"
                  value={<>{data.lebarDepan} m</>}
                />
                <DetailField
                  label="Luas"
                  value={
                    <>
                      {data.luas.toLocaleString("id-ID")} m<sup>2</sup>
                    </>
                  }
                />
                <DetailField
                  label="Harga Sewa (+PPN 10%)"
                  value={`Rp ${data.hargaSewa.toLocaleString("id-ID")}`}
                />
              </div>
            </div>

            {/* --- DATA PEMILIK --- */}
            <div className="border-t border-gray-300 pt-5">
              <h4 className="flex items-center text-base lg:text-lg font-semibold text-gray-700 mb-3">
                <UserIcon className="w-5 h-5 mr-2 text-green-500" /> Data
                Pemilik
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Nama Pemilik" value={data.namaPemilik} />
                <DetailField
                  label="Kontak Pemilik"
                  value={data.kontakPemilik}
                />
              </div>
            </div>

            {/* --- FORM KELENGKAPAN --- */}
            <div className="border-t border-gray-300 pt-5">
              <h4 className="flex items-center text-base lg:text-lg font-semibold text-gray-700 mb-3">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-purple-500" />{" "}
                Form Kelengkapan
              </h4>
              <div className="space-y-4">
                <FileLink label="File Intip" url={data.fileIntip} />
                <FileLink label="Form ULOK" url={data.formUlok} />
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
      >
        <ChevronDownIcon
          className={`w-6 h-6 mx-auto transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}
