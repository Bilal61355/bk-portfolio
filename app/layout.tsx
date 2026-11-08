import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bilal — AI / ML Engineering',
  description: 'Bilal is an AI and machine learning engineering student exploring applied ML, generative AI and thoughtful product development.',
  applicationName: 'Bilal — Portfolio',
  openGraph: {
    title: 'Bilal — AI / ML Engineering',
    description: 'Applied intelligence. Thoughtful engineering. Useful products.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#e9e7df',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
