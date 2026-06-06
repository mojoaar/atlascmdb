import '@/styles/globals.css';

export const metadata = {
  title: 'Atlas',
  description: 'Enterprise CMDB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
