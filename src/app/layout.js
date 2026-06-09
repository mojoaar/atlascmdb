import '@/styles/globals.css';
import '@/styles/prism-theme.css';

export const metadata = {
  title: 'Atlas',
  description: 'Open-source CMDB for modern IT teams',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('atlas-theme-mode');
                if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.removeAttribute('data-theme');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                console.error('UNHANDLED REJECTION:', event.reason);
                if (event.reason && event.reason.stack) {
                  console.error('Stack:', event.reason.stack);
                }
                console.error('Promise:', event.promise);
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
