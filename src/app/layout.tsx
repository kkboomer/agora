import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SwipeShop | Cal Hacks 13.0',
  description: 'Swipe right on your next favorite drop.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-zinc-900 antialiased selection:bg-rose-500 selection:text-white`}>
        {/* Centered mobile phone frame on desktop, full-screen on mobile */}
        <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white shadow-2xl relative flex flex-col overflow-x-hidden border-x border-zinc-800/20">
          {children}
        </div>
      </body>
    </html>
  );
}