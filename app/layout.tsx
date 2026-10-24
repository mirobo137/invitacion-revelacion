import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "¿Niño o niña? · Una sorpresa está en camino",
  description:
    "Acompáñanos en Mexicali a celebrar una dulce espera y a descubrir juntos una gran sorpresa.",
  openGraph: {
    title: "¿Niño o niña? · Una sorpresa está en camino",
    description: "Sábado 21 de noviembre de 2026 · Mexicali, Baja California",
    images: ["/images/portada-compartir.jpg"],
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "¿Niño o niña? · Una sorpresa está en camino",
    description: "Sábado 21 de noviembre de 2026 · Mexicali, Baja California",
    images: ["/images/portada-compartir.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}

