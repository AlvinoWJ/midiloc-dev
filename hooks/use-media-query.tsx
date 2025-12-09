// hooks/use-media-query.ts
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // State untuk menyimpan apakah kondisi media query terpenuhi
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Cegah error saat SSR (Next.js) karena window belum tersedia
    if (typeof window === "undefined") {
      return;
    }

    // Membuat objek MediaQueryList dari query
    const media = window.matchMedia(query);

    // Sync nilai awal — jika hasil match berbeda dengan state, perbarui
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listener yang dijalankan setiap kali media query berubah (misal: screen resize)
    const listener = () => setMatches(media.matches);

    // Gunakan event listener modern
    media.addEventListener("change", listener);

    // Cleanup listener saat komponen unmount
    return () => media.removeEventListener("change", listener);
  }, [matches, query]); // Bergantung pada query dan state matches

  // Mengembalikan apakah media query terpenuhi
  return matches;
}
