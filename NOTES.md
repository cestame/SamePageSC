# Notes

What's built, what was decided, and what's next. Read this and CLAUDE.md at the start of every session.

Submission is due **Sunday, November 15, 2026 at 11:00 AM PT** (AI@USC, HackSC x USC AI Committee). The repo is https://github.com/cestame/aiusc (public, `main`).

## Where things stand

- Everything below is committed and pushed. GitHub `main` is the current site.
- **Not deployed yet.** Replit import is the top priority so there is a working link to submit.
- **AI paths are untested.** No `ANTHROPIC_API_KEY` was available locally, so profile extraction (Add notes) and AI match explanations have never run against the real API. Without a key the app still works: Add notes shows a "paused" state and explanations fall back to a labeled, non-AI sentence built from the score breakdown.
- **Redesign is pending a decision.** The person finds the current UI "basic, no personality". See "Redesign" below.

## The product flow (as built)

1. **Sign up or log in** (`#/signup`, `#/login`): first name, email, password. "Try it without an account" (`#/guest`) gives a browser-only profile that moves into an account if they sign up later.
2. **Setup, 10 steps** (`#/setup`, `?step=<key>` jumps to one):
   - Major: live search of USC's real majors and minors.
   - Classes: classes with sample section profiles, the major's required courses (when in `shared/requirements.json`), search, and add-by-code for any other class (accepts "writ150", "WRIT-150", title optional).
   - 6 general questions asked once: format, structure, grading, participation, pace, goal. No learning-styles question, ever.
   - 2 time questions: earliest start, latest end.
3. **Home** (`#/home`, "Alexis's schedule"):
   - Each class asks 2 per-class questions: prior knowledge and weekly hours.
   - Answered classes show the best section, its profile line glyph and fit, and "Other sections" with reasons a section doesn't work ("Starts before 10:00 am", "Overlaps your CSCI 103 section") and "Use this section".
   - A Monday-to-Friday calendar shows the planned week.
   - Classes with no section profiles show "No one has added notes for any section yet" and a link to Add notes.
4. **Matches** (`#/matches?course=`): sections ranked by the deterministic score, top match dominant, profile line with the student's answers drawn over it, AI "why" and one "watch out", score breakdown, "Put this section in my schedule".
5. **Professor page**, **Add notes** (contribute), **Privacy** as before.

## Stack and how to run

- Node 20+, Express API (`server/`), React + TypeScript + Vite (`client/`), shared copy in `shared/content.js`.
- Database: Postgres on Replit via `DATABASE_URL`; PGlite in `./data/pglite` locally when it's unset.
- AI: Claude via `@anthropic-ai/sdk`, model `claude-opus-5-5`, structured outputs, server-side fallback enabled, key only on the server.
- `npm run build && npm start` serves on http://localhost:3000. `npm run check` = lint + type check + tests (12 tests, all passing).
- Local server note: it has been started in the background by Claude Code before and was killed once when the machine ran low on memory. Start it again only when the person asks.
- A Figma MCP server was added to Claude Code for this project (`claude mcp add --transport http figma https://mcp.figma.com/mcp`, local scope for `C:/Users/alexi/aiusc`). The person must run `/mcp` and log in to Figma. They are making a design in Figma Make; if the MCP server can't read a Make file, ask for a regular Figma Design file or screenshots.

## Replit deployment steps

1. Create Repl, Import from GitHub, `cestame/aiusc`. `.replit` sets Node 20 + PostgreSQL; Run does `npm install && npm run build && npm start`.
2. Database tool: create a PostgreSQL database (sets `DATABASE_URL`).
3. Secrets: `ANTHROPIC_API_KEY`. Optional `PROFESSOR_RESPONSE_CODE` (verified professor responses).
4. Run, then Deploy (Autoscale) with the same secrets and database. Tables and all sample data are created on first start.
5. Test Add notes with a real syllabus and check the AI explanations.

## Data and sources (decisions and constraints)

