import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import ConsoleBanner from '@/components/ConsoleBanner';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#1c1c1c',
}

export const metadata: Metadata = {
  title: '云集 - 智能文件收集与管理平台',
  description: 'Idrop.in - 云集，一个技术先进、体验优秀的文件管理平台',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ConsoleBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
