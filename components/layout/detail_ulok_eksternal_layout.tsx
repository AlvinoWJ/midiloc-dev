"use client";

import { useRouter } from "next/navigation";
import { UlokEksternalDetail } from "@/hooks/ulok_eksternal/useUlokEksternalDetail";
import { UlokPageSkeleton } from "@/components/ui/skleton";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  User,
  Building,
  ClipboardList,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/statusbadge";
import DetailMapCard from "@/components/map/DetailMapCard";
import Image from "next/image";
import { format } from "date-fns";
import { id as inLocale } from "date-fns/locale";

// Helper untuk memformat mata uang
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

// Helper untuk mendapatkan URL gambar (asumsi bucket 'midiloc')
const getStorageUrl = (path: string) => {
  if (!path) return "/bg_alfamidi.png"; // Gambar default
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/midiloc/${path}`;
};

const DetailCard = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ${className}`}
  >
    {/* Header Kartu */}
    <div className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
    {/* Konten Kartu */}
    <div className="p-6">{children}</div>
  </div>
);

type DetailUlokEksternalLayoutProps = {
  ulok: UlokEksternalDetail | null;
  isLoading: boolean;
  isError: boolean;
};

export default function DetailUlokEksternalLayout({
  ulok,
  isLoading,
  isError,
}: DetailUlokEksternalLayoutProps) {
  const router = useRouter();

  if (isLoading) {
    return <UlokPageSkeleton />; // Pakai skeleton yang ada
  }

  if (isError || !ulok) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isError ? "Gagal Memuat Data" : "Data Tidak Ditemukan"}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {isError
            ? "Terjadi kesalahan saat mengambil data."
            : "Data ulok eksternal dengan ID ini tidak dapat ditemukan."}
        </p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header (Tombol Kembali dan Judul) */}
      <div className="flex items-center justify-between gap-4">
        <Button onClick={() => router.back()} variant="back">
          <ArrowLeft size={20} className="mr-1" />
          Kembali
        </Button>

        <StatusBadge status={ulok.status_ulok_eksternal} />
      </div>

      {/* 2. Konten Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (Info) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Lokasi */}
          <DetailCard
            title="Informasi Lokasi"
            icon={<MapPin className="w-5 h-5 text-red-500" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                label="Alamat"
                value={ulok.alamat}
                className="md:col-span-2"
              />
              <InfoItem label="Desa/Kelurahan" value={ulok.desa_kelurahan} />
              <InfoItem label="Kecamatan" value={ulok.kecamatan} />
              <InfoItem label="Kabupaten/Kota" value={ulok.kabupaten} />
              <InfoItem label="Provinsi" value={ulok.provinsi} />
            </div>
          </DetailCard>

          {/* Spesifikasi Objek */}
          <DetailCard
            title="Spesifikasi Objek"
            icon={<Building className="w-5 h-5 text-red-500" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Bentuk Objek" value={ulok.bentuk_objek} />
              <InfoItem label="Alas Hak" value={ulok.alas_hak} />
              <InfoItem
                label="Jumlah Lantai"
                value={ulok.jumlah_lantai.toString()}
              />
              <InfoItem label="Lebar Depan" value={`${ulok.lebar_depan} m`} />
              <InfoItem label="Panjang" value={`${ulok.panjang} m`} />
              <InfoItem label="Luas" value={`${ulok.luas} m²`} />
              <InfoItem
                label="Harga Sewa/Tahun"
                value={formatCurrency(ulok.harga_sewa)}
                className="md:col-span-2"
              />
            </div>
          </DetailCard>

          {/* Informasi Pemilik */}
          <DetailCard
            title="Informasi Pemilik"
            icon={<User className="w-5 h-5 text-red-500" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Nama Pemilik" value={ulok.nama_pemilik} />
              <InfoItem label="Kontak Pemilik" value={ulok.kontak_pemilik} />
            </div>
          </DetailCard>
        </div>

        {/* Kolom Kanan (Peta & Foto) */}
        <div className="space-y-6">
          {/* Peta */}
          <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ">
            <DetailMapCard
              latitude={ulok.latitude}
              longitude={ulok.longitude}
            />
          </div>

          {/* Foto Lokasi */}
          <DetailCard
            title="Foto Lokasi"
            icon={<Camera className="w-5 h-5 text-red-500" />}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
              {/* <Image
                src={getStorageUrl(ulok.foto_lokasi)}
                alt="Foto Lokasi"
                layout="fill"
                objectFit="cover"
                onError={(e: any) =>
                  (e.currentTarget.src = "/bg_alfamidi2.png")
                }
              /> */}
            </div>
          </DetailCard>
          <DetailCard
            title="Riwayat"
            icon={<ClipboardList className="w-5 h-5 text-red-500" />}
          >
            <div className="space-y-4">
              {ulok.created_at && (
                <InfoItem
                  label="Dibuat Pada"
                  value={format(
                    new Date(ulok.created_at),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: inLocale,
                    }
                  )}
                />
              )}
              {ulok.updated_at && (
                <InfoItem
                  label="Diperbarui Pada"
                  value={format(
                    new Date(ulok.updated_at),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: inLocale,
                    }
                  )}
                />
              )}
              {ulok.approved_at && (
                <InfoItem
                  label="Disetujui Pada"
                  value={format(
                    new Date(ulok.approved_at),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: inLocale,
                    }
                  )}
                />
              )}
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null;
  className?: string;
}) => (
  <div className={className}>
    <dt className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
      {label}
    </dt>
    <dd className="text-base bg-gray-100 font-medium px-4 py-3 rounded-lg">
      {value || "-"}
    </dd>
  </div>
);
