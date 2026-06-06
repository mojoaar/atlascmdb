import AuthedShellLayout from '@/components/layout/AuthedShellLayout';

export default function AdminLayout({ children }) {
  return <AuthedShellLayout mode="admin">{children}</AuthedShellLayout>;
}
