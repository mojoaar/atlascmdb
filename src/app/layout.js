import '@/styles/globals.css';
import '@/styles/prism-theme.css';

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
