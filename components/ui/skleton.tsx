// Unified Responsive Skeleton Components
// Mendukung Desktop dan Mobile dalam satu file

// Base Skeleton Component
export const Skeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

// ============================================================================
// SEARCH WITH FILTER SKELETON - RESPONSIVE
// ============================================================================
export const SearchWithFilterSkeleton = () => {
  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:flex items-center gap-5">
        <Skeleton className="h-[46px] w-80 rounded-xl" />
        <Skeleton className="w-[46px] h-[46px] rounded-xl" />
      </div>

      {/* Mobile Version */}
      <div className="md:hidden mb-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </>
  );
};

// ============================================================================
// TABS SKELETON - RESPONSIVE
// ============================================================================
export const TabsSkeleton = () => {
  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:inline-flex w-[482px] bg-white rounded-2xl p-1 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
        <Skeleton className="flex-1 h-[40px] rounded-xl mr-1" />
        <Skeleton className="flex-1 h-[40px] rounded-xl" />
      </div>

      {/* Mobile Version */}
      <div className="md:hidden mb-4">
        <div className="flex bg-gray-200 rounded-xl p-1">
          <Skeleton className="h-10 w-1/2 rounded-md" />
          <div className="w-1"></div>
          <Skeleton className="h-10 w-1/2 rounded-md" />
        </div>
      </div>
    </>
  );
};

// ============================================================================
// ADD BUTTON SKELETON - RESPONSIVE
// ============================================================================
export const AddButtonSkeleton = () => {
  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:block">
        <Skeleton className="w-[46px] h-[46px] rounded-full" />
      </div>

      {/* Mobile Version */}
      <div className="md:hidden mb-4">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </>
  );
};

// ============================================================================
// INFO CARD SKELETON - RESPONSIVE
// ============================================================================
export const InfoCardSkeleton = () => {
  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:block w-full bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.15)] p-6">
        {/* Header: Title + Edit Icon */}
        <div className="flex justify-between items-start mb-16">
          <div className="flex-1">
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* Footer: Status Badge + Date */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden bg-white p-4 border border-gray-200 space-y-3 rounded-xl shadow-sm">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-6 w-6" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </>
  );
};

// ============================================================================
// ULOK CARDS SKELETON - RESPONSIVE GRID
// ============================================================================
export const UlokCardsSkeleton = ({ count }: { count: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <InfoCardSkeleton key={i} />
      ))}
    </div>
  );
};

// ============================================================================
// ULOK PAGE SKELETON - RESPONSIVE
// ============================================================================
export const UlokPageSkeleton = ({ cardCount = 6 }: { cardCount?: number }) => {
  return (
    <div className="space-y-6">
      {/* Title - Mobile */}
      <div className="md:hidden">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Header Section - Desktop: Title + Search */}
      <div className="flex items-center justify-between">
        {/* Desktop Title */}
        <div className="hidden md:block">
          <Skeleton className="h-10 w-56" />
        </div>
        {/* Desktop Search & Filter */}
        <div className="hidden md:flex items-center gap-5">
          <Skeleton className="h-[46px] w-80 rounded-xl" />
          <Skeleton className="w-[46px] h-[46px] rounded-xl" />
        </div>
      </div>

      {/* Search - Mobile Only */}
      <div className="md:hidden">
        <SearchWithFilterSkeleton />
      </div>

      {/* Tabs & Add Button Section */}
      <div className="flex items-center justify-between">
        <TabsSkeleton />
        <div className="hidden md:block">
          <AddButtonSkeleton />
        </div>
      </div>

      {/* Add Button - Mobile Only (full width) */}
      <div className="md:hidden">
        <AddButtonSkeleton />
      </div>

      {/* Cards Grid */}
      <UlokCardsSkeleton count={cardCount} />
    </div>
  );
};

// ============================================================================
// DETAIL ULOK SKELETON - RESPONSIVE
// ============================================================================
export const DetailUlokSkeleton = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-0 py-4 md:py-0">
        {/* Header with Back and Edit buttons */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="rounded-full w-20 h-10" />
          <div className="flex gap-2 md:gap-3">
            <Skeleton className="rounded-full w-16 h-10" />
            <Skeleton className="hidden md:block rounded-full w-20 h-10" />
          </div>
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 pr-4">
              <Skeleton className="h-8 w-full md:w-64 mb-2" />
              <div className="flex items-center text-sm">
                <Skeleton className="w-2 h-2 rounded-full mr-2" />
                <Skeleton className="h-4 w-32 md:w-48" />
              </div>
            </div>
            <div className="flex-shrink-0">
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>

        {/* Data Usulan Lokasi Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-3" />
              <Skeleton className="h-5 w-40 md:w-48" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mb-4 md:mb-0">
                  <Skeleton className="h-4 w-16 md:w-24 mb-2" />
                  <Skeleton className="h-10 w-full rounded bg-gray-50" />
                </div>
              ))}
            </div>
            <div className="mb-4 mt-4">
              <Skeleton className="h-4 w-12 md:w-16 mb-2" />
              <Skeleton className="h-16 w-full rounded bg-gray-50" />
            </div>
            <div className="mb-4">
              <Skeleton className="h-4 w-16 md:w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded bg-gray-50" />
            </div>
          </div>
        </div>

        {/* Data Store Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-6 h-6 mr-3" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20 md:w-24" />
                  <Skeleton className="h-10 w-full rounded bg-gray-50" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full rounded bg-gray-50" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 md:w-40" />
                <Skeleton className="h-10 w-full rounded bg-gray-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Data Pemilik Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-6 h-6 mr-3" />
              <Skeleton className="h-5 w-24 md:w-28" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded bg-gray-50" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Map Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-3" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-48 md:h-64 w-full rounded" />
          </div>
        </div>

        {/* Data Approval INTIP Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-3" />
              <Skeleton className="h-5 w-36 md:w-44" />
            </div>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 md:w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 md:w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 mt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-48 md:h-60 max-w-xs rounded-lg" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 md:mt-8 flex justify-end">
          <Skeleton className="h-12 w-full md:w-48 rounded-lg md:rounded-full" />
        </div>
      </div>
    </div>
  );
};
