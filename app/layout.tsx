import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { GamificationProvider } from '@/components/dashboard/gamification-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CampusX — Gamified Placement & Learning Platform',
  description:
    'Level up your skills, track your progress, and land your dream job. CampusX gamifies your placement journey with roadmaps, projects, mock interviews, and a competitive leaderboard.',
  openGraph: {
    title: 'CampusX — Gamified Placement & Learning Platform',
    description:
      'Level up your skills, track your progress, and land your dream job with CampusX.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <GamificationProvider>
              {children}
              <Toaster richColors position="top-right" />
            </GamificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
