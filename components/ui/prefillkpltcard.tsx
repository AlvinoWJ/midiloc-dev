"use client";

import React, { useState } from "react";
import { KpltBaseUIMapped, Properti } from "@/types/common";
import { LinkIcon } from "lucide-react";
import PetaLoader from "../map/PetaLoader";
import {
  ChevronDownIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import { CheckCircle, XCircle, History } from "lucide-react";
import { ApprovalDetail } from "@/hooks/kplt/useKpltDetail";

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

const formatLogDate = (isoDate: string | null): string => {
  if (!isoDate) return "-";
  try {
    return new Date(isoDate).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "-";
  }
};

const ApprovalLogItem = ({ approval }: { approval: ApprovalDetail }) => {
  const isApproved = approval.is_approved;
  const statusText = isApproved ? "Disetujui" : "Ditolak";
  const statusColor = isApproved ? "text-green-600" : "text-red-600";
  const Icon = isApproved ? CheckCircle : XCircle;
  const bgColor = isApproved ? "bg-green-50" : "bg-red-50";
  const borderColor = isApproved ? "border-green-200" : "border-red-200";

  return (
    <div
      className={`flex items-start p-4 rounded-lg border rounded-xl ${bgColor} ${borderColor}`}
    >
      <Icon className={`w-6 h-6 ${statusColor} mr-4 mt-1 flex-shrink-0`} />
      <div className="flex-grow">
        <p className="font-semibold text-gray-800">{approval.position_nama}</p>
        <p className={`text-sm font-medium ${statusColor}`}>{statusText}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatLogDate(approval.approved_at)}
        </p>
      </div>
    </div>
  );
};

export default function PrefillKpltCard({
  baseData,
  approvalsData,
}: {
  baseData: KpltBaseUIMapped;
  approvalsData?: ApprovalDetail[] | undefined; // Tambahkan prop baru
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const data = baseData;

  const handleRouteClick = () => {
    if (!data.latitude || !data.longitude) {
      alert("Koordinat tujuan tidak tersedia.");
      return;
    }

    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: userLat, longitude: userLng } = position.coords;
        const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${data.latitude},${data.longitude}`;
        window.open(googleMapsUrl, "_blank");
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation Error:", error.message);
        alert(
          "Gagal mendapatkan lokasi Anda. Mencoba membuka rute tanpa lokasi awal."
        );
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`;
        window.open(fallbackUrl, "_blank");
        setIsGettingLocation(false);
      }
    );
  };

  const markerData: Properti[] = [
    {
      id: data?.id ?? "",
      latitude: data.latitude,
      longitude: data.longitude,
      nama_ulok: data.namaKplt,
      alamat: data.alamat,
      approval_status: data.kpltapproval ?? "",
      created_at: "",
      type: "kplt",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] transition-all duration-500">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start">
          {/* --- Kolom Kiri (Judul, Alamat, Tanggal) --- */}
          <div className="flex-1 min-w-0 pr-4 mb-4 md:mb-0">
            <h1 className="text-lg lg:text-xl font-bold text-gray-800">
              {data.namaKplt}
            </h1>
            <p className="text-base lg:text-lg text-gray-500 mt-1">
              {data.alamat}
            </p>
            {data.created_at && (
              <p className="flex items-center text-sm lg:text-base text-gray-500 mt-2">
                <CalendarIcon className="w-4 h-4 mr-1.5" />
                Dibuat pada: {data.created_at}
              </p>
            )}
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
              </div>
              {/* --- BAGIAN LAT/LONG DIGANTI DENGAN PETA INI --- */}
              <div className="mt-4 col-span-1 md:col-span-2">
                <label className="text-gray-600 font-medium text-sm mb-2 block">
                  Peta Lokasi
                </label>
                <div className="w-full h-80 rounded-lg overflow-hidden border">
                  {data.latitude && data.longitude ? (
                    <PetaLoader
                      data={markerData}
                      centerPoint={[
                        Number(data.latitude),
                        Number(data.longitude),
                      ]}
                      showPopup={false}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-100">
                      <p>Koordinat tidak tersedia.</p>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-blue-600">
                  Koordinat: {data.latitude || "N/A"}, {data.longitude || "N/A"}
                </p>

                <div className="mt-4">
                  <button
                    onClick={handleRouteClick}
                    disabled={isGettingLocation}
                    className="flex items-center justify-center w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {isGettingLocation
                      ? "Mencari Lokasi..."
                      : "Lihat Rute di Google Maps"}
                  </button>
                </div>
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
