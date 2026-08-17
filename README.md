# CAMPUS AI

**Turn messy university syllabi into structured, actionable study paths.**

🔗 **Live Demo**: [https://campus-ai-woad.vercel.app](https://campus-ai-woad.vercel.app)

CAMPUS AI is an autonomous course generator built for college students. Instead of spending hours searching YouTube, digging through textbook chapters, and scrambling before exams, students upload their syllabus PDF and get a complete, structured learning workspace in under 60 seconds.

---

## ⚡ How It Works

```
 📄 Syllabus PDF / Text
           │
           ▼
 🧠 AI Curriculum Engine (Gemini / Groq)
           │
           ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         Generated Course Hub                           │
 ├───────────────────┬───────────────────┬────────────────────────────────┤
 │ 📚 Module Roadmap │ 🎥 Topic Lectures │ 📝 Exam Notes & Practice Sets  │
 └───────────────────┴───────────────────┴────────────────────────────────┘
           │
           ▼
 🏆 Study Tracking ──► Verifiable Certificate with Public ID (`/verify/CAI-XXXX`)
```

---

## ✨ Core Features

- **Syllabus-to-Course Transformation**: Extracts modules and atomic 15–45 minute topic units directly from university syllabus PDFs.
- **Curated Video Lectures**: Topic-by-topic educational video matching to start studying immediately without searching distractions.
- **On-Demand High-Yield Notes**: Generate concise Markdown revision notes with key formulas, worked examples, and exam takeaways.
- **Diagnostic Practice MCQs**: Topic-level practice question sets with instant grading and detailed explanations.
- **In-Player AI Tutor**: Context-aware AI assistant grounded in the current topic for quick doubt resolution.
- **Study Momentum & Weak Topic Focus**: Adaptive study modes (Standard, 3-Day Sprint, Exam Cram), streak counters, and revision recommendations.
- **Cryptographic PDF Certificates**: Automated certificate generation with unique verification hashes verifiable on a public verification portal.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server Actions) & React 19 |
| **Styling & UI** | Tailwind CSS, CSS Variables Design System, Framer Motion, Lucide Icons |
| **Database & Auth** | Supabase (PostgreSQL with Row-Level Security, `@supabase/ssr` session management) |
| **AI / LLM Pipeline** | Google Gemini (3.7 / 3.6 Flash) with automated Groq (`qwen/qwen3.6-27b`) fallback |
| **Search & Retrieval** | Tavily AI Search for academic syllabus enrichment |
| **Video Engine** | YouTube Data API v3 |
| **Document Processing**| `@react-pdf/renderer` for certificate generation & `pdf-parse` for syllabus extraction |

---

## 📂 Project Architecture

```text
src/
├── app/
│   ├── actions/          # Server actions for courses, notes, MCQs, chat, auth
│   ├── api/certificates/ # PDF certificate generation endpoint
│   ├── auth/             # Authentication flows
│   ├── courses/          # Course generation wizard & interactive player
│   ├── dashboard/        # Study momentum, weak topics & course library
│   ├── profile/          # Student profile & learning goals
│   └── verify/           # Public certificate verification
├── components/           # UI components, course player, navbar, themes
├── lib/                  # LLM cascades, Supabase clients, search & video helpers
└── middleware.ts         # Session refresh & route protection
```

---

## 📜 License

MIT License — Created by [Vikram Kadam](https://github.com/vikram00014).
