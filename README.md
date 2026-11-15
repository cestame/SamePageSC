# Same Page

**Pick the USC section that fits how you learn, before add/drop.** By Trojans, for Trojans.

Built for AI@USC (HackSC x USC AI Committee).

## Built and deployed on Replit

**Live site: https://samepage.replit.app**

Replit hosts and runs the whole project. Here is what it does for us:

- **Development environment.** The [`.replit`](.replit) file sets up Node.js 20 and PostgreSQL 16, and Run installs packages, builds the site and starts the server.
- **Publishing from GitHub.** The Repl is connected to this repository, and publishing builds from `main` with `npm ci && npm run build`, then starts `npm start`.
- **Autoscale deployment.** The live site runs as an Autoscale deployment, with the app's port 3000 served on the public web port.
- **PostgreSQL database.** Replit's built-in PostgreSQL stores teaching profiles, contributions and accounts through `DATABASE_URL`, so data persists across deployments.
- **Secrets.** API keys such as `ANTHROPIC_API_KEY` are stored in Replit Secrets, so they stay on the server and out of this public repo.
- **Replit Agent and Assistant.** We used Replit's built-in AI while building parts of the project.

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

- Students add typed notes, a syllabus, or (prototype) a recording of a class the professor agreed to have recorded.
- Recordings: only the professor is transcribed. Students are counted, never transcribed. The audio is held in memory, dropped right after analysis and never written to disk. pyannoteAI, which separates the voices (model `precision-3`, key in the `PYANNOTE_API_KEY` secret), deletes its copy within 48 hours. Without the key, recording shows a saved sample instead.
- Names, emails, phone numbers and student IDs are stripped **before** text is sent to the AI; only the extracted profile is stored, never raw notes.
- Profiles describe the class, not the person. Evidence that comments on appearance, accent, identity, etc. is dropped.
- No Brightspace crawling, no USC login, no dependency on USC systems.
- Contributions require confirming the notes are your own or shared with the professor's agreement.
- The 21 seeded professors (3 sections each of CSCI 102, CSCI 103, CSCI 104, ECON 203, MATH 125, WRIT 150 and ACAD 176) are **fictional sample data** and are labeled as such. No student feedback is seeded.

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
  seed.js       21 fictional sample professors across 7 courses (added on start if missing)
  scoring.js    deterministic matching + profile merging
  planner.js    picks one section per class: best total fit, inside your hours, no overlaps
  ai.js         Claude calls: profile extraction, match explanations
  privacy.js    personal-detail scrubbing, person-not-class filter
client/
  src/theme.css        color, type, spacing, radius, shadow and motion tokens
  src/components/      Button, Card, ProfileLine (the profile diagram), FitScore, QuizQuestion, states
  src/screens/         create profile, setup, home (schedule planner), matches, professor, contribute, privacy
deck/           the finalist pitch deck, its own small Vite app (see below)
```

### The pitch deck

`deck/` holds the slides for the live finalist presentation. It's separate from the app, with its own packages, so nothing in it can break the site. All slide copy, figures, sources and speaker notes are in `deck/src/content.ts`.

```
cd deck
npm install
npm run dev       # the deck; arrow keys to move, N for notes, F for full screen, P for the print version
npm run build     # dist/index.html is the deck, dist/print.html has one beat per landscape page
npm run check     # lint, types and the em dash check
```

Devpost wants the slides as images: open `print.html` and save each page, or print it to PDF.

There is also a class version of the pitch at `/deck/class.html` (script at `/deck/class-script.html`, print at `/deck/class-print.html`). It is a normal slideshow except the live walkthrough, which is played as a class: the deck laptop records it with Record this class, a teammate counts raised hands with the H key, and the report card slide shows the class's own analysis. R starts and stops the recording, H counts a hand (Shift+H takes one back), and S shows a backup report card: the last live run saved on that laptop, or the fictional sample lecture.

The live site serves the deck at https://samepage.replit.app/deck/ (print version: https://samepage.replit.app/deck/print.html). The root `npm run build` builds it into `dist/deck` after the app, so publishing the site on Replit publishes the deck too.

## USC majors and requirements

- **Majors** come from the keyword filter on [usc.edu/majors-minors](https://www.usc.edu/majors-minors/). The server sends one request per search a student types and caches the results. It never pages through the list, because robots.txt disallows the `/page/` links.
- **Requirements** come from `shared/requirements.json`, filled in by hand from the [USC Catalogue 2026-2027](https://catalogue.usc.edu/index.php?catoid=22). The catalogue turns away automated requests (it answers with an empty 202) and asks for 120 seconds between requests, so the app doesn't scrape it. Each entry is keyed by the program's catalogue `poid` (shown in the program's catalogue URL):

```json
{
  "32086": {
    "name": "Computer Science (BS)",
    "source": "https://catalogue.usc.edu/preview_program.php?catoid=22&poid=32086",
    "courses": [{ "code": "CSCI 103", "title": "Introduction to Programming" }]
  }
}
```

- Students can also search any course in that file or add a class by code and title. Classes without section profiles show up on the schedule page with a prompt to add notes.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/courses` | Courses with section counts |
| GET | `/api/courses/:id/professors` | Merged profiles for a course |
| GET | `/api/professors/:id` | Profile, feedback stats, professor responses |
| POST | `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout` | Email and password accounts (scrypt hashes, httpOnly session cookie) |
| GET/PUT | `/api/auth/me`, `/api/profile` | The signed-in student's saved profile |
| GET | `/api/usc/programs?q=` | Searches USC majors and minors |
| GET | `/api/usc/programs/:poid/requirements` | Required courses from `shared/requirements.json` |
| GET/POST | `/api/usc/courses?q=`, `/api/courses` | Course search, and adding a class by code |
| POST | `/api/plan` | `{courses: [{courseId, answers}], earliest, latest, locked}` → each class's sections ranked, plus the chosen section per class |
| POST | `/api/match` | `{courseId, answers}` → sections ranked by fit with breakdown |
| POST | `/api/explain` | `{professorId, answers}` → AI "why" + "watch out" (cached) |
| POST | `/api/contribute` | `{courseId, professorId \| professorName, sourceType, text, consent}` → extracted + merged profile |
| POST | `/api/feedback` | `{professorId, pace, format, workload}` booleans |
| POST | `/api/professors/:id/responses` | Professor response |

## Next steps

- Chrome extension that shows fit scores next to each section on the registration page, reading profiles from this site (not required for anything; may need USC IT approval).
- Pilot with one department through Student Government.
