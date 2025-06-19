import { Metadata } from 'next';
export const metadata: Metadata = { title: 'User Profile' };
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}