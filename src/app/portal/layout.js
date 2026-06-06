import AuthedShellLayout from '@/components/layout/AuthedShellLayout';

export default function PortalLayout({ children }) {
  return <AuthedShellLayout mode="portal">{children}</AuthedShellLayout>;
}
