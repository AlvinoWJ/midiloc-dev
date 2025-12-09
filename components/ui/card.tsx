"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Komponen Card (Container Utama).
 * Menggunakan `React.forwardRef` untuk meneruskan ref ke elemen `div` DOM asli.
 * Ini berguna jika library lain (seperti animasi atau drag-n-drop) perlu mengakses node DOM ini.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // cn() menggabungkan class default dengan className yang dipass via props.
    // Shadow custom ditambahkan di sini: shadow-[1px_1px_6px_rgba(0,0,0,0.25)]
    className={cn(
      "rounded-xl bg-card text-card-foreground shadow shadow-[1px_1px_6px_rgba(0,0,0,0.25)]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card"; // Nama tampilan untuk React DevTools

/**
 * Komponen Header Card.
 * Biasanya berisi Title dan Description.
 * Menggunakan Flexbox column untuk menata anak-anak elemennya secara vertikal.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // space-y-10 memberikan jarak vertikal yang cukup besar (40px) antar elemen di dalam header
    className={cn("flex flex-col space-y-10 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * Komponen Judul Card.
 * Menggunakan tag <div> secara default, tapi sering diubah styling-nya agar terlihat seperti heading (h3/h4).
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * Komponen Deskripsi Card.
 * Teks pendukung di bawah judul dengan warna yang lebih redup (muted-foreground).
 */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * Komponen Konten Utama Card.
 * Tempat menaruh isi utama (form, teks, grafik, dll).
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // pt-0 (padding-top: 0) digunakan agar jarak antara Header dan Content tidak terlalu jauh
    // karena Header sudah memiliki padding bawahnya sendiri.
    className={cn("p-6 pt-0", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

/**
 * Komponen Footer Card.
 * Biasanya untuk tombol aksi (Submit, Cancel) atau status.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Flex items-center untuk meratakan tombol secara vertikal
    // pt-0 juga digunakan di sini untuk menjaga kepadatan visual dengan Content di atasnya
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
