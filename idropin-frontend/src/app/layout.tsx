import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import ConsoleBanner from '@/components/ConsoleBanner';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#3b82f6',
}

export const metadata: Metadata = {
  title: '云集 - 智能文件收集与管理平台',
  description: 'Idrop.in - 云集，一个技术先进、体验优秀的文件管理平台',
  manifest: '/manifest.json',
  icons: {
    icon: 'https://task.caiths.com/favicon.ico',
    shortcut: 'https://task.caiths.com/favicon.ico',
    apple: '/icons/icon-192x192.png',
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
        <link rel="icon" href="https://task.caiths.com/favicon.ico" />
        <link rel="shortcut icon" href="https://task.caiths.com/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
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
