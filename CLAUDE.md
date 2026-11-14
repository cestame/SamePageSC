# Professor-Student Course Matching (working title)

A web app for the AI@USC hackathon. Current USC students contribute class notes and syllabi, an AI model turns them into a teaching profile for each professor, and incoming students get matched to the sections that fit them, with a plain reason for each match.

`spec.md` is the master brief. It sets the screens, the teaching profile fields, the matching logic, the privacy rules and the build order. When the spec and this file disagree on design, writing or tooling, this file wins. When they disagree on scope, features or privacy, the spec wins.

Submission is due Sunday, November 15 at 11:00 AM PT. A working, deployed app beats an unfinished ambitious one. Never leave the main branch broken.

## Stack

- Keep the stack the project already uses. Don't swap frameworks, databases or hosting without asking first.
- Icons come from Phosphor Icons (`@phosphor-icons/react`), not lucide and not emojis.
- `motion` for animation.
- All sample professors, courses and profiles live in one seed data file. All product copy that repeats (the product name, taglines, field names and their descriptions) lives in one content file, so a rename is a one-line change.
- API keys stay server-side and out of the repo. The repo is public.

## What this product should feel like

The app should feel like a tool a USC student made for other students: specific, calm and quick to use on a phone between classes. It should not feel like a generated landing page.

- The first screen is the first action. No marketing hero, no "Welcome to", no feature grid explaining the product. A student lands and starts the intake or picks a course.
- Mobile first. Design every screen at phone width, then widen it.
- The teaching profile is the motif. Draw the seven profile fields as one consistent diagram and reuse it everywhere a professor appears: match results, profile pages, the contribute confirmation. A student should recognize a professor's shape at a glance. (If the team picks a different motif, replace this rule, but keep one motif.)
- A neutral palette with one accent. The accent is USC cardinal, used for small marks, the diagram and motion. Gold is a second mark for rare emphasis only. Don't use USC's logos, seal or wordmark, and don't present this as an official USC site.
- Every screen has real states: loading, empty, error and success. Design them, don't leave defaults.

## Content rules

- **Never invent data or statistics.** Sample professors are fictional and are labeled as sample data wherever they appear. Any survey figure shown in the app or pitch comes from our real survey and says what it counts, such as "31 of 52 students we surveyed".
- **No learning styles.** Don't ask whether someone is a visual, auditory or kinesthetic learner, and don't describe matches in those terms. The research doesn't support it, and our pitch says so.
- **Profiles describe the class, not the person.** No comments on a professor's personality, appearance, accent or identity. If the AI model extracts something like that, drop it.
- **Show the evidence.** Every profile field carries a one-line note on what in the source text supports it, so a reader can check the AI's work.
- **The scoring function decides the ranking.** The AI model writes the explanation and never changes the order.
- **Say what a number counts, right beside it.** "82%" alone is meaningless. "82% fit, based on pace, structure and assessment" isn't.
- **Every match shows one honest downside.** A result that is all praise reads as an ad.
- **Privacy is visible in the product.** Text notes and syllabi only, no recordings. Strip student names and personal details before storing. Store the profile, not the raw notes.

## General

- Don't write summary markdown files or make copies of files (`.backup`, `.old`). We use Git. The one exception is `NOTES.md`, which tracks what's built and what's next for the next session.
- Use tools to understand a problem before changing code.
- Code should explain itself through clear names. Comment only tricky logic.
- Passing lint and type checks is a hard requirement. Pull branchy logic into named functions, replace nested conditionals with early returns or a lookup, and split a function that does more than one job.
- Never use em dashes anywhere: interface text, notes, code or comments. Use commas, colons, periods or parentheses.
- Commit after every working step. Check the deployed link still works after each push.

## Design standards

- Make professional, well-designed UI with no blurple. It should look good and still be easy to skim.
- Write copy in approachable, human, conversational terms, the way one student would explain it to another.
- Never use gradient text (`bg-clip-text` with `text-transparent` or similar).
- Never put a visible colored border on an element with rounded corners, because the border anti-aliases unevenly at the corners. Use a shadow, ring or fill instead, and keep visible borders for sharp-cornered elements. Thin neutral borders on rounded form inputs are the one exception.
- No gradient backgrounds, glass blur panels or glowing blobs as decoration.
- No cards inside cards. If a card needs sections, use spacing and type.

### Typography

