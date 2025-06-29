// app/layout.tsx (or your RootLayout file)
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/ui/Navbar";
import { Sidebar } from "@/components/Sidebar"; 
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider"; 
import QueryProvider from "@/context/query-provider";
import CaptchaProvider from "@/context/CaptchaProvider";
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: 'Jeeforces',
    template: '%s | Jeeforces',
  },
  description: 'Conquer the IIT-JEE by practicing problems, competing in contests, and joining a community of top aspirants.',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <CaptchaProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > 
        <QueryProvider>
          <AuthProvider>
            <div className="flex min-h-screen">
              <div className="flex flex-1 flex-col">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                  {children}
                </main>
              </div>
              <Sidebar />
            </div>
            <Toaster position="top-center" richColors />
          </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        </CaptchaProvider>
      </body>
    </html>
  );
}