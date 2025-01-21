import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Based Adventure - Create, share, play',
  description: 'Create and play interactive text adventures with our powerful game editor. Design immersive story-driven experiences.',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
