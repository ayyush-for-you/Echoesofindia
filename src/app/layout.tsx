import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "../components/shared/Navbar";
import { VaultProvider } from "../store/VaultContext";
import { ToastProvider } from "../store/ToastContext";
import { GameProvider } from "../store/GameContext";
import { ToastContainer } from "../components/shared/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECHOES OF INDIA",
  description: "Where India's forgotten stories come alive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${outfit.variable} antialiased bg-heritage-dark text-white`}
      >
        <VaultProvider>
          <ToastProvider>
            <GameProvider>
              <Navbar />
              <div className="pt-16 [&:has(#canvas-container)]:pt-0">
                {children}
              </div>
              <ToastContainer />
            </GameProvider>
          </ToastProvider>
        </VaultProvider>
      </body>
    </html>
  );
}
