// types/index.ts
export interface Properti {
  id: number;
  nama: string;
  alamat: string;
  harga: number; // Kita biarkan saja meski tidak dipakai di pop-up
  latitude: number;
  longitude: number;
  gambar_url: string;
  luas_tanah: number;
  luas_bangunan: number;
  
  // --- TAMBAHAN BARU ---
  status: 'In Progress' | 'OK' | 'NOK'; // Tipe spesifik untuk status
  tanggal_pengajuan: string;
  specialist_name: string; 
}