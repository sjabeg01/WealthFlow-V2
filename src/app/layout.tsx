import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Rakam — Personal Finance & Investing',
    template: '%s | Rakam',
  },
  description:
    'A calm, trustworthy personal finance app. Import bank statements, track spending, manage goals, and invest smarter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
