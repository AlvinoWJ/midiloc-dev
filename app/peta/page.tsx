// // app/peta/page.tsx

// import { Properti } from '@/types';
// import PetaLoader from '@/components/map/PetaLoader';

// // Data tiruan kita tetap sama
// const dummyPropertiData: Properti[] = [
//   {
//     id: 1, nama: "Alam Sutera", alamat: "Jln. Ahmad yani 13", latitude: -6.225, longitude: 106.65, gambar_url: "/images/toko-alam-sutera.jpg", status: 'In Progress', tanggal_pengajuan: '25 Agustus 2025',
//     harga: 0,
//     luas_tanah: 0,
//     luas_bangunan: 0,
//     specialist_name: ''
//   },
//   {
//     id: 2, nama: "BSD City", alamat: "Jl. Pahlawan Seribu", latitude: -6.29, longitude: 106.66, gambar_url: "/images/toko-bsd.png", status: 'OK', tanggal_pengajuan: '12 Juli 2025',
//     harga: 0,
//     luas_tanah: 0,
//     luas_bangunan: 0,
//     specialist_name: ''
//   },
//   {
//     id: 3, nama: "Gading Serpong", alamat: "Boulevard Gading Serpong", latitude: -6.24, longitude: 106.62, gambar_url: "/images/toko-gadingserpong.webp", status: 'NOK', tanggal_pengajuan: '01 Agustus 2025',
//     harga: 0,
//     luas_tanah: 0,
//     luas_bangunan: 0,
//     specialist_name: ''
//   },
// ];

// export default function PetaDashboardPage() {
//   const propertiData = dummyPropertiData;

//   // Logika pembuatan URL Google Maps yang kompleks sebelumnya sudah dihapus.

//   return (
//     <main className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-3xl font-bold text-gray-800">Dashboard Lokasi</h1>
//         <p className="mt-2 text-gray-600">Selamat datang! Berikut adalah usulan lokasi saat ini.</p>
//         <div className="mt-12 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
//           <h2 className="text-2xl font-semibold text-gray-900">Lokasi Kami:</h2>
//           <p className="mt-1 text-gray-500">Peta usulan toko Alfamidi</p>
//           <div className="mt-4 w-full h-[500px] rounded-lg overflow-hidden border">
//             <PetaLoader data={propertiData} />
//           </div>

//         </div>
//       </div>
//     </main>
//   );
// }
