# CAMPUS AI Project Explanation

## 1. What this project is

**CAMPUS AI** is a Next.js web app that turns a college syllabus into a structured, AI-assisted learning experience.

The idea is simple:

1. A student uploads or pastes a syllabus.
2. Gemini structures that syllabus into modules and topics.
3. The app stores the generated course in Supabase.
4. The student studies through videos, notes, practice questions, and AI chat help.
5. Progress is tracked topic-by-topic.
6. When a course reaches 100%, the app generates a downloadable PDF certificate with a verification ID.

In short, this project is an **AI-powered syllabus-to-course generator + lightweight LMS + certificate system** for college students.

---

## 2. Main product goals

This project is trying to solve a real student problem:

- Syllabi are usually unstructured and hard to study from directly.
- Students waste time deciding what to study first.
- Good YouTube content is scattered.
- Notes and practice are often created manually and inconsistently.
- Students want proof of completion in a shareable form.

The app addresses that by combining:

- syllabus parsing
- AI course structuring
- video curation
- note generation
- MCQ generation
- progress tracking
- dashboard insights
- certificate verification

---

## 3. Tech stack

## Frontend

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**
- small reusable UI primitives under `src/components/ui`

## Backend / data

- **Supabase**
  - Auth
  - Postgres database
  - Row Level Security
- **Next.js Server Actions**
- **Route Handlers** for PDF certificate generation

## AI / external services

- **Google Gemini / Vertex AI Express**
  - course structure generation
  - notes generation
  - MCQ generation
  - topic Q&A chatbot
- **Tavily**
  - trusted academic context retrieval
- **YouTube Data API**
  - topic video search
- **@react-pdf/renderer**
  - certificate PDF generation
- **pdf-parse**
  - syllabus text extraction from PDF

---

## 4. Project architecture at a high level

The app is split into 4 major layers:

### A. Presentation layer

Pages and UI live under:

- `src/app`
- `src/components`

This layer handles:

- landing page
- auth page
- dashboard
- profile
- course creation wizard
- course player
- certificate verification pages

### B. Server action layer

Most business logic is in:

- `src/app/actions`

This layer handles:

- auth
- PDF parsing
- course generation
- player progress updates
- notes generation
- MCQ generation
- AI topic chat
- dashboard data aggregation
- profile updates

### C. Integration layer

External service wrappers live in:

- `src/lib/supabase`
- `src/lib/tavily.ts`
- `src/lib/youtube.ts`

This layer keeps service-specific logic separate from pages.

### D. Data layer

Database schema lives in:

- `supabase/schema.sql`

Core tables:

- `courses`
- `modules`
- `topics`
- `progress`
- `certificates`

---

## 5. Important folders and files

## `src/app`

- `layout.tsx`
  - global layout
  - loads fonts
  - creates server Supabase client
  - fetches current user
  - injects navbar

- `page.tsx`
  - landing page
  - explains product value and drives users to create a course or sign in

- `auth/page.tsx`
  - login and signup UI
  - uses server actions from `actions/auth.ts`

- `dashboard/page.tsx`
  - main student overview
  - shows course list, insights, weak topics, study plan, XP-like metrics

- `profile/page.tsx`
  - student profile view and edit form

- `courses/create/page.tsx`
  - 3-step course generation wizard
  - academic info
  - course name
  - syllabus upload/paste

- `courses/[id]/page.tsx`
  - server wrapper for a course player

- `courses/[id]/player-client.tsx`
  - the most interactive screen in the app
  - video view
  - notes view
  - practice mode
  - progress tracking
  - AI tutor chat

- `verify/page.tsx`
  - public certificate verification entry screen

- `verify/[verificationId]/page.tsx`
  - result page for certificate lookup

- `api/certificates/[courseId]/route.tsx`
  - generates certificate PDF after validating course completion

## `src/app/actions`

- `auth.ts`
  - login, signup, logout

