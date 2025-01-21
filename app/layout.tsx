import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ROBCO Terminal',
  description: 'Text Adventure Terminal Interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}