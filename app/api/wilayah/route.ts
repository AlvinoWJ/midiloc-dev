// File: app/api/wilayah/route.js

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: any) {
  // Ambil query parameter 'type' dan 'code' dari URL
  const type = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");

  let apiUrl = "";

  // Logika untuk menentukan URL API eksternal berdasarkan 'type'
  switch (type) {
    case "provinces":
      apiUrl = "https://wilayah.id/api/provinces.json";
      break;
    case "regencies":
      if (!code)
        return NextResponse.json(
          { message: "Parameter 'code' untuk kabupaten diperlukan" },
          { status: 400 }
        );
      apiUrl = `https://wilayah.id/api/regencies/${code}.json`;
      break;
    case "districts":
      if (!code)
        return NextResponse.json(
          { message: "Parameter 'code' untuk kecamatan diperlukan" },
          { status: 400 }
        );
      apiUrl = `https://wilayah.id/api/districts/${code}.json`;
      break;
    case "villages":
      if (!code)
        return NextResponse.json(
          { message: "Parameter 'code' untuk kelurahan diperlukan" },
          { status: 400 }
        );
      apiUrl = `https://wilayah.id/api/villages/${code}.json`;
      break;
    default:
      return NextResponse.json(
        { message: "Parameter 'type' tidak valid" },
        { status: 400 }
      );
  }

  try {
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(`Gagal mengambil data dari ${apiUrl}`);
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server", error },
      { status: 500 }
    );
  }
}
