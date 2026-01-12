import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadsReserve - Commercial Lead Generation',
  description: 'B2B lead generation platform for commercial services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
