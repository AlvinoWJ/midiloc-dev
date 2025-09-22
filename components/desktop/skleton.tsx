// components/skeleton.tsx atau components/skeleton.jsx

export const Skeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

// Skeleton untuk DetailUlok - 100% identik dengan layout asli
export const DetailUlokSkeleton = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back and Edit buttons skeleton */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="rounded-full w-20 h-10" />
          <div className="flex gap-3">
            <Skeleton className="rounded-full w-16 h-10" />
          </div>
        </div>

        {/* Title Card skeleton */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 pr-4">
              {/* Title skeleton */}
              <Skeleton className="h-8 w-64 mb-2" />
              {/* Date info skeleton */}
              <div className="flex items-center text-sm">
                <Skeleton className="w-2 h-2 rounded-full mr-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            {/* Status badge skeleton */}
            <div className="flex-shrink-0">
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>

        {/* Data Usulan Lokasi Card skeleton */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          {/* Card header skeleton */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-3" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
          {/* Card content skeleton */}
          <div className="p-6">
            {/* Grid for Province, Kabupaten, Kecamatan, Kelurahan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="mb-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="mb-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="mb-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="mb-4">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
            </div>
            {/* Alamat field */}
            <div className="mb-4">
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-16 w-full rounded bg-gray-50" />
            </div>
            {/* LatLong field */}
            <div className="mb-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full rounded bg-gray-50" />
            </div>
          </div>
        </div>

        {/* Data Store Card skeleton */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          {/* Card header skeleton */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-6 h-6 mr-3" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          {/* Card content skeleton */}
          <div className="p-6">
            {/* First row - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-18" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-26" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
            </div>
            {/* Second row - 3 columns for Lebar Depan, Panjang, Luas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-22" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
            </div>
            {/* Harga Sewa field - single column */}
            <div className="mt-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Data Pemilik Card skeleton */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          {/* Card header skeleton */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-6 h-6 mr-3" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          {/* Card content skeleton */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
            </div>
          </div>
        </div>

        {/* DetailMapCard skeleton */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-3" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-64 w-full rounded" />
          </div>
        </div>

        {/* Data Approval INTIP Card skeleton (conditional) */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          {/* Card header skeleton */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-3" />
              <Skeleton className="h-5 w-44" />
            </div>
          </div>
          {/* Card content skeleton */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            {/* File section */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-60 max-w-xs rounded-lg" />
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="mt-8 flex justify-end">
          <Skeleton className="h-12 w-48 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------------------- //

// Skeleton untuk InfoCard
export const InfoCardSkeleton = () => {
  return (
    <div className="w-[330px] h-[151px] shadow-[1px_1px_6px_rgba(0,0,0,0.25)] bg-white rounded-lg border bg-border-white">
      {/* CardHeader skeleton */}
      <div className="flex flex-row justify-between items-start space-y-0 p-6 pb-2">
        <div className="flex-1 min-w-0">
          {/* CardTitle skeleton */}
          <Skeleton className="h-7 w-40 mb-2" />
          {/* CardDescription skeleton */}
          <Skeleton className="h-5 w-[230px]" />
        </div>
        {/* Edit icon skeleton */}
        <Skeleton className="w-[27px] h-[27px] rounded" />
      </div>

      {/* CardFooter skeleton */}
      <div className="flex justify-between items-center p-6 pt-6">
        {/* StatusBadge skeleton */}
        <Skeleton className="h-6 w-20 rounded-full" />
        {/* Date skeleton */}
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  );
};

// Skeleton untuk SearchWithFilter - 100% identik
export const SearchWithFilterSkeleton = () => {
  return (
    <div className="flex items-center gap-5 relative">
      {/* SearchBar skeleton */}
      <Skeleton className="h-[46px] w-80 rounded-xl" />

      {/* Filter button skeleton */}
      <Skeleton className="w-[46px] h-[46px] rounded-xl" />
    </div>
  );
};

// Skeleton untuk Tabs - 100% identik
export const TabsSkeleton = () => {
  return (
    <div className="inline-flex w-[482px] bg-white rounded-2xl p-1 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
      <Skeleton className="flex-1 h-[40px] rounded-xl mr-1" />
      <Skeleton className="flex-1 h-[40px] rounded-xl" />
    </div>
  );
};

// Skeleton untuk AddButton
export const AddButtonSkeleton = () => {
  return <Skeleton className="w-[46px] h-[46px] rounded-full" />;
};

// Skeleton untuk grid cards dengan jumlah dinamis
export const UlokCardsSkeleton = ({ count }: { count: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <InfoCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Skeleton untuk seluruh halaman Usulan Lokasi - 100% identik dengan spacing exact
export const UlokPageSkeleton = ({ cardCount = 6 }: { cardCount?: number }) => {
  return (
    <>
      {/* Header atas skeleton - spacing exact sama dengan original */}
      <div className="flex items-center justify-between">
        {/* Title skeleton - dengan margin exact */}
        <div className="mt-3 mb-4">
          <Skeleton className="h-9 w-64" />
        </div>
        {/* SearchWithFilter skeleton */}
        <SearchWithFilterSkeleton />
      </div>

      {/* Tab Recent & History + Add skeleton - spacing exact */}
      <div className="flex items-center justify-between">
        <TabsSkeleton />
        <AddButtonSkeleton />
      </div>

      {/* Cards grid skeleton - spacing exact sama dengan original */}
      <UlokCardsSkeleton count={cardCount} />
    </>
  );
};
