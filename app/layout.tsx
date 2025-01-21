import './globals.css';
import type { Metadata } from 'next';

const title = 'Texted.Uk - Text Adventure Game Creator';
const description = 'Create and play interactive text adventures with our powerful game editor. Design immersive story-driven experiences with custom commands, items, and locations.';

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  keywords: [
    'text adventure',
    'interactive fiction',
    'game creator',
    'text game',
    'adventure game',
    'story game',
    'game editor',
    'text based game',
    'interactive storytelling',
    'narrative game'
  ],
  authors: [{ name: 'Text Adventure Game Creator' }],
  creator: 'Text Adventure Game Creator',
  publisher: 'Text Adventure Game Creator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://texted.uk',
    title,
    description,
    siteName: title,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://texted.uk'),
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
