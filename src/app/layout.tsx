import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "@/components/ui/sonner"
import Navbar from "@/components/ui/Navbar";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "JEE Forces", // Updated title
  description: "Master JEE with Peer Power - India's largest community for JEE preparation", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="flex min-h-screen">
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1 p-4 overflow-auto">
                {children}
              </main>
            </div>
            <Sidebar />
          </div>
          <Toaster position="top-center" />
        </body>
      </AuthProvider>
    </html>
  );
}