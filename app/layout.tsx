// app/layout.tsx

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Delaware Community Composting Initiative | Plastic Free Delaware',
  description: 'Delaware Community Composting Initiative - Data Collection Platform',

  icons: {
    icon:     '/icons/favicon.ico',
    shortcut: '/icons/favicon-32x32.png',
    apple:    '/icons/apple-touch-icon.png',
  }
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`} style={{ overscrollBehaviorY: 'contain' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
              {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
