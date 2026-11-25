import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { DataProvider } from "@/components/data-provider";
import { MobileHeader, Sidebar, TabBar } from "@/components/layout/nav";
import { StorageNotice } from "@/components/layout/storage-notice";

export const metadata: Metadata = {
  title: { default: "Dans ta tête Studio", template: "%s · Dans ta tête Studio" },
  description: "Comprendre ce qui se passe en nous. Studio de production de contenu.",
  appleWebApp: { capable: true, title: "DTT Studio", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <DataProvider>
          <Sidebar />
          <MobileHeader />
          <div className="md:pl-64">
            <main className="mx-auto max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 md:px-10 md:pb-12 md:pt-10">
              <StorageNotice />
              {children}
            </main>
          </div>
          <TabBar />
        </DataProvider>
      </body>
    </html>
  );
}
