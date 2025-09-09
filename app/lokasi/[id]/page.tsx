// app/lokasi/[id]/page.tsx
'use client';

// 1. Import 'use' dari React
import { use } from 'react'; 
// Import semua komponen dan tipe data yang dibutuhkan
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { useSidebar } from "@/components/ui/sidebarcontext";
import Link from "next/link";
import PetaLoader from "@/components/map/PetaLoader";
import { Properti } from "@/types";

export default function DetailLokasiPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. "Buka" params menggunakan use()
  const resolvedParams = use(params);

  // 3. Panggil useSidebar() seperti sebelumnya
  const { isCollapsed } = useSidebar();
  
  // Data tiruan menggunakan resolvedParams.id
  const lokasiData: Properti = {
    id: Number(resolvedParams.id),
    nama: `Detail Lokasi #${resolvedParams.id}`,
    alamat: 'Jln. Contoh Alamat No. 123',
    latitude: -6.17806,
    longitude: 106.63,
    status: 'In Progress',
    gambar_url: '',
    tanggal_pengajuan: '25 Agustus 2025',
    harga: 0,
    luas_tanah: 0,
    luas_bangunan: 0,
    specialist_name: "Alvino Dwi Nengku Wijaya",
  };
  
  const externalGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lokasiData.latitude},${lokasiData.longitude}`;

  return (
    // Struktur layout dengan Sidebar dan Navbar tidak berubah
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h1 className="text-4xl font-bold text-gray-800">{lokasiData.nama}</h1>
              <span className="bg-yellow-400 text-yellow-900 px-4 py-2 text-sm font-bold rounded-md">
                {lokasiData.status}
              </span>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg relative">
              <div className="absolute -top-5 left-6">
                <Link href="#" className="bg-white px-6 py-2 rounded-lg shadow-md border font-semibold text-gray-700 hover:bg-gray-50">
                  Form ULOK
                </Link>
              </div>
              <div className="pt-8">
                <div>
                  <p className="text-gray-500 text-sm">Latlong</p>
                  <p className="text-lg font-mono text-gray-800">{lokasiData.latitude}, {lokasiData.longitude}</p>
                </div>
                <div className="my-6 w-full h-[400px] rounded-md overflow-hidden border">
                  <PetaLoader 
                    data={[lokasiData]} 
                    centerPoint={[lokasiData.latitude, lokasiData.longitude]}

                    showPopup={false}
                  />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Location Specialist</p>
                  <p className="text-xl font-semibold text-gray-900">{lokasiData.specialist_name}</p>
                </div>
                <div className="mt-8 pt-6 border-t">
                  <a href={externalGoogleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Lihat Rute di Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}