- **Sample data:** 21 fictional professors, 3 sections each of CSCI 102, CSCI 103, CSCI 104, ECON 203, MATH 125, WRIT 150, ACAD 176, all in `server/seed.js`, all labeled "Sample professor, fictional". Seeding adds any missing sample rows on every start (safe on existing databases). No student feedback is seeded (fake confirmation counts were removed as invented statistics).
- Two sample sections were moved (Whitfield TTh 2:00 pm, Tran MWF 10:00 am) so the planner has real conflicts. Demo story: a beginner taking CSCI 103, WRIT 150, MATH 125, CSCI 104 between 9 and 6 gets MATH 125 with Delgado (92%), which pushes CSCI 103 to Natarajan because Reyes overlaps Delgado on MW, and Park's 8 am MATH section is skipped.
- CSCI 103 is titled "Object Oriented Programming" to match the 2026-27 catalogue (CSCI 102L is "Introduction to Programming").
- **Real professors:** the person offered a list of real instructors. Decision: we never write teaching profiles for real people (that would be invented data about a real person). Real sections could be added later with name, section number and times only, showing "No notes yet" until real notes are contributed; sections without profiles are currently hidden, so that needs ~30 minutes of work.
- **Majors:** live search via the keyword filter on https://www.usc.edu/majors-minors/ (one request per search, cached). Its `/page/N/` pagination is disallowed by robots.txt, so we never page through the list.
- **Requirements:** `shared/requirements.json`, hand-filled from the USC Catalogue 2026-2027 (`catoid=22`; the person's link was `catoid=21`, the archived 2025-26 edition). Filled so far from text the person pasted: Computer Science (BS) `poid 32086`, Economics (BA) `31776`, Arts, Technology and the Business of Innovation (BS) `31586`. Economics courses mostly have no titles because the pasted page gave none; never fill titles from memory. To add a major, the person pastes the catalogue page text.
- **catalogue.usc.edu blocks automated requests** (empty HTTP 202) and its robots.txt asks for 120 s between requests. Do not try to get around it. Live fetching is off unless `CATALOGUE_LIVE_FETCH=true`.
- **classes.usc.edu (Schedule of Classes)** has an internal JSON API; calling it was blocked by the permission settings as unauthorized access to an undocumented API. Don't use it.
- ECON 205 has no sample sections because no title was available. Add it if the person supplies the title.

## Redesign (pending the person's choice)

- Mockups: https://claude.ai/artifact/F77aDXZKCRP6rLjJ8AoQ3g (laptop 1440x900 on top, phone below) with three directions for the home screen:
  - **A. Class notes** (recommended): notebook paper, ruled lines and a margin line, index cards with slight tilt, tape only on the top match, Shantell Sans handwriting only for real student notes (watch-outs, evidence quotes, margin notes), highlighter swipe once per screen.
  - **B. Two-ink zine**: black + cardinal on newsprint, Anybody condensed headlines, thick borders, halftone, misregistered profile line.
  - **C. Game day**: dark scoreboard, Big Shoulders numerals, gold score box, cardinal blocks.
- The person may instead design it in Figma Make and want it built from that.
- Proposed tokens for A (light / dark): `--paper #FBF8F1 / #1A1715`, `--rule #DFE6EE / #2A2622`, `--margin #E7B8B8 / #4A2626`, `--card #FFFFFF / #24201D`, `--surface-sunk #F1ECE3 / #2E2925`, `--ink #1F1B18 / #F1ECE6`, `--ink-muted #645B53 / #B2A89E`, `--accent #990000 / #E36A6A`, `--accent-soft #FBE3E0 / #3A1F1E`, `--highlight #FFE37A / #8A6D00`.
- Fonts checked on Google Fonts: Bricolage Grotesque (opsz 12-96, wdth 75-100, wght 200-800), Atkinson Hyperlegible Next (wght 200-800), Shantell Sans (wght 300-800, INFM 0-100, BNCE -100-100, SPAC 0-100, italics), Anybody (wdth 50-150, wght 100-900).
- Motif in A: same profile line encoding, drawn as a slightly wobbly pen stroke that draws in, the student's answers as a pencil line, the gap shaded like highlighter, and a handwritten margin note pointing at the row with the biggest gap (this satisfies "one honest downside").

## Open audit items (current UI vs CLAUDE.md)

Fix these during the redesign:
- Every block uses the same rounded white card and shadow, so nothing is dominant.
- Home: fit percentages have no caption saying what they measure; the best section per class shows no downside; calendar blocks have a colored inset stripe on rounded corners; the calendar caption is prose that should be a legend.
- Setup classes step: group headings announce groups ("Your classes", "Classes with section profiles", "Required for ...", "Add any other class").
- Matches and professor page show raw schedules ("MW 10:00-11:50"); home uses "Mon and Wed, 10:00 am to 11:50 am". Use `formatMeeting` everywhere.
- Off-scale font sizes in `components.css` (1.0625rem, 0.875rem, 0.8125rem, 13px).
- Privacy page: last list item has an empty icon slot.
- Sign-up page: empty left half and an explanatory paragraph; the motif doesn't appear.

## Next, in order

1. Deploy to Replit (steps above) and test the AI paths.
2. Get the person's redesign choice (A, B, C, or their Figma Make design) and build it, fixing the audit items.
3. Check animations on a real phone and with reduced motion on.
4. Submission checklist from spec: working link, public repo, 3-minute video, slide deck, project description, screenshot, teammates on Devpost.
5. Stretch: Chrome extension mockup for the pitch (fit scores on the registration page).
