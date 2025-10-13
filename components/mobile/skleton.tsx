// Mobile Content Skeleton Components

// Base Skeleton Component
export const Skeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

// Mobile Search dengan Filter Content Skeleton (Sesuai kode asli Anda)
const MobileSearchWithFilterSkeleton = () => {
  return (
    <div className="mb-4">
      {/* Search bar */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
};

// Mobile Tabs Content Skeleton (Sesuai kode asli Anda, sedikit disesuaikan)
const MobileTabsSkeleton = () => {
  return (
    <div className="mb-4">
      <div className="flex bg-gray-200 rounded-xl p-1">
        <Skeleton className="h-10 w-1/2 rounded-md" />
        <div className="w-1"></div>
        <Skeleton className="h-10 w-1/2 rounded-md" />
      </div>
    </div>
  );
};

// Mobile Add Button Content Skeleton (Sesuai kode asli Anda)
const MobileAddButtonSkeleton = () => {
  return (
    <div className="mb-4">
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
};

// Mobile Info Card Skeleton - STRUKTUR DIPERBAIKI agar cocok dengan gambar
const MobileInfoCardSkeleton = () => {
  return (
    // Kontainer kartu dengan padding dan border bawah

    <div className="bg-white p-4 border border-gray-200 space-y-3 rounded-xl mb-4">
      {/* Baris Atas: Placeholder untuk Judul di kiri dan Ikon di kanan */}
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-3/5" /> {/* Placeholder Nama Ulok */}
        <Skeleton className="h-6 w-6" /> {/* Placeholder Ikon Edit */}
      </div>

      {/* Baris Tengah: Placeholder untuk Alamat */}
      <Skeleton className="h-4 w-4/5" />

      {/* Baris Bawah: Placeholder untuk Status di kiri dan Tanggal di kanan */}
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-14 rounded-md" />{" "}
        {/* Placeholder Badge Status */}
        <Skeleton className="h-4 w-28" /> {/* Placeholder Tanggal */}
      </div>
    </div>
  );
};

// Main Mobile Ulok Content Skeleton - Menyusun semua komponen dengan benar
export const MobileUlokContentSkeleton = () => {
  return (
    <div className="px-1 animate-pulse">
      {/* Placeholder untuk Judul Halaman */}
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Komponen Skeleton Anda dipanggil di sini dalam urutan yang benar */}
      <MobileSearchWithFilterSkeleton />
      <MobileTabsSkeleton />
      <MobileAddButtonSkeleton />
      <MobileInfoCardSkeleton />
      <MobileInfoCardSkeleton />
      <MobileInfoCardSkeleton />
    </div>
  );
};

// Mobile Detail Ulok Content Skeleton - Diperbaiki agar 100% sesuai dengan referensi
export const MobileDetailUlokContentSkeleton = () => {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header dengan Back Button dan Action Buttons */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-20 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-16 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
      </div>

      {/* Title Card */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 pr-4">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <div className="flex items-center text-sm">
              <Skeleton className="w-2 h-2 rounded-full mr-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex-shrink-0">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Data Usulan Lokasi Card */}
      <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
        {/* Section Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Skeleton className="w-5 h-5 mr-3" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        {/* Section Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* 4 fields dalam grid */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
          {/* Alamat field */}
          <div className="mt-4">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-16 w-full rounded-lg bg-gray-100" />
          </div>
          {/* LatLong field */}
          <div className="mt-4">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Data Store Card */}
      <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
        {/* Section Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Skeleton className="w-6 h-6 mr-3" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        {/* Section Content */}
        <div className="p-6">
          {/* First grid - 4 fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
          {/* Second grid - 3 fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
          {/* Harga Sewa field */}
          <div className="mt-4">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Data Pemilik Card */}
      <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
        {/* Section Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Skeleton className="w-6 h-6 mr-3" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
        {/* Section Content */}
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Map Card Skeleton */}
      <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Skeleton className="w-5 h-5 mr-3" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>

      {/* Data Approval INTIP Card (Conditional) */}
      <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Skeleton className="w-5 h-5 mr-3" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* Status & Tanggal */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
          {/* Bukti Approval */}
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
};