- Never use Lora or similar bracketed, moderate-contrast "blog default" serifs for display or headings.
- Never use high-contrast italic display serifs anywhere (Instrument Serif, Playfair Display, DM Serif Display, Cormorant, Fraunces italic, Libre Caslon Display, Bodoni Moda, Italiana).
- Don't default to Inter or the system font for everything. Research Google Fonts before picking type. Check the weights, optical sizes and whether a variable version exists.
- Never set text in all caps unless the content is really uppercase (acronyms, course codes). That includes labels, buttons, nav and emphasis.
- Don't change letter-spacing. If type looks wrong at a size, the size or the family is wrong.
- The letter-spaced uppercase micro-label is banned, even when a library or reference recommends it. Small labels stay in sentence case at a readable size.
- Use monospace only for real code, data or figures aligned in a column. Never use it to make headings, captions or labels feel technical.
- Use the type scale (`text-sm`, not `text-[9px]`). Arbitrary values need a reason.

### Define it once

Anything that appears more than once gets one definition that everything else references:

- **Type:** text styles defined in the theme, not per-element font declarations.
- **Color:** semantic tokens (`--surface`, `--text-muted`, `--accent`) defined in one place, never raw hex or Tailwind colors scattered through components.
- **Elements:** a button is one `Button` component with variants. The same goes for cards, badges, the profile diagram, the fit score and quiz questions.
- **Spacing, radii, shadows and motion:** scales and easing curves live in the theme.

If a design change means touching many files, the abstraction is missing. Extend the existing theme and components before starting new ones.

### Layout

- No eyebrows (the small label floating above a heading).
- No short decorative horizontal rules.
- No decorative section numbers. Number things only when the reader needs the number, such as quiz progress, and set it in the heading's own font.
- No middot metadata strips (`Course · Professor · Units · Time`). Important facts get a key/value block or a real sentence, and the rest gets cut.
- No reflexive rows of three (three cards, three stats, three steps). Show as many things as there really are.
- Avoid colored icons on pastel rounded squares as a layout device.
- No mystery controls. A button or link says what it does before it's clicked ("See my matches for ACAD 183", not "Continue").
- A hot, saturated accent is for the diagram, motion and small marks, not for filling primary buttons or chips. Controls stay neutral with one calm accent.
- Text is the last resort. Before writing a label or caption, ask whether size, weight, color, position, a container, an icon or a small diagram could carry the same fact.
- Give each screen one heading that names the thing, with no comma and no supporting paragraph that restates it.
- Prefer a diagram, table or marked-up state over prose that says the same thing. Put details that don't fit behind a disclosure.
- Hierarchy: make the most important element dominant through size, color and contrast, and demote everything else. On the matches screen, that is the top match and why it fits.
- Show grouping with proximity, shared containers and alignment, not with headings that announce the group.
- Every meaningful state gets a visible change (shape, color, position, motion or contrast), not a text label.
- Tap targets are at least 44px and reachable with a thumb.

These rules target reflexes, not accessibility. Accessible names, alt text, focus states, color contrast and screen reader labels are never the thing being cut.

### Ambition

The app should look like a designer's portfolio piece that happens to work. Take on the big version of the task, inside the deadline.

- Use real imagery: drawn SVG diagrams, generated images or photos the team took on campus. No stock photos of students with laptops and no real company or university logos.
- Use animation with a purpose: the profile diagram draws in, a fit score counts up once, quiz answers respond to touch. Check animations frame by frame instead of assuming the CSS is right, and respect reduced-motion settings.
- Carry detail all the way through: grain, texture, edge treatment and weight.
- Repeat the one motif across the whole app.

## Writing

- No paraprosdokians (a sentence that turns on its second half for a wink).
- No rising tricolons and no three-beat rhythms.
- No fragments punctuated as sentences for drama. Every sentence needs a subject and a verb.
- Explain, don't evoke. A metaphor can sit beside a definition but never replace it.
- Length isn't the enemy, vagueness is. Name each new term where it first appears, show a concrete example and give the reason a thing works.
- Split the work between pictures and text. Before writing a third sentence of explanation, ask whether a diagram, worked example or before/after pair would say it better.
- No trailing phrases that rename what came before without a verb of their own, whether attached with a dash, colon or comma.
- No evaluative tags ("...and that's the point", "...which is important").
- Don't hang the point of a sentence off its end. If the key fact sits in a trailing clause, promote it to a main clause or split the sentence.
- A caption, tooltip or helper line must carry a fact the reader can't get from what it sits beside. Cover the image or control: if the words still say something specific, keep them.
- No hype words in the interface ("revolutionary", "seamless", "unlock", "supercharge", "AI-powered" as a selling point). Say what the thing does.
- Match explanations are written to the student in plain second person and name specifics from both profiles.

## Interface skills

If your Claude Code setup has the `better-*` skills (`better-ui`, `better-typography`, `better-colors`, `better-layout`, `better-accessibility`, `better-writing`, `better-interface`), load the relevant ones before writing UI. Where a skill conflicts with this file, this file wins.
