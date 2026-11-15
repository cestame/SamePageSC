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
- Local server note: it has been started in the background by Claude Code before and was killed once when the machine ran low on memory. Start it again only when the person asks. Stop it with Ctrl+C, never a force-kill: on 2026-11-14 a force-kill corrupted the local PGlite data, which was moved to `data/pglite-damaged-2026-11-14` and replaced with a fresh database (samples re-seed on start). AI is off locally until `ANTHROPIC_API_KEY` is set.
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

## Chrome extension (final submission, in progress)

- The team wants the final submission to be a Chrome extension that works inside USC Web Registration (`https://webreg.usc.edu`). Judges see the intro on every visit to the website, which the person approved.
- `extension/`: Manifest V3. `background.js` opens the side panel and calls `POST /api/sections/lookup`; `webreg.js` (content script on webreg.usc.edu) reads course codes and instructor names already on the page and adds a badge beside each section; `panel/` is the React client built with `npm run build:extension` (gitignored, rebuild before loading); `config.json` holds the server origin (localhost now, set it to the Replit URL and rebuild); `icons/` draw the profile line.
- Load it: `npm run build:extension`, then chrome://extensions, Developer mode, Load unpacked, pick the `extension` folder.
- Matching (`server/sections.js`): course code (lab letter ignored) plus instructor name parts. Sample professors never match real webReg sections. Badges: "82% teaching fit", "Answer 2 questions for your fit", "Set up Same Page for your fit" or "No notes yet", each opening the right page in the side panel.
- The side panel shares only answers and course ids with the background worker (`chrome.storage.local`, key `answers`), never name or email.
- Demo class list: `GET /demo/webreg` (`server/demoPage.js`, redesigned by a teammate on 2026-11-15: full column set, collapsible courses, search, course-bin toggles, striped rows, Lato; titled "Registration demo" in Same Page navy with a "Not a USC site" label, because a cardinal "Web Registration" header would impersonate USC on a public URL; empty Units and Registered cells stay blank rather than invented) renders the fictional sample sections with webReg's markup structure (`courseBin_`, `section_`, `section_crsbin`, labeled cells) but no USC name, logo or styling, and says it is a demo and not a USC site. The extension runs on it too (manifest matches `/demo/*` on localhost and Replit) and sends `includeSamples`, so sample professors match there (labeled "sample professor, fictional") and never on real webReg. This is how judges try the extension without a USC login.
- If the side panel will not open, a badge click opens the same page of the app in a new tab. `extension/site.js` runs on the Same Page website and saves the student's answers (sent by the site with `window.postMessage`) into extension storage, so answers given on the website also reach the badges.
- The server now closes the database on SIGINT/SIGTERM (`closeDb` in `server/db.js`).
- Demo plan: teammates add real notes for classes they took that appear in webReg, so those sections show real fit scores.
- The extension never calls webReg's internal endpoints (the calendar loads from `/api/Calendar`); it only reads what is rendered.
- webReg course list markup (from `/Courses?Program=ACAD`): sections inside `#courseBin_ACAD-176`, each `div#section_<number>.section > .section_crsbin`, cells are `.section_row` with a `.table-headers-xsmall` label then one <span> per value. The badge goes on its own full-width line before the trailing <a>, where webReg shows its own notes. Tested against a copy of that markup (linkedom, in a scratchpad, not a project dependency). Pages the person saves contain their name and USC email ("Welcome, ..." and the Datadog `setUser` block); strip them before reading.
- Not yet checked: that SameSite=Lax session cookies reach the server from the side panel (needed for logged-in accounts; guests work without cookies), and the server running on localhost:3000 is an old process without the new endpoint until it is restarted.

## Website and extension split (2026-11-15)

- The person decided the website explains and the extension does the analysis (Grammarly model). CLAUDE.md was updated to match.
- Landing page (`client/src/screens/Landing.tsx`) is the website's root `#/`. The intro now stops on the wordmark page with an "Enter Same Page SC" button (fade, no second page turn; "Skip intro" and Escape go straight in) and plays only when a visit starts on the landing page. Sections are full-width color bands (paper, navy for quotes, gray, paper, cream for the extension, gray); on laptops a dotted guide line runs down the left with a tile per section and the bird hops to the section in view. "Get the Chrome extension" is the hero's main button and a "Get the extension" button sits in the top bar. In "Good for both sides" the bird marks students and the horse professors. Then hero (wordmark, tagline, tile horse with the bird), the problem with survey figures (66%, 76%, 45% punchline; source line names the 29-student survey; the person asked not to show counts beside the percentages), six survey quotes (fifth emphasized), how it works (4 steps), the Dr. Reyes preview (fit 93 from the real scorer; the brief said 94 and "6 students' notes", both dropped as not real), the extension section with install steps, and both sides plus privacy points. Copy is from the team's content brief (`same-page-content-brief.md`, kept by the person, not in the repo).
- The app moved to `#/home`; the extension panel's root is still the app. Product name is now "Same Page SC".
- The brief also describes a new matches screen and quiz; not started. The person asked to see the landing page first.
- Deployed at https://samepage.replit.app (Replit calls deploying "Publish"; it builds from GitHub `main`). `extension/config.json` points there. The download `client/public/same-page-extension.zip` is the `extension/` folder (panel built) inside a `same-page-extension/` folder. Rebuild it after extension or client changes: `npm run build:extension`, copy `extension/` into a folder named `same-page-extension`, zip it with Windows `tar.exe -a -cf` (Git Bash tar writes a tar, PowerShell Compress-Archive writes backslash paths), then Republish on Replit.
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
5. Chrome extension for webReg (see "Chrome extension" above): finish the section reader, then demo with real contributed notes.
