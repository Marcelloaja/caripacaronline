import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cari Pacar Online - Pasangan Serius & Masa Depan",
  description: "Platform pencarian pasangan hidup yang berorientasi masa depan, bebas akun palsu & perselingkuhan.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico"
  },
  verification: {
    google: "googled3519de2bd8be03f"
  }
};

export const viewport: Viewport = {
  themeColor: "#BE3A50",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CariPacar" />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-[#1F1A1B]">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration error:', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
