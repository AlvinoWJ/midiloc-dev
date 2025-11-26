"use client";

import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  ArrowLeft,
  Store,
  UserSquare,
  DollarSign,
  Activity,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DetailMapCard from "@/components/map/DetailMapCard";
import { DetailUlokSkeleton } from "../ui/skleton";
import { TokoExistingDetailData } from "@/hooks/toko_existing/useTokoExistingDetail";

interface DetailTokoExistingLayoutProps {
  isLoading?: boolean;
  data?: TokoExistingDetailData;
}

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div>
    <label className="block font-semibold text-base lg:text-lg mb-2 text-gray-700">
      {label}
    </label>
    <div className="text-gray-900 py-2 text-base font-medium bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-center w-full break-words border border-gray-200">
      {value !== null && value !== undefined && value !== "" ? value : "-"}
    </div>
  </div>
);

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function DetailTokoExistingLayout({
  isLoading,
  data,
}: DetailTokoExistingLayoutProps) {
  const router = useRouter();

  if (isLoading) {
    return <DetailUlokSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-lg text-gray-500">
          Data Toko Existing tidak ditemukan.
        </p>
        <Button onClick={() => router.back()} variant="back">
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <main className="space-y-4 lg:space-y-6 pb-16 lg:pb-8">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => router.back()} variant="back">
          <ArrowLeft size={20} className="mr-1" />
          Kembali
        </Button>
      </div>

      <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)] border-l-4 border-blue-600">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1 pr-4 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-3 uppercase">
              {data.nama || "-"}
            </h1>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={14} className="mr-2 flex-shrink-0" />
                <span>Grand Opening: </span>
                <span className="ml-1 font-medium text-gray-900">
                  {formatDate(data.tgl_go)}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText size={14} className="mr-2 flex-shrink-0" />
                <span>Nama KPLT: </span>
                <span className="ml-1 font-medium text-gray-900">
                  {data.nama_kplt || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
            <span className="bg-blue-100 text-blue-800 text-base font-bold px-3 py-1 rounded border border-blue-400">
              {data.kode_store || "NO CODE"}
            </span>
            <span className="bg-gray-100 text-gray-800 text-base font-bold px-3 py-1 rounded border border-gray-400">
              {data.tipe_toko || "Tipe -"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <DetailMapCard
          id={data.kode_store || "existing"}
          latitude={data.latitude ? String(data.latitude) : null}
          longitude={data.longitude ? String(data.longitude) : null}
          approval_status="Existing"
        />
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center">
              <MapPin className="text-red-500 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Detail Lokasi
              </h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Provinsi" value={data.provinsi} />
              <DetailField label="Kabupaten/Kota" value={data.kabupaten} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Kecamatan" value={data.kecamatan} />
              <DetailField label="Kelurahan/Desa" value={data.desa_kelurahan} />
            </div>
            <DetailField label="Alamat Lengkap" value={data.alamat} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField
                label="Karakter Lokasi"
                value={data.karakter_lokasi}
              />
              <DetailField label="Sosial Ekonomi" value={data.sosial_ekonomi} />
            </div>
          </div>
        </div>

        {/* 2. KARTU DATA PEMILIK */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center">
              <UserSquare className="text-purple-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Data Pemilik
              </h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Nama Pemilik" value={data.nama_pemilik} />
            <DetailField label="Kontak Pemilik" value={data.kontak_pemilik} />
          </div>
        </div>

        {/* 3. KARTU SPESIFIKASI STORE */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center">
              <Store className="text-blue-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Spesifikasi Store
              </h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Format Store" value={data.format_store} />
            <DetailField label="Bentuk Objek" value={data.bentuk_objek} />
            <DetailField label="Alas Hak" value={data.alas_hak} />
            <DetailField label="Jumlah Lantai" value={data.jumlah_lantai} />
            <DetailField label="Panjang (m)" value={data.panjang} />
            <DetailField label="Lebar Depan (m)" value={data.lebar_depan} />
            <DetailField label="Luas (m²)" value={data.luas} />
            <DetailField label="Tipe Toko" value={data.tipe_toko} />
          </div>
        </div>

        {/* 4. KARTU PERFORMA TOKO */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center">
              <Activity className="text-orange-500 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Performa Toko
              </h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="SPD" value={formatCurrency(data.spd)} />
            <DetailField label="STD" value={data.std} />
            <DetailField label="APC" value={formatCurrency(data.apc)} />
            <DetailField label="PE RAB" value={`${data.pe_rab || 0}%`} />
          </div>
        </div>

        {/* 5. KARTU INFORMASI SEWA & LEGAL */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 rounded-t-xl">
            <div className="flex items-center">
              <DollarSign className="text-green-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Informasi Sewa & Legal
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField
                label="Awal Sewa"
                value={formatDate(data.awal_sewa)}
              />
              <DetailField
                label="Akhir Sewa"
                value={formatDate(data.akhir_sewa)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField
                label="Periode Sewa (Tahun)"
                value={data.periode_sewa}
              />
              <DetailField
                label="Grace Period (Bulan)"
                value={data.grace_period}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField
                label="Nilai Sewa"
                value={formatCurrency(data.nilai_sewa)}
              />
              <DetailField
                label="Harga Final"
                value={formatCurrency(data.harga_final)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Status Pajak" value={data.status_pajak} />
              <DetailField label="Pembayaran PPH" value={data.pembayaran_pph} />
            </div>
            <DetailField label="Cara Pembayaran" value={data.cara_pembayaran} />
          </div>
        </div>
      </div>
    </main>
  );
}
