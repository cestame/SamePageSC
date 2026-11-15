# Notes

What's built, what was decided, and what's next. Read this and CLAUDE.md at the start of every session.

Submission is due **Sunday, November 15, 2026 at 11:00 AM PT** (AI@USC, HackSC x USC AI Committee). The repo is https://github.com/cestame/SamePageSC (public, `main`; renamed from `aiusc`).

## Where things stand

- Everything below is committed and pushed. GitHub `main` is the current site.
- **Not deployed yet.** Replit import is the top priority so there is a working link to submit.
- **AI paths are untested.** No `ANTHROPIC_API_KEY` was available locally, so profile extraction (Add notes) and AI match explanations have never run against the real API. Without a key the app still works: Add notes shows a "paused" state and explanations fall back to a labeled, non-AI sentence built from the score breakdown.
- **Redesign is under way** from the person's Figma Make design ("Same Page"). See "Redesign" below.

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

1. Create Repl, Import from GitHub, `cestame/SamePageSC`. `.replit` sets Node 20 + PostgreSQL; Run does `npm install && npm run build && npm start`.
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

## Redesign (Figma Make "Same Page", in progress)

- Source: Figma Make file `6Um2xcZhYNwlvRqOlBp4bc` ("Redesign Website Landing Page"). The Figma MCP server can read Make files only through `get_design_context` with node `0:1`, which lists the source files as resources (`src/App.tsx`, `src/index.css`, `src/assets/*.png`). `create_session` and screenshots don't work on Make files.
- The person chose: build the sign-up page from it and carry its look app-wide; keep the horse intro but make it skippable and short; cut the marketing hero, the numbered 01/02/03 steps and the privacy marketing section.
- Done: product renamed to **Same Page** (`shared/content.js`, plus `PRODUCT_LINE`). Palette in `theme.css`: paper `#FBF8EE`, ink `#030027`, navy `#151E3F`, cardinal `#922E2E`, cream `#FFF0B6`, gold `#E0B600` (brand constants stay fixed in dark mode; dark mode uses a navy base and a cream primary button). Pill buttons, 50px inputs, 22px card radius, dark navy footer with the wordmark, wordmark image in the topbar, square-cornered calendar blocks, and a hard cardinal offset shadow (`--shadow-offset`) used only on the top match card.
- Sign-up page (`screens/AuthPage.tsx`): form panel first on phones, profile diagram and two facts beside it on laptops. Intro (`components/IntroSequence.tsx`): a full-screen overlay that plays by itself for about 7.6 s. The horse gallops right (image flipped), a tile-drawn bird lands on a measured seat on its back, then two book-style page turns (horse page, wordmark page) reveal the form. "Skip to sign up" or Escape jumps to the last turn. Plays on every load of the sign-up screen (the person asked for this while reviewing), left out entirely with reduced motion. The horse is now an SVG of tiles (`components/PixelHorse.tsx`): body read from the Figma image (`horseBody.ts`), legs drawn in four gallop poses (`horseLegs.ts`), 120 ms per pose.
- Images: `client/public/same-page-logo.png` from the Figma file. The horse PNG was replaced by the tile SVG.
- Not yet checked in a browser: the intro animation frame by frame, phone width, and dark mode.
- Next: restyle setup, home, matches and professor pages to the new look screen by screen, fixing the audit items below.

## World model research (`research/world-model/`)

- A Jupyter notebook, separate from the app. It fits Bayesian Knowledge Tracing on public ASSISTments quiz logs (held-out AUC 0.74), builds a population of learner types, and simulates synthetic students through two fictional sections. Output: `research/world-model/output/same_page_sc_sim_output.json`.
- Labels in it: REAL-FIT (fit to real responses), SYNTHETIC (course and teaching patterns), ASSUMPTION (teaching-move effects from research, tuned to Freeman 2014 failure rates).
- Known limits: this ASSISTments release has no wall-clock timestamps, so forgetting is an assumed rate and there is no time-of-day model. EdNet would add both. The active-learning weight came out high (one active minute counts about 10 lecture minutes) and should be presented as a starting value, not a finding.
- The 83 MB dataset is not committed. The notebook downloads it into `research/world-model/data/`, which `.gitignore` already covers.
- Not wired into the app. A possible next step is showing the fit ranges and hard weeks on the matches screen, which would need the sections' teaching patterns to come from contributed notes.

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
2. Finish the Same Page redesign on the remaining screens, fixing the audit items.
3. Check animations on a real phone and with reduced motion on.
4. Submission checklist from spec: working link, public repo, 3-minute video, slide deck, project description, screenshot, teammates on Devpost.
5. Stretch: Chrome extension mockup for the pitch (fit scores on the registration page).
