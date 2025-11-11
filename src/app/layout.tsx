import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Company Dashboard',
  description: 'Interactive company analytics dashboard built with D3.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode,
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
