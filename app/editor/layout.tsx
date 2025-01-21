import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Editor',
  description: 'Create your own text adventure games with our visual editor. Design locations, items, and custom commands in an intuitive interface.',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
