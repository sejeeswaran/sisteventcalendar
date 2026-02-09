import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIST Event Calendar',
  description: 'Manage and register for college events - Sathyabama Institute of Science and Technology',
  icons: {
    icon: '/sathyabama-institute-of-science-and-technology-logo.png',
    apple: '/sathyabama-institute-of-science-and-technology-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 80px)', paddingBottom: '40px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