- `parse-pdf.ts`
  - extracts text from uploaded PDFs

- `course.ts`
  - sends syllabus text to Gemini
  - creates modules/topics
  - stores course in Supabase

- `player.ts`
  - fetches player data
  - updates topic progress
  - recalculates module/course completion
  - generates notes
  - generates MCQs
  - fetches videos

- `ai-chat.ts`
  - topic-focused AI tutoring

- `dashboard.ts`
  - computes dashboard stats and study plans

- `profile.ts`
  - updates auth metadata for the logged-in user

## `src/components`

- `navbar.tsx`
  - app-wide navigation with auth-aware state

- `landing-client.tsx`
  - reusable client pieces for landing page interactions

- `certificate-document.tsx`
  - React PDF template for generated certificate

- `ui/*`
  - reusable low-level UI primitives

## `src/lib`

- `supabase/server.ts`
  - server-side Supabase client using cookies

- `supabase/client.ts`
  - browser-side Supabase client

- `tavily.ts`
  - fetches trusted learning context

- `youtube.ts`
  - fetches topic videos from YouTube API

## `supabase/schema.sql`

- canonical database schema used by the app

---

## 6. Core user flow

## Flow 1: Authentication

1. User opens `/auth`
2. User logs in or signs up
3. Supabase Auth stores the session
4. Root layout fetches the user and navbar updates accordingly

Files involved:

- `src/app/auth/page.tsx`
- `src/app/actions/auth.ts`
- `src/lib/supabase/server.ts`

## Flow 2: Course creation

1. User fills academic info
2. User enters subject name
3. User uploads PDF or pastes syllabus text
4. If a PDF is uploaded, `parse-pdf.ts` extracts text
5. `course.ts` sends the syllabus to Gemini
6. Gemini returns structured modules and topics
7. App enriches only the first topic of each module with YouTube videos initially
8. App stores course, modules, and topics in Supabase
9. User is redirected to `/courses/[id]`

Files involved:

- `src/app/courses/create/page.tsx`
- `src/app/actions/parse-pdf.ts`
- `src/app/actions/course.ts`
- `src/lib/youtube.ts`

## Flow 3: Studying a course

1. User opens `/courses/[id]`
2. Server fetches course data with ownership check
3. Client player renders modules and topics
4. User studies via:
   - videos
   - notes
   - practice
   - AI chat
5. Topic progress updates are written to `progress`
6. Course completion percentage is recalculated
7. Dashboard and profile reflect updated progress

Files involved:

- `src/app/courses/[id]/page.tsx`
- `src/app/courses/[id]/player-client.tsx`
- `src/app/actions/player.ts`
- `src/app/actions/ai-chat.ts`

## Flow 4: Certificate generation

1. User completes a course
2. User requests certificate
3. Route handler verifies:
   - authenticated user
   - ownership of course
   - completion percentage is 100
4. If needed, a certificate row is inserted
5. React PDF generates a PDF stream
6. PDF is downloaded

Files involved:

- `src/app/api/certificates/[courseId]/route.tsx`
- `src/components/certificate-document.tsx`

## Flow 5: Public certificate verification

1. Anyone opens `/verify`
2. They enter a verification ID
3. The app looks up certificate data
4. It returns either:
   - valid certificate details
   - not found

Files involved:

- `src/app/verify/page.tsx`
- `src/app/verify/[verificationId]/page.tsx`

---

## 7. Database model

The schema is intentionally small and centered on the learning flow.

## `courses`

Represents one generated course for one user.

Important fields:

- `user_id`
- `year`
- `branch`
- `semester`
- `course_name`
- `syllabus_text`
- `completion_percentage`

Role:

- top-level object for a learning journey

## `modules`

Represents a unit inside a course.

Important fields:

- `course_id`
- `title`
- `order_index`
- `estimated_time`
- `status`

Role:

- controls ordering and locking of modules

## `topics`

Represents study items inside a module.

Important fields:

