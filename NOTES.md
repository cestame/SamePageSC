# Notes

What's built and what's next, for whoever picks this up in the next session.

## Built (2026-11-14)

- Express API with Postgres on Replit (PGlite locally), Claude for profile extraction and match explanations.
- React + TypeScript + Vite frontend redesigned against CLAUDE.md: course picker as the first screen, 8-question intake, ranked matches with the top match dominant, professor profile with evidence, feedback, professor responses, contribute flow, privacy page.
- The profile line diagram (`client/src/components/ProfileLine.tsx`) is the motif and appears in the header, course picker, matches, profile, contribute success and privacy pages.
- Lint, type check and 7 tests pass (`npm run check`). Checked in headless Chrome at 390px in light and dark: no console errors, intake to matches to feedback works.

## Built (2026-11-14, evening)

- New flow: create a profile (first name, saved in the browser, no password) → setup (major, classes, 6 general questions, earliest and latest class time) → home with two quick questions per class and a weekly schedule.
- Schedule planner (`server/planner.js`, tested) picks one section per class with the best total fit inside the student's hours and with no overlaps. Students can pin a different section.
- Layouts widen on laptops: two-column home, matches, professor, setup and create pages.
- Two sample sections were moved (Whitfield to TTh 2:00 pm, Tran to MWF 10:00 am) so the planner has real conflicts to work around.
- Major is recorded and shown but doesn't change matching, because we have no real degree requirement data.

## Built (2026-11-14, night)

- Real accounts: email and password, scrypt-hashed, 30-day httpOnly session cookie, profile saved per account. "Try it without an account" keeps the browser-only guest profile, which moves into an account on sign-up.
- Major field searches USC's real majors list (usc.edu keyword filter, cached).
- Classes step: classes with section profiles, required courses for the major (from `shared/requirements.json`), search, and add-by-code for any other class.
- catalogue.usc.edu blocks automated requests (empty 202 on content and program pages), so requirements must be added by hand. `shared/requirements.json` is empty: fill in the demo majors before the pitch.

## Not yet verified

- The AI calls have not run against the real API, because no key was available locally. Test the contribute flow and explanations on Replit with `ANTHROPIC_API_KEY` set.
- Not yet deployed to Replit.

## Next

1. Import into Replit, add the database and secret, deploy, and test the AI paths with a real syllabus.
2. Check animations frame by frame on a real phone (diagram draw-in, score count-up, quiz taps) and with reduced motion on.
3. Stretch: Chrome extension mockup for the pitch (fit scores on the registration page).

## Built (2026-11-15)

- 15 more fictional sample sections: WRIT 150, MATH 125, CSCI 102, CSCI 104 and ACAD 176 (3 each). ECON 205 was skipped because the pasted catalogue text gives no title for it.
- Seeding now adds any missing sample courses and sections on every start, so existing databases pick them up without a reset.
