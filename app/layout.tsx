import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upstox PR Automation",
  description: "AI-powered PR review and description generation platform for Bitbucket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
