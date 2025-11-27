import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Poppins } from "next/font/google";
import { SidebarProvider } from "@/hooks/useSidebar";
import { AlertProvider } from "@/components/shared/alertcontext";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "600"],
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Midiloc",
  description: "The best location management app in the universe",
  icons: {
    icon: "/Midiloc_logo.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AlertProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
