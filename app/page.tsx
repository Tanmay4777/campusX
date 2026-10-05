'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Trophy,
  Map,
  FolderKanban,
  Mic,
  Users,
  Swords,
  Briefcase,
  Check,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
  {
    icon: Swords,
    title: 'Skill Tracking',
    description: 'Gamified skill tree with XP, levels, and proficiency badges across 50+ technical skills.',
    color: 'text-primary',
  },
  {
    icon: Map,
    title: 'Personalized Roadmaps',
    description: 'Step-by-step learning paths from fundamentals to interview-ready, adapted to your pace.',
    color: 'text-accent',
  },
  {
    icon: FolderKanban,
    title: 'Project Portfolio',
    description: 'Build real-world projects with guided templates, track progress, and showcase your work.',
    color: 'text-success',
  },
  {
    icon: Mic,
    title: 'Mock Interviews',
    description: 'AI-powered mock interviews for technical, HR, and system design rounds with instant feedback.',
    color: 'text-warning',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    description: 'Compete with students nationwide. Climb ranks, earn badges, and stay motivated.',
    color: 'text-primary',
  },
  {
    icon: Briefcase,
    title: 'Placement Drives',
    description: 'Track company drives, eligibility, deadlines, and application status — all in one place.',
    color: 'text-accent',
  },
];

const stats = [
  { label: 'Skills Tracked', value: '50+' },
  { label: 'Career Paths', value: '4' },
  { label: 'Practice Quizzes', value: '100+' },
  { label: 'Mock Interviews', value: 'Unlimited' },
];

const steps = [
  { icon: Target, title: 'Assess Your Level', description: 'Take a diagnostic test to find your current skill level across key areas.' },
  { icon: Map, title: 'Follow Your Roadmap', description: 'Get a personalized learning path with milestones and deadlines tailored to your goals.' },
  { icon: Zap, title: 'Level Up Daily', description: 'Earn XP by solving problems, building projects, and completing quizzes to maintain your streak.' },
  { icon: TrendingUp, title: 'Crack Placements', description: 'Apply to drives with confidence — your tracked progress proves you are ready.' },
];





export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              C
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight">CampusX</span>
              <span className="text-[11px] font-normal text-muted-foreground">By Tanmay Sah</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              How It Works
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 transform">
          <div className="h-64 w-[600px] rounded-full bg-primary/20 blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              Your placement journey, gamified
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Level up your skills.
              <br />
              <span className="text-gradient">Land your dream job.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              CampusX gamifies your placement journey with personalized roadmaps,
              skill tracking, mock interviews, and a competitive leaderboard.
              Stay motivated, stay consistent, stay ahead.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/register">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard">View Demo Dashboard</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                Free forever plan
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to crack placements
            </h2>
            <p className="mt-4 text-muted-foreground">
              From skill building to interview prep, CampusX covers your entire placement journey.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardContent className="p-6">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-b bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Your path to placement success
            </h2>
            <p className="mt-4 text-muted-foreground">
              Four simple steps from where you are to where you want to be.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="absolute left-[60%] top-7 hidden h-px w-[80%] bg-border md:block">
                  {idx < steps.length - 1 && (
                    <div className="h-full w-full bg-gradient-to-r from-primary to-transparent" />
                  )}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-8 text-center text-primary-foreground md:p-12">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to start your placement journey?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                Start your placement journey today with personalized roadmaps, skill tracking, and gamified learning.
              </p>
              <Button size="lg" variant="secondary" asChild className="mt-8">
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  C
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold tracking-tight">CampusX</span>
                  <span className="text-[11px] font-normal text-muted-foreground">By Tanmay Sah</span>
                </div>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                Gamified placement and learning platform for college students.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            &copy; 2026 CampusX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