- `module_id`
- `title`
- `notes`
- `video_playlist_json`

Role:

- atomic learning steps in the player

## `progress`

Represents user progress per topic.

Important fields:

- `user_id`
- `topic_id`
- `notes_completed`
- `video_progress`
- `practice_completed`

Role:

- tracks learning state for each topic

## `certificates`

Represents generated certificate records.

Important fields:

- `user_id`
- `course_id`
- `certificate_url`
- `verification_id`

Role:

- enables PDF issuance and public verification

---

## 8. Security model

This app relies heavily on **Supabase Row Level Security**.

Highlights from `supabase/schema.sql`:

- users can only access their own `courses`
- `modules` and `topics` inherit ownership through course relationships
- `progress` is user-owned
- `certificates` are user-owned for writes
- `certificates` are publicly readable for verification lookup

This is important because:

- course content is private per student
- progress data is personal
- certificate verification must still work publicly

---

## 9. AI system design

This project uses AI in four distinct ways.

## A. Course structuring

File:

- `src/app/actions/course.ts`

What it does:

- takes raw syllabus text
- asks Gemini to return structured JSON
- validates it with Zod
- turns it into modules and topics

Why this is good:

- predictable output shape
- easier to store in the database
- lower UI parsing complexity

## B. Topic notes generation

File:

- `src/app/actions/player.ts`

What it does:

- checks if notes already exist
- if not, gets context from Tavily
- asks Gemini to write markdown notes
- stores notes in the topic row

Design choice:

- notes are generated **on demand**, not for every topic during course creation

Benefit:

- faster initial course generation
- lower API cost

## C. Practice MCQ generation

File:

- `src/app/actions/player.ts`

What it does:

- generates topic-specific MCQs
- uses structured JSON schema
- falls back to built-in default questions if AI fails

Benefit:

- resilient UX even if AI output fails

## D. Topic chatbot

File:

- `src/app/actions/ai-chat.ts`

What it does:

- verifies user owns the topic
- builds context from notes or Tavily
- asks Gemini to answer student questions in markdown

Benefit:

- contextual tutor, not a generic chatbot

---

## 10. Why Tavily is used

Tavily is not the main intelligence layer. It is used as a **context retrieval layer**.

Purpose:

- pull trusted web context for technical topics
- improve note generation
- improve AI chat grounding
- reduce hallucination compared with answering from nothing

File:

- `src/lib/tavily.ts`

---

## 11. Why YouTube is used

YouTube is used to make each topic more immediately learnable.

File:

- `src/lib/youtube.ts`

Current approach:

- during course creation, only the **first topic in each module** is enriched with videos
- other topics fetch videos on demand from the player

Why:

- saves quota
- speeds up generation
- reduces unnecessary API calls

---

## 12. Course player behavior

The course player is the heart of the application.

File:

- `src/app/courses/[id]/player-client.tsx`

Major responsibilities:

- render module sidebar
- track active topic
- show:
  - video tab
  - notes tab
  - practice tab
- support AI tutor chat drawer
- update completion state visually
- manage timer and mock interactions

The player is large because it combines:

- content delivery
- assessment
- progress sync
- AI support

This file is effectively the app’s mini-LMS frontend.

---

## 13. Dashboard behavior

The dashboard is more than a course list.

File:

- `src/app/actions/dashboard.ts`
- `src/app/dashboard/page.tsx`

It computes:

- total courses
- completed courses
- estimated learning hours
- weak topics
- a personalized plan
- streak
- XP score
- projected completion date

Study modes:

- default
- tomorrow exam
- three-day sprint

This gives the app a productivity layer, not just a content layer.

---

## 14. Profile system

The profile does not use a separate custom table.

Instead, it stores metadata in **Supabase Auth user metadata**.

File:

- `src/app/actions/profile.ts`

Stored metadata:

- full name
- college
- learning goal
- bio
- linkedin URL
- focus area

Benefit:

