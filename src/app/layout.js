import '@/styles/globals.css';
import '@/styles/prism-theme.css';

export const metadata = {
  title: 'Atlas',
  description: 'Open-source CMDB for modern IT teams',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
