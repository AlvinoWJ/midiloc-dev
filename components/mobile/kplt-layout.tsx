// // components/mobile/KPLT-layout.tsx
// "use client";

// import { useState } from "react";
// import MobileSidebar from "./sidebar";
// import MobileNavbar from "./navbar";
// import { DashboardPageProps } from "@/types/common";

// export default function DesktopDashboardLayout(props: DashboardPageProps) {
//   const { user, isLoading, isError } = props;
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   return (
//     <div className="min-h-screen bg-gray-50 relative">
//       {/* Mobile Sidebar */}
//       <div className="relative z-50">
//         <MobileSidebar
//           isOpen={isMobileMenuOpen}
//           onClose={() => setIsMobileMenuOpen(false)}
//           user={user}
//           isLoading={isLoading}
//           isError={isError}
//         />
//       </div>
//       {isMobileMenuOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-40"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}

//       {/* Mobile Navbar */}
//       <div className="relative z-30">
//         <MobileNavbar
//           user={user}
//           isLoading={isLoading}
//           isError={isError}
//           onMenuClick={() => setIsMobileMenuOpen(true)}
//         />
//       </div>

//       {/* Main Content */}
//       <main className="px-4 py-4 space-y-4 relative z-10">
//         {isLoading ? (
//           // Skeleton Loading State
//           <div>
//             <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse"></div>
//             <div className="mt-4 h-96 w-full bg-gray-200 rounded-lg animate-pulse"></div>
//           </div>
//         ) : isError ? (
//           // Error State
//           <div className="flex flex-col items-center justify-center py-16 text-center">
//             <div className="text-red-500 text-6xl mb-4">⚠️</div>
//             <h3 className="text-lg font-semibold">Gagal Memuat Data</h3>
//             <p className="text-gray-600 mb-4 text-sm">
//               Silakan coba lagi nanti.
//             </p>
//             <button
//               onClick={() => window.location.reload()}
//               className="bg-red-500 text-white px-6 py-3 rounded-lg w-full max-w-xs"
//             >
//               Muat Ulang
//             </button>
//           </div>
//         ) : (
//           // Content Loaded State
//           <>
//             <h1 className="text-2xl font-bold text-gray-900">KPLT</h1>
//           </>
//         )}
//       </main>
//     </div>
//   );
// }
