import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

// Display / titulares / wordmark — MANIFEST §4
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

// UI / datos / cuerpo — MANIFEST §4
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Production URL (used for absolute OG/Twitter image URLs). Set NEXT_PUBLIC_SITE_URL on Vercel.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://helpr.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Helpr — Tu equipo en WhatsApp, con memoria.",
    template: "%s · Helpr",
  },
  description:
    "Cada persona del equipo le escribe a Helpr por WhatsApp —por texto o audio— y él lo convierte en tareas, decisiones y responsables. Sin cambiar cómo trabaja nadie.",
  applicationName: "Helpr",
  keywords: [
    "Helpr",
    "WhatsApp",
    "ONG",
    "tareas",
    "memoria operativa",
    "gestión de equipos",
    "decisiones",
    "voluntariado",
  ],
  authors: [{ name: "Helpr" }],
  creator: "Helpr",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Helpr",
    url: siteUrl,
    title: "Helpr — Tu equipo en WhatsApp, con memoria.",
    description:
      "Texto o audio por WhatsApp, convertido en tareas, decisiones y responsables. Sin cambiar cómo trabaja el equipo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Helpr — Tu equipo en WhatsApp, con memoria.",
    description:
      "Texto o audio por WhatsApp, convertido en tareas, decisiones y responsables.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f6f0e2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
