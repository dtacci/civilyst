import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '~/components/providers';
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport = {
  themeColor: '#1f2937',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Civilyst - Civic Engagement Platform',
  description: 'Transform civic engagement through accessible digital tools for municipal development projects',
  applicationName: 'Civilyst',
  keywords: ['civic engagement', 'municipal development', 'community participation', 'government', 'democracy'],
  authors: [{ name: 'Civilyst Team' }],
  creator: 'Civilyst',
  publisher: 'Civilyst',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://civilyst.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Civilyst - Civic Engagement Platform',
    description: 'Transform civic engagement through accessible digital tools for municipal development projects',
    siteName: 'Civilyst',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Civilyst - Civic Engagement Platform',
    description: 'Transform civic engagement through accessible digital tools for municipal development projects',
    creator: '@civilyst',
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Civilyst',
    'application-name': 'Civilyst',
    'msapplication-TileColor': '#1f2937',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#1f2937',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
