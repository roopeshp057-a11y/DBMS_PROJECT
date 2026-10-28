import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoBite | College Canteen Food Waste Tracker',
  description: 'A smart food waste tracking and analytics system for college canteens',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
