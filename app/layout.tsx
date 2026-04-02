import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AiBooker',
  description: 'AI-powered booking platform for restaurants, salons, and more.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className} scroll-smooth`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
