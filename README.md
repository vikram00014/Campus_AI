# CAMPUS AI

> Autonomous Syllabus-to-Course Engine for University Students.

CAMPUS AI transforms dense, unstructured university syllabus PDFs into interactive, step-by-step study paths. It automatically structures modules and topics, matches relevant video lectures, generates exam revision notes and practice quizzes on demand, tracks study momentum, and issues verifiable completion certificates.

---

## 📌 Features

- **Syllabus Parsing & Structuring**: Upload official syllabus PDFs (or paste raw text) to instantly generate ordered modules and atomic 15–45 minute topic breakdowns.
- **Curated Video Lectures**: Relevant YouTube lectures are matched topic-by-topic so you can start studying without search distractions.
- **On-Demand Revision Notes**: AI-generated Markdown study notes with definitions, key equations, worked examples, and revision takeaways.
- **Diagnostic Practice MCQs**: Topic-specific multiple-choice question sets with instant answer evaluation and step-by-step explanations.
- **AI Topic Tutor**: In-player conversational assistant grounded in the current topic context for fast doubt resolution.
- **Study Momentum & Analytics**: Daily target plans (Default, Exam Cram, 3-Day Sprint), study streaks, XP scoring, and weak-topic identification.
- **Cryptographic Certificates**: Downloadable formal PDF completion certificates backed by a public verification registry (`/verify/CAI-XXXX`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Frontend**: React 19, TypeScript, Vanilla CSS + Tailwind CSS, Framer Motion, Lucide Icons
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security, `@supabase/ssr` session middleware)
- **AI & LLM Pipeline**: Google Gemini 3.7 / 3.6 Flash via Vercel AI SDK, with automatic Groq (`qwen/qwen3.6-27b`) fallback
- **Context & Search**: [Tavily AI Search](https://tavily.com/) for academic context enrichment
- **Video Sourcing**: YouTube Data API v3
- **PDF Engine**: `@react-pdf/renderer` (Certificate PDF generator) & `pdf-parse` (Syllabus parser)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18.18+ or 20+
- npm, yarn, or pnpm
- A free Supabase project
- API keys for Google AI Studio / Groq, Tavily, and YouTube Data API v3

### 2. Clone and Install

```bash
git clone https://github.com/vikram00014/Campus_AI.git
cd Campus_AI
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in your service credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI LLM Providers
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...

# Search & Media APIs
TAVILY_API_KEY=tvly-...
YOUTUBE_API_KEY=AIzaSy...
```

### 4. Setup Database Schema

Run the SQL migration in your Supabase SQL Editor:
- Open `supabase/schema.sql` and execute it in your Supabase project dashboard.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Layout

```text
├── src/
│   ├── app/
│   │   ├── actions/          # Server Actions (Course, Player, AI Chat, Auth)
│   │   ├── api/certificates/ # PDF certificate generation route
│   │   ├── auth/             # Login, signup, and session handling
│   │   ├── courses/          # Course generation wizard & interactive player
│   │   ├── dashboard/        # Study plans, progress, weak topics & momentum
│   │   ├── profile/          # Student profile management
│   │   └── verify/           # Public certificate verification portal
│   ├── components/           # UI components, layout, navbar & theme providers
│   ├── lib/
│   │   ├── llm.ts            # Gemini/Groq model cascading & JSON schema engine
│   │   ├── supabase/         # SSR & client Supabase singletons
│   │   ├── tavily.ts         # Academic context search integration
│   │   └── youtube.ts        # Video lecture retrieval
│   └── middleware.ts         # Supabase session cookie refresh middleware
├── supabase/
│   └── schema.sql            # Core database tables, indexes & RLS policies
└── public/                   # Static branding and assets
```

---

## 🚢 Deployment (Vercel)

This application is built as a full-stack Next.js App Router project and can be deployed directly to Vercel:

1. Push your code to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the environment variables from your `.env.local`.
4. Click **Deploy**.
5. In Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**, add your production Vercel domain to **Redirect URLs**.

---

## 📄 License

MIT License. Built for students and educators.
