import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "AI-планер дня",
  description: "Диктуй усе, що в голові — AI перетворить хаос на план на сьогодні",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col">
          <main className="flex flex-1 flex-col px-4 pt-4 pb-28">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
