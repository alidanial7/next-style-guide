import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "__PROJECT_NAME__",
  description: "Generated with next-style-guide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
