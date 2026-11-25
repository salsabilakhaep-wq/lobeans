import './globals.css';

export const metadata = {
  title: { default: 'LOBEANS — Coffee Inventory Management', template: '%s · LOBEANS' },
  description: 'Sistem manajemen inventaris kopi: persediaan green bean, pasokan, dan pengiriman.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-lobeans-cream-light font-sans text-lobeans-ink antialiased">
        {children}
      </body>
    </html>
  );
}
