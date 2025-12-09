// app/page.tsx

/**
 * Halaman Home ("/")
 * ------------------
 * File ini merupakan entry page utama dari aplikasi.
 * Karena homepage tidak memiliki konten, user langsung
 * diarahkan (redirect) ke halaman login.
 */

import { redirect } from "next/navigation";

export default function Home() {
  /**
   * Melakukan redirect sisi server (Server Component)
   * ke halaman "/auth/login".
   *
   * Next.js akan menghentikan rendering komponen ini
   * dan langsung mengarahkan user ke halaman login.
   */
  redirect("/auth/login");
}
