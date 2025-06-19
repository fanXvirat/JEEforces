import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Contest' };
export default function ContestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}