'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Bug } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Global error boundary.
 *
 * In Next.js App Router, `app/error.tsx` catches unhandled runtime errors
 * thrown by any route segment below it. It must be a Client Component and
 * must accept `error` + `reset` props.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console (or an error-reporting service in prod).
    console.error('[CampusX] Unhandled error boundary:', error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Ambient background — matches the landing page hero */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 transform">
        <div className="h-64 w-[600px] rounded-full bg-destructive/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center md:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <Badge variant="destructive" className="mb-4">
              Something went wrong
            </Badge>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              An unexpected error occurred
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Don&rsquo;t worry — your progress is safe. Try the action again,
              and if the problem persists, head back to the dashboard.
            </p>

            {error.digest ? (
              <p className="mt-4 rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                Error reference: {error.digest}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={reset} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            <details className="mt-6 text-left">
              <summary className="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
                <Bug className="mr-1 inline h-3 w-3" />
                Technical details
              </summary>
              <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                {error.message || 'Unknown error'}
                {error.stack ? `\n\n${error.stack}` : ''}
              </pre>
            </details>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need help? Contact support with the error reference above.
        </p>
      </div>
    </div>
  );
}
