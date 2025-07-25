import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import ThemeProviders from "@/components/layout/theme-providers";
import { Web3Provider } from "@/features/wallet/Web3Provider";
import ProtectedRoute from "@/components/layout/protected-route";
import { ToastContainer } from "react-toastify";

const nunito_sans = Nunito_Sans({
  weight: ['600', '800'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "SkillChain",
  description:
    "A Reputation System For Resume Verification And Skill Assessment",
  icons: {
    icon: '/favicon.svg',       
    shortcut: '/favicon.svg',   
    apple: '/favicon.svg',    
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        suppressHydrationWarning
        className={`${nunito_sans.className} antialiased`}
      >
        <Web3Provider>
          <ProtectedRoute>
            <ToastContainer />
            <ThemeProviders>{children}</ThemeProviders>
          </ProtectedRoute>
        </Web3Provider>
      </body>
    </html>
  );
}
