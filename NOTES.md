# Notes

What's built and what's next, for whoever picks this up in the next session.

## Built (2026-11-14)

- Express API with Postgres on Replit (PGlite locally), Claude for profile extraction and match explanations.
- React + TypeScript + Vite frontend redesigned against CLAUDE.md: course picker as the first screen, 8-question intake, ranked matches with the top match dominant, professor profile with evidence, feedback, professor responses, contribute flow, privacy page.
- The profile line diagram (`client/src/components/ProfileLine.tsx`) is the motif and appears in the header, course picker, matches, profile, contribute success and privacy pages.
- Lint, type check and 7 tests pass (`npm run check`). Checked in headless Chrome at 390px in light and dark: no console errors, intake to matches to feedback works.

## Not yet verified

- The AI calls have not run against the real API, because no key was available locally. Test the contribute flow and explanations on Replit with `ANTHROPIC_API_KEY` set.
- Not yet deployed to Replit.

## Next

1. Import into Replit, add the database and secret, deploy, and test the AI paths with a real syllabus.
2. Check animations frame by frame on a real phone (diagram draw-in, score count-up, quiz taps) and with reduced motion on.
3. Stretch: Chrome extension mockup for the pitch (fit scores on the registration page).
