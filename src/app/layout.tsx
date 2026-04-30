import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'WealthFlow — Personal Finance & Investing',
    template: '%s | WealthFlow',
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
