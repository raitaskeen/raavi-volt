import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ServiceWorker } from "@/components/service-worker";
import { store } from "@/config/store";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
// Variable width axis lets headings use an expanded, industrial cut.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(store.url),
  title: { default: `${store.name} — ${store.tagline}`, template: `%s · ${store.name}` },
  description: store.description,
  applicationName: store.name,
  openGraph: { type: "website", siteName: store.name, locale: "en_PK" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  // iOS "Add to Home Screen": full-screen app with our name and status bar.
  appleWebApp: { capable: true, title: store.name, statusBarStyle: "black-translucent" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#151515",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK" className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable}`}>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
