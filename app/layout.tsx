import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PromptToSite',
  description:
    'See how a single AI prompt can be adapted to create stunning, high-converting websites for any industry.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@400;600;700&family=Oswald:wght@500;700&family=DM+Sans:wght@400;500;700&family=Merriweather:wght@400;700&family=Lato:wght@400;700&family=Open+Sans:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
