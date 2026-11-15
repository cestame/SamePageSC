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
- `npm run build && npm start` serves on http://localhost:3000. `npm run check` = lint + type check + tests (47 tests, all passing, no API key needed). `npm run eval` runs the AI evals against the real model (needs `ANTHROPIC_API_KEY`, billed).
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
- Demo class list: `GET /demo/webreg` (`server/demoPage.js`, redesigned by a teammate on 2026-11-15: full column set, collapsible courses, search, course-bin toggles, striped rows, Lato; kept exactly as she wrote it at the person's request, including the cardinal "Web Registration" header; it carries a "not a USC site" notice and a footer saying the interface is recreated for a demo. Do not restyle it without asking) renders the fictional sample sections with webReg's markup structure (`courseBin_`, `section_`, `section_crsbin`, labeled cells) but no USC name, logo or styling, and says it is a demo and not a USC site. The extension runs on it too (manifest matches `/demo/*` on localhost and Replit) and sends `includeSamples`, so sample professors match there (labeled "sample professor, fictional") and never on real webReg. This is how judges try the extension without a USC login.
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
## Pitch deck (2026-11-15)

- `deck/` is the finalist slide deck: a standalone Vite + React + Tailwind app with its own `package.json`, kept out of the root lint and builds (root `eslint.config.js` ignores `deck`). It follows the Same Page brand kit in its dark theme, repeats the profile line and opens with the tile horse and bird.
- 12 slides: title, survey (19, 22 and 13 of 29), what star ratings measure and their bias, three sample CSCI 103 profiles, the Reyes 93% fit with its downside, the WebReg badge, Try this class, how the AI splits work between Claude and the scorer (plus the knowledge-tracing prototype), fairness rules, the Student Government pilot plan, closing, sources.
- Survey slide shows counts beside percentages, which the landing page deliberately leaves out. Check with the person before presenting.
- Not yet checked against the papers: Reid 2010, Boring et al. 2016, Carrell and West 2010, Uttl et al. 2017, Brown and Kosovich 2015. Felton 2004 (r = 0.61), Subtirelu 2015 (0.6 to 0.8) and USC's 2018 tenure change were checked.

## Try this class on the site (2026-11-15)

- The 3D lecture hall from `webreg-try-this-class` (commit 0832b93) is on `main` at `/try-this-class/`, with its voice audio and the webReg "Try this class" button. The next commit on that branch (class capture with microphone and cameras) was left out, because CLAUDE.md says no recordings until the team decides otherwise.
- The landing page has a navy "Sit in on a class before you register" band after the Reyes preview, with a picture of the hall (`client/public/try-this-class/preview.jpg`, taken from the simulation), a link to the hall and a link that opens it as Dr. Reyes's CSCI 103 section.
- The hall page got phone styles (wrapping top bar, taller room) and a favicon.
- `client/public/same-page-extension.zip` was rebuilt with the button, leaving `panel/try-this-class` out of the zip because the button opens the hall from the server.

## Landing page with less text (2026-11-15)

- The problem band now shows two fictional CSCI 103 sections (Reyes and Natarajan) as profile cards, with the survey figures as bars and a one-line source.
- How it works has a small picture per step (quiz choices, the real scorer's 93, 65 and 51 for the sample student, a downside pill, a note) and one short line each.
- The extension band keeps one sentence, with the install steps in a "How to install, in 4 steps" disclosure. Quotes, Try this class and both-sides copy were shortened.

## Get the extension page (2026-11-15)

- `#/get-extension` (`client/src/screens/GetExtension.tsx`) has the download, five install steps (with a button that copies chrome://extensions, since Chrome blocks links to it) and a "Test it on the sample Web Registration" card linking to `/demo/webreg`.
- Every "get the extension" button now leads there: the top bar, the hero's "Get the Chrome extension" and the extension band's "Download the extension". The extension band also links "Try it on the sample Web Registration". The old install-steps disclosure on the landing page was removed, since the page has the steps.

## Record a class (prototype, 2026-11-15)

- The team decided to allow recording (CLAUDE.md, README and the privacy rules were updated). Add notes now offers three method cards under Course and Professor: Record this class (default, labeled Prototype), Paste notes or a syllabus (the original flow, unchanged) and Import from Granola (a "coming soon" button with an inline note).
- Recording needs the consent checkbox, uses MediaRecorder with a live level waveform, and handles a blocked or missing microphone. `POST /api/recordings/analyze` takes the raw audio, sends it to pyannoteAI (`server/recording.js`, precision-3 with transcription), treats the most talkative speaker as the professor and keeps only their words. Student turns are timing only. The professor's transcript goes through the existing extraction; Format and Participation come from measured talk time and student turns.
- Nothing is saved until "Submit this profile". The server signs each draft so only a draft it built can be submitted (`/api/recordings/submit`), and sample results can never be submitted.
- Demo safety: "Try it with a sample recording" loads `server/sample-recording.json`, a fictional CSCI 103 lecture in pyannoteAI's output shape, through the same summary code. Without `PYANNOTE_API_KEY`, recording falls back to that sample and says so.
- Not yet tested against the live pyannoteAI API (no key here). Its docs don't say whether browser WebM/Opus audio is accepted.
- Try this class: the Same Page logo and a "Back to Same Page" link go to the home page, and the camera is clamped inside the hall so zooming or panning never leaves the room.

## AI evals and output guards (2026-11-15)

- `evals/` grades the two Claude tasks with plain-code checks, no second model. `cases.js` has 8 fictional extraction cases (lecture syllabus, discussion seminar, notes with student names and an email, notes with remarks about the professor's accent and clothes, a recipe, a prompt injection, sparse exam-only notes, a professor-only lecture transcript) and 4 explanation cases. Expected ratings are hand-labeled ranges.
- Checks: ratings in range, fields with no evidence left out, evidence found in the source, no names or personal details stored, nothing about the professor as a person, injected instructions ignored, no em dashes, no learning styles, no hype words, no fit number the scorer didn't compute, second person, sentence counts. "Watch out names the weakest fit" and "summary is two sentences" are reported but don't fail a case.
- `npm run eval` (options `--task extraction|explanation`, `--trials N`, `--min-pass 0.9`) prints a pass/fail table and saves JSON to `evals/results/` (gitignored). It has not been run yet because no API key was available in this session. Run it once the Replit secret is set, and fix cases or prompts from what fails.
- `evals/harness.test.js` runs the graders on fixed good and bad outputs inside `npm test`, so the graders themselves are tested offline.
- Production now uses the same checks (`server/aiGuards.js`): evidence that can't be found in the scrubbed notes or transcript is dropped before storing (`keepEvidencedFields(extracted, sourceText)`, shared post-processing in `profileFromExtraction`); em and en dashes in AI text become commas; an explanation that breaks a content rule is retried once, then the labeled template explanation is shown.
- Prompts were hardened: pasted text is treated as data (instructions inside it are ignored), evidence must reuse the source's words, no learning styles, no dashes, and explanations may only quote the given score and breakdown numbers.
- `scrubText` now also removes names after "Notes by", "Submitted by", "Taken by" and "Written by" with no colon (the eval cases found this gap).

## Name and deck labels (2026-11-15)

- The product is called "Same Page SC" everywhere people see it: the website, the extension (its name, toolbar title and badge labels), Add notes, Try this class and the deck. `shared/content.js` already had `PRODUCT_NAME = 'Same Page SC'`; the hard-coded "Same Page" strings were updated, and the extension download was rebuilt.
- The deck no longer shows the "Slide x, beat y" label or the B key that toggled it. The script page labels multi-part slides "Part 1 of 2".

## Class version of the pitch (2026-11-15)

- `deck/class.html`: 11 slides. Slides 1 to 4 and 8 to 11 are a normal slideshow; 5 to 7 (welcome, lesson, pop quiz) are played as a class and recorded. Opens with a "Do you remember?" callback to the keynote's paper and Foghorn Leghorn joke, and closes with "Class dismissed".
- The deck laptop records with the same `/api/recordings/analyze` endpoint as the website (filed under CSCI 103). Keys: R start, then stop and grade; H counts a raised hand on the current slide, Shift+H takes one back; S shows the backup. The report card counts only hands raised on slides 5 to 7.
- Backup: every live result is saved in that laptop's browser and becomes the next backup, so do one full rehearsal on the presenting laptop before the pitch. Without one, S falls back to the server's fictional sample lecture, labeled as such.
- Roles and all lines are in `deck/src/classContent.ts`. The deck shell, print page and script page now take a deck config, so both decks share them.

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
