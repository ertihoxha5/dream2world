import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Dream2World — Your Dreams, Infinite Realities',
  description:
    'Turn a dream into an immersive world. Explore its places, meet its characters, and keep your memories in a personal Dream Archive.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
