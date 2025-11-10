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
// ULOK PAGE SKELETON - RESPONSIVE (100% MATCHED LAYOUT)
// ============================================================================
export const UlokPageSkeleton = ({ cardCount = 9 }: { cardCount?: number }) => {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header: Judul dan Search/Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title */}
        <Skeleton className="h-8 lg:h-10 w-40 lg:w-56" />

        {/* Search & Filter */}
        <div className="flex items-center gap-5">
          <Skeleton className="h-12 lg:h-[46px] w-full lg:w-80 rounded-lg lg:rounded-xl" />
          <Skeleton className="hidden lg:block w-[46px] h-[46px] rounded-xl" />
        </div>
      </div>

      {/* Kontrol: Tabs dan Tombol Tambah */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-gray-200 rounded-xl p-1 lg:inline-flex lg:w-[482px] lg:bg-white lg:rounded-2xl lg:shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-10 w-1/2 rounded-md lg:flex-1 lg:h-[40px] lg:rounded-xl lg:mr-1" />
          <div className="w-1"></div>
          <Skeleton className="h-10 w-1/2 rounded-md lg:flex-1 lg:h-[40px] lg:rounded-xl" />
        </div>

        {/* Add Button */}
        <Skeleton className="h-12 w-full rounded-xl lg:w-[46px] lg:h-[46px] lg:rounded-full" />
      </div>

      {/* Cards Grid/List */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
        {Array.from({ length: cardCount }).map((_, i) => (
          <InfoCardSkeleton key={i} />
        ))}
      </div>
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

// ============================================================================
// DASHBOARD PERFORMA SKELETON - RESPONSIVE (100% MATCHED LAYOUT)
// ============================================================================
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Section: Title + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Filter Controls */}
        <div>
          <Skeleton className="h-[42px] w-full lg:w-[424px] rounded-lg" />
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[82px] rounded-xl" />
        ))}
      </div>

      {/* Charts Section - 2x2 Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="lg:h-[464px] rounded-lg" />
        <Skeleton className="lg:h-[464px] rounded-lg" />
        <Skeleton className="lg:h-[464px] rounded-lg" />
        <Skeleton className="lg:h-[464px] rounded-lg" />
      </div>

      {/* Map Section */}
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
};

// ============================================================================
// KPLT PAGE SKELETON - RESPONSIVE WITH ACCORDION
// ============================================================================
export const KpltSkeleton = ({
  accordionCount = 3,
  cardsPerAccordion = 3,
}: {
  accordionCount?: number;
  cardsPerAccordion?: number;
}) => {
  return (
    <main className="space-y-4 lg:space-y-6">
      {/* Header: Title + Search/Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Skeleton className="h-9 md:h-10 w-32" />
        <div className="flex items-center gap-5">
          <Skeleton className="h-12 lg:h-[46px] w-full lg:w-80 rounded-lg lg:rounded-xl" />
          <Skeleton className="hidden lg:block w-[46px] h-[46px] rounded-xl" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-200 rounded-xl p-1 lg:inline-flex lg:w-[482px] lg:bg-white lg:rounded-2xl lg:shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-10 w-1/2 rounded-md lg:flex-1 lg:h-[40px] lg:rounded-xl lg:mr-1" />
          <div className="w-1"></div>
          <Skeleton className="h-10 w-1/2 rounded-md lg:flex-1 lg:h-[40px] lg:rounded-xl" />
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-6">
        {Array.from({ length: accordionCount }).map((_, i) => (
          <div key={i}>
            {/* Accordion Header */}
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="w-6 h-6" />
              <Skeleton className="h-6 w-32 md:w-40" />
              <Skeleton className="h-8 w-12 rounded-full" />
            </div>

            {/* Cards Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: cardsPerAccordion }).map((_, j) => (
                <InfoCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

// ============================================================================
// Detail KPLT PAGE SKELETON
// ============================================================================
export default function DetailKpltSkeleton() {
  return (
    <main className="space-y-4 lg:space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Prefill Card Skeleton - Sesuai dengan gambar */}
        <div className="mb-10">
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6">
            {/* Header */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Analisis Kelayakan Lokasi Skeleton - Updated dengan DetailCard style */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mt-10">
          {/* Header Card */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 rounded mr-3" />
              <Skeleton className="h-6 w-56" />
            </div>
          </div>
          {/* Content Card */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dokumen Terlampir Skeleton - Updated dengan DetailCard style */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mt-10">
          {/* Header Card */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 rounded mr-3" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
          {/* Content Card */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <Skeleton className="w-6 h-6 flex-shrink-0" />
                  <div className="flex flex-col flex-grow space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="w-4 h-4 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// PROGRESS KPLT PAGE SKELETON
// ============================================================================
export function ProgressKpltSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-6 flex flex-col flex-grow animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title Skeleton */}
        <div className="h-8 lg:h-10 bg-gray-200 rounded-lg w-48 lg:w-64"></div>

        {/* Search and Filter Skeleton */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="h-10 bg-gray-200 rounded-lg w-64 lg:w-80"></div>
          </div>
          {/* Filter Button */}
          <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 min-h-[23rem] flex-grow">
        {[...Array(9)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Title */}
                <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
                {/* Subtitle/Address */}
                <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
              </div>
              {/* Edit Icon */}
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
            </div>

            {/* Progress Bar Section */}
            <div className="space-y-2 pt-2">
              {/* Progress Bar */}
              <div className="h-2 bg-gray-200 rounded-full w-full"></div>
              {/* Date */}
              <div className="flex justify-end">
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center gap-1 mt-auto pt-6">
        {/* First Page Button */}
        <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
        {/* Previous Button */}
        <div className="h-9 w-9 bg-gray-200 rounded-full"></div>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 w-10 bg-gray-200 rounded-full"></div>
          ))}
        </div>

        {/* Next Button */}
        <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
        {/* Last Page Button */}
        <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
}
