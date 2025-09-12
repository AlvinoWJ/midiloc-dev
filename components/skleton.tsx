// components/skeleton.tsx atau components/skeleton.jsx

export const Skeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

// Skeleton khusus untuk detail ulok
export const DetailUlokSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="border-b pb-4">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>

      {/* Data Pemilik Section */}
      <div className="border-t pt-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>

      {/* Data Approval Section */}
      <div className="border-t pt-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  );
};

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
