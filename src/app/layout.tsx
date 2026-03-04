import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AgriPlan — Software agrícola para el norte de Chile",
    template: "%s | AgriPlan",
  },
  description:
    "Planifica tu campo, controla el agua y proyecta el ROI de tus cultivos. Software para agricultores del norte de Chile. 6 meses gratis, sin tarjeta.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://agriplan.cl"),
  openGraph: {
    siteName: "AgriPlan",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@agriplan_cl",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgriPlan",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="antialiased bg-gray-50">
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster position="bottom-right" richColors duration={3000} />
      </body>
    </html>
  );
}
