# CAMPUS AI

AI-powered syllabus-to-course generator for college students.  
Upload a university syllabus PDF and CAMPUS AI turns it into a structured learning flow with modules, topics, videos, notes, MCQ practice, progress tracking, and a verifiable certificate.

## What it does

- Converts raw syllabus text into a structured course using Google Gemini / Groq
- Extracts text from uploaded PDF syllabi
- Curates YouTube videos for topics
- Generates topic notes on demand
- Generates practice MCQs
- Tracks progress across topics and modules
- Shows dashboard insights like weak topics, study plan, streak, and XP
- Issues PDF certificates with verification IDs
- Supports public certificate verification

## Tech stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Google Gemini API (`@ai-sdk/google`) & Groq (`@ai-sdk/groq`)
- Tavily AI Search
- YouTube Data API v3
- React PDF Renderer

## Screens / routes

- `/` landing page
- `/auth` login and signup
- `/dashboard` course overview and study insights
- `/courses/create` syllabus-to-course wizard
- `/courses/[id]` course player
- `/profile` student profile
- `/verify` certificate verification form
- `/verify/[verificationId]` certificate verification result

## Environment setup

Create a local `.env.local` file using `.env.example`.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
GROQ_API_KEY=
TAVILY_API_KEY=
YOUTUBE_API_KEY=
```

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Database

The main schema lives in:

- `supabase/schema.sql`

Core tables:

- `courses`
- `modules`
- `topics`
- `progress`
- `certificates`

## Project structure

```text
src/
  app/
    actions/         server actions and core business logic
    api/             route handlers
    auth/            auth page
    courses/         create flow + player
    dashboard/       dashboard UI
    profile/         profile page
    verify/          certificate verification
  components/
    ui/              reusable UI primitives
  lib/
    supabase/        browser/server clients
    tavily.ts        trusted context retrieval
    youtube.ts       YouTube search integration
supabase/
  schema.sql         canonical DB schema
public/
  *.png              image assets
```

## Before pushing to GitHub

- Keep `.env.local` private
- Make sure no real API keys are committed
- Run:

```bash
npm run lint
npm run build
```

## Status

This repo is now documented as a real project rather than the default Next.js starter.
