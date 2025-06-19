import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Problem' }; // Template adds "| Jeeforces"
export default function ProblemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}