# ==============================================================================
# CampusX — Multi-stage Dockerfile for Next.js 13.5 (standalone output)
# ==============================================================================
# Base image: node:18-alpine
# Stages:    deps -> builder -> runner
# ==============================================================================

FROM node:18-alpine AS base

# -----------------------------------------------------------------------------
# Stage 1 — deps: install dependencies (cached layer)
# -----------------------------------------------------------------------------
FROM base AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b600a329519db2c1f3361d10#nodealpine
# to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy lockfile and manifest first to leverage Docker layer caching.
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies) for the build step.
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2 — builder: compile the Next.js standalone bundle
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry is noisy in CI; disable it.
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time environment variables.
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so they
# must be present during `next build`. Non-public server vars are read at
# runtime and can be supplied via docker-compose / container env.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 — runner: minimal production image
# -----------------------------------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as a non-root user for security.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy the standalone server output produced by `output: 'standalone'`.
# This is the minimal set of files needed to run Next.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the public directory if it exists (optional, harmless if absent).
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The standalone server is a single Node process: server.js
CMD ["node", "server.js"]
