import { headers } from "next/headers";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Poppins } from "next/font/google";
import { SidebarProvider } from "@/hooks/useSidebar";
import { AlertProvider } from "@/components/desktop/alertcontext";
import { DeviceProvider } from "./context/DeviceContext";
import "./globals.css";

// Pakai Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //Logika deteksi perangkat di sisi server
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /Mobi|Android|iPhone/i.test(userAgent);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        <DeviceProvider isMobile={isMobile}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AlertProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </AlertProvider>
          </ThemeProvider>
        </DeviceProvider>
      </body>
    </html>
  );
}
