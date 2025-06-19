import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Discussion' };
export default function DiscussionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}