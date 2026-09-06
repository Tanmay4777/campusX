'use client';

import Link from 'next/link';
import { Compass, ArrowRight, Home, Trophy, Map } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Custom 404 page.
 *
 * In Next.js App Router, `app/not-found.tsx` renders when a route is not
 * found or when `notFound()` is called from a route. Styled to match the
 * landing page design.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header — matches the landing page */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              C
            </div>
            <span className="text-lg font-bold" style={{ fontSize: '19px' }}>
              <span style={{ fontSize: '26px' }}>CampusX&nbsp;&nbsp;</span>
              <span style={{ fontSize: '12px' }}>By Tanmay Sah</span>
            </span>
          </Link>
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

      {/* Main 404 content */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
        {/* Ambient background — matches the landing page hero */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="h-72 w-[600px] rounded-full bg-primary/20 blur-[140px]" />
        </div>

        <div className="relative w-full max-w-lg animate-fade-in text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="h-8 w-8" />
          </div>

          <Badge variant="secondary" className="mb-4">
            404 — Page not found
          </Badge>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            <span className="text-gradient">404</span>
          </h1>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
            This page took a wrong turn
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been
            moved. Let&rsquo;s get you back on track to leveling up your skills.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Suggested destinations */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Dashboard</div>
                    <div className="text-xs text-muted-foreground">
                      Track your XP and progress
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Map className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Roadmaps</div>
                    <div className="text-xs text-muted-foreground">
                      Find your learning path
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer — matches the landing page */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 CampusX. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
