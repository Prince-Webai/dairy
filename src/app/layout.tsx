
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google"; // Import Space Grotesk
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "Condon Dairy Services",
  description: "Service Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, spaceGrotesk.variable, "font-sans antialiased")}>{children}</body>
    </html>
  );
}
