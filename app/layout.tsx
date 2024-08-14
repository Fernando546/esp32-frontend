import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './client-layout';  

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DataRoom',
  description: 'Aplikacja do sprawdzania pomiarów',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" /> 
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