- simple architecture
- no extra profile table required

Tradeoff:

- profile fields are tied to auth metadata instead of relational app data

---

## 15. Certificate system

The certificate system has 3 parts:

## A. Completion validation

Only fully completed courses can generate certificates.

## B. Certificate record

If a certificate row does not exist, the route inserts one with a generated verification ID.

## C. PDF rendering

The PDF is created with React PDF using `CertificateDocument`.

It includes:

- student name
- course name
- issue date
- verification ID
- grade
- completion percentage
- estimated learning hours
- skill tags

This is a strong project feature because it converts app progress into a formal artifact.

---

## 16. Environment variables

Defined in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERTEX_API_KEY`
- `TAVILY_API_KEY`
- `YOUTUBE_API_KEY`

What each one powers:

- Supabase public keys: app auth and database access
- service role key: secure server-side certificate lookups/inserts
- Vertex key: Gemini-powered generation
- Tavily key: trusted context retrieval
- YouTube key: topic video search

---

## 17. Current strengths of the project

This codebase already has several strong ideas:

- clear product concept with real student value
- small and understandable schema
- practical use of AI instead of AI for its own sake
- good use of server actions
- ownership checks before sensitive operations
- certificate verification adds credibility
- dashboard gives the app “study companion” value
- on-demand notes and videos reduce cost
- public and private flows are separated well

---

## 18. Current limitations and engineering notes

These are important implementation notes based on the current code.

## A. Course creation is not transactional

File:

- `src/app/actions/course.ts`

Current behavior:

- inserts course first
- then inserts modules/topics
- if some module/topic inserts fail, the course can still exist partially

Impact:

- possible incomplete generated course records

## B. Topic completion logic is permissive

File:

- `src/app/actions/player.ts`

Current behavior:

- a topic is treated as completed if **notes OR practice OR video** is completed enough

Impact:

- progress can hit 100% without every learning mode being done

## C. Dashboard analytics use progress `created_at`

File:

- `src/app/actions/dashboard.ts`

Current behavior:

- streaks and daily/weekly stats rely on the timestamp in the progress row

Impact:

- analytics may not perfectly reflect when a topic was actually finished after later updates

## D. Topic ordering is inferred by `created_at`

Files:

- `supabase/schema.sql`
- `src/app/actions/player.ts`
- `src/app/actions/dashboard.ts`

Current behavior:

- modules have `order_index`
- topics do not

Impact:

- topic order depends on insertion/creation time rather than explicit order

## E. Mock YouTube fallback is weak

File:

- `src/lib/youtube.ts`

Current behavior:

- returns mock `videoId: "mock1"` when API key is missing

Impact:

- not a real YouTube ID, so fallback experience is limited

## F. README is still default

Current repo README does not describe the actual project.

This new file is intended to fill that gap.

---

## 19. Suggested next improvements

If this project is going to continue evolving, these are the best next upgrades.

### High-priority engineering improvements

- add DB transaction or compensating rollback for course generation
- add explicit `order_index` to `topics`
- refine topic completion rules
- improve analytics timestamps
- add more structured error handling around AI calls

### Product improvements

- export/share notes
- course regeneration with versioning
- admin analytics dashboard
- better certificate branding and issue history
- progress heatmap calendar
- more robust chatbot memory per topic

### Dev experience improvements

- replace the default `README.md`
- add setup instructions and architecture diagram
- add seed script / sample data
- add tests for server actions
- align package versions more tightly

---

## 20. How to run the project

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

---

## 21. Best one-line summary

**CAMPUS AI is a Next.js + Supabase + Gemini application that converts a raw university syllabus into a structured AI-guided course, then helps the student study it through notes, videos, practice, progress tracking, and verifiable certification.**

---

## 22. Recommended documentation follow-up

This file is a deep explanation file.

For best repo quality, the next step should be:

- replace `README.md` with a shorter setup-oriented version
- keep this file as the detailed architecture/reference document

