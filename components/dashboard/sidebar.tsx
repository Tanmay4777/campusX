'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Swords,
  Target,
  Map,
  FolderKanban,
  FileText,
  Mic,
  Users,
  Trophy,
  Briefcase,
  Flame,
  Zap,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Brain,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth, xpToNext, getInitials } from '@/components/auth-provider';
import { Progress } from '@/components/ui/progress';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Swords,
  Target,
  Map,
  FolderKanban,
  FileText,
  Mic,
  Users,
  Trophy,
  Briefcase,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Brain,
};

const navList = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Skills', href: '/dashboard/skills', icon: 'Swords' },
  { label: 'Skill Gap', href: '/dashboard/skills/gap', icon: 'Target' },
  { label: 'Assessment', href: '/dashboard/assessment', icon: 'ClipboardCheck' },
  { label: 'Roadmap', href: '/dashboard/roadmap', icon: 'Map' },
  { label: 'Learning', href: '/dashboard/learning', icon: 'GraduationCap' },
  { label: 'Projects', href: '/dashboard/projects', icon: 'FolderKanban' },
  { label: 'Resume', href: '/dashboard/resume', icon: 'FileText' },
  { label: 'Interview', href: '/dashboard/interview', icon: 'Mic' },
  { label: 'Community', href: '/dashboard/community', icon: 'Users' },
  { label: 'Mentorship', href: '/dashboard/mentorship', icon: 'HeartHandshake' },
  { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: 'Trophy' },
  { label: 'Placements', href: '/dashboard/placements', icon: 'Briefcase' },
  { label: 'AI Analysis', href: '/dashboard/ai', icon: 'Brain' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const displayName = profile?.full_name || 'Student';
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const nextXp = xpToNext(level);
  const initials = profile?.full_name ? getInitials(profile.full_name) : '?';

  return (
    <aside className="flex h-full w-full flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            C
          </div>
          <span className="text-lg font-bold" style={{ fontSize: '19px' }}>
            <span style={{ fontSize: '26px' }}>CampusX&nbsp;&nbsp;</span>
            <span style={{ fontSize: '12px' }}>By Tanmay Sah</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navList.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="border-t p-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{displayName}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Flame className="h-3 w-3 text-warning" />
                  {streak}
                </span>
                <span className="flex items-center gap-0.5">
                  <Zap className="h-3 w-3 text-primary" />
                  Lvl {level}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>XP</span>
              <span>{xp.toLocaleString()} / {nextXp.toLocaleString()}</span>
            </div>
            <Progress value={(xp / nextXp) * 100} className="h-1.5" />
          </div>
        </div>
      </div>
    </aside>
  );
}
