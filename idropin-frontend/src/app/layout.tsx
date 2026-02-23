import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import ConsoleBanner from '@/components/ConsoleBanner';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#1c1c1c',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: '云集 - 智能文件收集与管理平台',
  description: 'Idrop.in - 云集，一个技术先进、体验优秀的文件管理平台',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '云集',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider>
          <ConsoleBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
