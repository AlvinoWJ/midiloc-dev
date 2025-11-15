// // components/PropertyCard.tsx
// import Image from 'next/image';
// import { Properti } from '@/types';

// const formatRupiah = (angka: number) => {
//   if (angka >= 1_000_000_000) return `Rp${(angka / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
//   if (angka >= 1_000_000) return `Rp${(angka / 1_000_000).toFixed(0)}jt`;
//   return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
// };

// export default function PropertyCard({ properti }: { properti: Properti }) {
//   return (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
//       <div className="relative h-48 w-full">
//         <Image src={properti.gambar_url} alt={properti.nama} layout="fill" objectFit="cover" />
//       </div>
//       <div className="p-4">
//         <h3 className="font-bold text-lg">{properti.nama}</h3>
//         <p className="text-sm text-gray-500 mb-2">{properti.alamat}</p>
//         <p className="font-bold text-xl text-red-600 mb-2">{formatRupiah(properti.harga)}</p>
//         <div className="flex text-sm text-gray-600 space-x-4">
//           <span>LT {properti.luas_tanah}m²</span>
//           <span>LB {properti.luas_bangunan}m²</span>
//         </div>
//       </div>
//     </div>
//   );
// }
