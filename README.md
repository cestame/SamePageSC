# Trojan Fit

**Pick the USC section that fits how you learn, before add/drop.** By Trojans, for Trojans.

Built for AI@USC (HackSC x USC AI Committee).

## Problem

USC students choose between sections of the same course with almost no reliable information about how each professor actually teaches. Rate My Professors is biased toward a self-selected few and rates *people*, not *classes*. Students often discover a section doesn't suit them when add/drop is the only fix.

## Solution

A website (works from one link on any phone or laptop, nothing to install) that:

1. **Builds a teaching profile per section** from notes and syllabi that current students contribute. An AI model extracts seven 1-5 dimensions (pace, format, structure, assessment, participation, guidance, workload), each with a one-line **evidence note from the source text** so the extraction is checkable, plus a two-sentence summary of a typical class day. New contributions are **merged** (averaged) into the existing profile, never overwritten.
2. **Matches incoming students** after an 8-question, ~2-minute intake. Ranking is a **deterministic scoring function**, so results are explainable and repeatable; tap any match for the score breakdown. The AI only writes the 2-3 sentence "why it fits" and one honest "watch out for".
Every professor's profile is drawn as one diagram, the **profile line**: seven rows, one dot per rating, joined top to bottom, so each class has a recognizable shape. On a match, your answers are drawn over it and the shaded gap is what lowers the score.

3. **Closes the loop**: students who took the class answer 3 quick prompts, shown as "X of Y students confirmed this profile". Professors can view and respond to their own profile.

We deliberately do **not** ask about "visual / auditory / kinesthetic" learning styles: they are not supported by research.

## Privacy rules (product features)

- Text notes and syllabi only. No audio or video.
- Names, emails, phone numbers and student IDs are stripped **before** text is sent to the AI; only the extracted profile is stored, never raw notes.
- Profiles describe the class, not the person. Evidence that comments on appearance, accent, identity, etc. is dropped.
- No Brightspace crawling, no USC login, no dependency on USC systems.
- Contributions require confirming the notes are your own or shared with the professor's agreement.
- The 6 seeded professors (CSCI 103, ECON 203) are **fictional sample data** and are labeled as such. No student feedback is seeded.

## Stack

| Piece | Choice | Why |
|---|---|---|
| Server | Node.js 20+, Express | One process serves the API and the built site, easy to run on Replit |
| Frontend | React, TypeScript and Vite, mobile-first CSS with theme tokens, Phosphor icons, `motion` for animation | Typed components, one definition per element, fast on phones |
| Database | PostgreSQL (Replit's built-in database via `DATABASE_URL`) | Persistent across Replit deployments. Falls back to embedded [PGlite](https://pglite.dev) in `./data` when `DATABASE_URL` is unset, so local dev needs zero setup |
| AI | Claude (`claude-opus-5-5`) via the official Anthropic SDK with structured outputs | Reliable JSON for profile extraction; API key stays server-side |

### How matching works

For each dimension the student's answers become a target value and weight (`server/scoring.js`):

- **Prior knowledge** drives the guidance target (beginners → step-by-step sections) and tempers pace.
- Participation and workload only count against a section when it asks for **more** than the student wants.
- The goal (requirement / foundation / mastery) re-weights workload.

Score = weighted average of per-dimension fit, 0-100. Covered by tests in `server/scoring.test.js`.

## Run it

### On Replit
1. **Create Repl → Import from GitHub** → this repo. The `.replit` file sets up Node 20 and PostgreSQL.
2. Open the **Database** tool and create a PostgreSQL database (this sets `DATABASE_URL`).
3. In **Secrets**, add `ANTHROPIC_API_KEY`. Optionally add `PROFESSOR_RESPONSE_CODE` (lets professors post a "Verified" response).
4. Click **Run**. It installs packages, builds the site, and creates tables and sample data on first start.
5. **Deploy** (Autoscale) for a public URL. Make sure the deployment has the same secrets and database.

### Locally
```bash
npm install
npm run build
ANTHROPIC_API_KEY=sk-... npm start   # http://localhost:3000

# while working on the frontend, run these in two terminals:
npm run dev:server                   # API on :3000
npm run dev:client                   # site on :5173 with hot reload

npm run check                        # lint, type check and tests
```
Without an API key the app still runs: ranking, profiles and feedback work; contributions are disabled and match explanations fall back to a clearly labeled, non-AI summary of the score breakdown.

## Project layout

```
shared/
  content.js    product name, profile fields, intake questions, privacy copy
server/
  index.js      Express API + static hosting of the built site
  db.js         Postgres / PGlite connection and schema
  seed.js       6 fictional sample professors across 2 courses
  scoring.js    deterministic matching + profile merging
  planner.js    picks one section per class: best total fit, inside your hours, no overlaps
  ai.js         Claude calls: profile extraction, match explanations
  privacy.js    personal-detail scrubbing, person-not-class filter
client/
  src/theme.css        color, type, spacing, radius, shadow and motion tokens
  src/components/      Button, Card, ProfileLine (the profile diagram), FitScore, QuizQuestion, states
  src/screens/         create profile, setup, home (schedule planner), matches, professor, contribute, privacy
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/courses` | Courses with section counts |
| GET | `/api/courses/:id/professors` | Merged profiles for a course |
| GET | `/api/professors/:id` | Profile, feedback stats, professor responses |
| POST | `/api/plan` | `{courses: [{courseId, answers}], earliest, latest, locked}` → each class's sections ranked, plus the chosen section per class |
| POST | `/api/match` | `{courseId, answers}` → sections ranked by fit with breakdown |
| POST | `/api/explain` | `{professorId, answers}` → AI "why" + "watch out" (cached) |
| POST | `/api/contribute` | `{courseId, professorId \| professorName, sourceType, text, consent}` → extracted + merged profile |
| POST | `/api/feedback` | `{professorId, pace, format, workload}` booleans |
| POST | `/api/professors/:id/responses` | Professor response |

## Next steps

- Chrome extension that shows fit scores next to each section on the registration page, reading profiles from this site (not required for anything; may need USC IT approval).
- Pilot with one department through Student Government.
