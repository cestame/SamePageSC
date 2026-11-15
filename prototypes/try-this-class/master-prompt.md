# Same Page SC: master project prompt for the Try This Class prototype

> **Scope note for agents working in this repo:** this brief covers the recording-based "Try this class" concept explored in `prototypes/try-this-class/`. The main app's rules in `CLAUDE.md` and `spec.md` (text notes and syllabi only, no audio or video) still govern everything outside this folder. Don't add recording to the main app without the team deciding it first.
You are joining the team building **Same Page SC**, an entry for USC's "By Trojans, For Trojans" hackathon. The judges are all USC professors. Read this whole brief before you write any code or copy, and follow the principles and constraints it sets out.

## 1. Official description
Same Page SC transforms classroom observations into transparent teaching profiles that help students find the right educational environment, while giving professors a fairer alternative to reputation-based ratings.

## 1b. One-line pitch
"Rate My Professor tells you what students *felt*. Same Page SC lets you *try* the class, and measures how well you'd actually learn in it."

## 2. The problem
- Students choose sections at registration with almost no real information. They rely on Rate My Professor, which is self-selected and tracks how easy a class is (easiness correlates with "quality" at r ≈ 0.61, Felton 2004). It isn't a measure of teaching.
- Student evaluations don't measure learning either:
  - In a randomized study (Carrell & West 2010, JPE), evaluations were positively correlated with grades in the current course and negatively correlated with performance in later courses.
  - A meta-analysis of multisection studies (Uttl et al. 2017) found no significant correlation between evaluations and learning.
  - Evaluations carry gender bias that can't be adjusted away (Boring, Ottoboni & Stark 2016).
  - USC removed evaluations from tenure decisions in 2018.
- Teaching styles really do differ. Across 2,000+ STEM classes, lecture took 74.9% of class time on average and only 18% of instructors were student-centered. Reliably characterizing one instructor takes at least 4 observations (Stains et al. 2018, *Science*).
- Teaching style affects outcomes: failure rates were 33.8% under traditional lecture vs. 21.8% under active learning (Freeman 2014). Students' sense of how much they learned is a poor guide (Deslauriers 2019).
- Classroom audio alone can classify teaching practice with about 90% accuracy, without analyzing what anyone says (DART, Owens et al. 2017, PNAS).

## 3. Product: two parts, captured passively
**Part 1, Class Capture.** The professor opts in once.
- **Day 1 (multimodal):** syllabus, a scan of the empty room, the professor's own video (movement, board use, slides), rules they state aloud (late policy, AI policy, grading weights), and class-level participation counts.
- **Days 2 to N (audio, Granola-style):** the professor's teaching moves, pace, questions, wait time, and interaction levels.
- **Brightspace (via LTI 1.3):** syllabus, slides, quiz items, and grades (with consent).

**Part 2, Student Learning Graph** (private, kept on the student's device).
- Built passively from: the student's own questions in class, Brightspace quiz results and timing, rewind spikes in lecture video (a confusion signal), prerequisite grades, and login times (a chronotype estimate).
- Optional one-tap signals: an "I'm lost" button, and confidence ratings on quizzes.

**Registration**
- Simulates the student in each section and shows a fit range with uncertainty, the weeks they're likely to struggle, and a time-of-day warning.
- **"Try this class":** a 5-minute interactive trial lesson in a simulated classroom, ending with a two-question check and a "you felt vs. you learned" comparison.

**Professor value:** a private teaching mirror, a heatmap of where students were confused, and a what-if sandbox (e.g. "add 3 seconds of wait time and predicted confusion at minute 41 drops").

## 4. Technical architecture
**A. Capture**
- Chrome extension (Manifest V3):
  - `chrome.tabCapture` for Zoom on the web; `getUserMedia` for the mic in in-person classes.
  - Media processing runs in an offscreen document.
- When a class uses Zoom cloud recording, prefer the Zoom API's VTT transcripts.
- Brightspace through LTI 1.3 Advantage: NRPS (rosters), AGS (grades), Deep Linking.

**B. Streaming minimization**
- Audio is processed in 30-second chunks held only in memory.
- Speech recognition runs on the device (faster-whisper). Speaker separation (pyannote) splits each chunk into three streams: professor, the enrolled student (matched to their voice sample), and other students.
- Other students' speech is reduced to timing and counts, then deleted. Raw media is deleted after features are extracted.

**C. Feature extraction**
- **Teaching moves:** an LLM with structured output labels each 30-second segment using a COPUS-derived taxonomy: explain, worked example, question to class, cold call, pause or think time, think-pair-share, demo, real-world connection, recap, logistics, tangent.
- **Activity from sound alone (DART-style):** time with a single voice, multiple voices, or no voice.
- **Voice delivery:** pace, pauses, and wait time after questions.
- **Video:** pose estimation on the professor only, text reading of the board and slides, and counts of raised hands. **No inference of emotion.**
- **Long-context multimodal pass:** Gemini 4 Carbon or Claude Fable 5.2 (both 1M context) reads whole sessions to extract policies and course structure.

**D. Professor representation**
- **Teaching signature vector:** talk ratio, questions per 10 minutes and their cognitive level, wait time, share of time on worked examples, pace, and how often they recap.
- **Teaching-move policy:** the probability of each move given the concept and how far into the class it is.
- **Course knowledge graph:** concepts and their prerequisites (NetworkX).

**E. Learner representation**
- **Mastery per concept:** Bayesian knowledge tracing, upgradable to DKT/SAKT, scored with IRT-calibrated quiz items.
- **Engagement:** the student's questions classified by ICAP level (interactive, constructive, active, passive) and Bloom's level.
- **Metacognition:** how well confidence matches correctness.
- **Chronotype:** estimated from login times.
- **Learner graph:** all of the above as a time series across the year.

**F. World model**
- **POMDP:** the hidden state is the student's mastery; actions are teaching moves; observations are quizzes and engagement signals.
- **Belief:** a particle filter with about 1,000 particles.
- **Simulation:** Monte Carlo semester rollouts produce a mastery curve and predicted hard weeks.
- **Uncertainty:** conformal prediction ranges (MAPIE).
- **Self-selection:** inverse propensity weighting corrects for which students pick which section.
- **Cold start:** LLM-simulated student agents, calibrated against real quiz results.
- **Traits as student covariates:** prior knowledge, chronotype, and anxiety, fit in a hierarchical Bayesian model so the data decides which traits matter.

**G. Matching**
- Don't compare the student graph directly against the professor graph. Instead, predict the student's outcome under each professor's teaching policy.
- Add nearest-neighbor evidence from past students with similar learner graphs ("students like you").
- Students choose what to optimize: grade, deep understanding, workload, or schedule.
- Simulate the **whole schedule** too, for example flagging week-8 midterm crunches using syllabus dates.

**H. Trial-lesson generator**
1. **Retrieve** the professor's own explanations of a week-3 concept from the transcripts.
2. **Script** the lesson in their teaching style, using their real sentences (extractive) wherever possible.
3. **Render** it in a **rasterized, pixel-art classroom**:
   - The empty-room scan, made with Gaussian splatting, is rendered at low resolution.
   - The professor appears as a stylized figure, never a photorealistic one.
   - Classmates are anonymous silhouettes driven by aggregate attendance, hand-raise, and discussion data.
4. **Interact:** the simulated professor asks questions at their real frequency and with their real wait time. Students' questions are answered only from the professor's transcripts, with citations; if the professor never covered it, the answer says so.
5. **Measure:** a two-question check, then the "felt vs. learned" comparison.
- Each lesson carries a provenance strip marking real vs. generated content, and C2PA Content Credentials.
- The professor chooses how they're represented (board view only, a stylized figure, or real clips), approves each lesson, and can withdraw it.

**I. Stack**
- Next.js and Tailwind; FastAPI; SQLite.
- NumPy, NetworkX, MAPIE, OpenDP.
- Recharts and D3; canvas or Three.js for the pixel classroom.
- faster-whisper and pyannote.

## 5. Consent, legal and privacy rules (non-negotiable)
- **Consent model:** instructor permission plus an announcement to the class, which is USC's own rule (Student Handbook p.17). Students are covered by a notice package: a syllabus line, the day-1 announcement, a Brightspace banner, Zoom's recording notice, and the extension's always-visible indicator.
- **Student opt-out:** one tap removes their voice ("exclude my voice") and gives them an off-camera seating zone. No per-student signature is required for lecture recording.
- **Recording law:** CA Penal Code 632 protects only confidential communications, and lectures generally aren't confidential (*Evens v. Superior Court*, 1999). Take extra care in small seminars and discussions.
- **Never:**
  - Infer emotion, mood, personality, or disability.
  - Analyze students' faces beyond counting hands.
  - Generate photorealistic deepfakes of professors.
  - Invent sentences a professor never said and present them as real.
  - Rank professors, or show professors individual students' data.
  - Allow personnel or disciplinary use.
  - Sell or redistribute lecture content (CA Ed Code 66450).
- **Privacy safeguards:**
  - Data minimization: keep features, delete media.
  - At least 10 students behind any published aggregate; differential privacy (OpenDP).
  - Federated learning and secure aggregation for student data.
  - Data expires each semester unless the student keeps it.
  - Every inference has a "why am I seeing this?" link that lets the student correct or delete it.
- **Deployment and access:**
  - Official USC deployment relies on FERPA's school-official exception, with data kept inside USC's own systems.
  - Digital likenesses need separate professor consent (CA Civil Code 3344; AB 2602).
  - OSAS accommodations always override these defaults.
  - Before any pilot, get review from USC's Office of the General Counsel, plus IRB approval through USC HRPP for any research use.
  - Audit speech-recognition error rates for each professor so accents aren't penalized. Compare professors only within the same course, and never score polish or fluency.

## 6. Learning science guardrails
- **Learning styles (VAK) are a myth** for matching instruction (Pashler 2008). Never claim to match on them.
- **Match on evidence-backed differences:**
  - **Prior knowledge (strongest):** expertise reversal, Kalyuga 2003.
  - **Chronotype:** Smarr & Schirmer 2018, a correlational study of about 14,900 students.
  - **Working memory:** reduce cognitive load rather than train it, since training doesn't transfer (Melby-Lervåg).
  - **Spatial skills:** trainable, g = 0.47 (Uttal 2013).
  - **Test anxiety:** an expressive-writing intervention, only for students who self-report anxiety.
  - **Context-dependent motivation levers:** utility value (Harackiewicz 2016), belonging (Walton 2023), growth mindset (Yeager 2019).
- Effects are modest. Always show ranges, never single grade predictions. Publish a calibration report each semester.

## 7. Rollout
- **Phase 0, the hackathon:** a prototype on permitted or open data (the team's own classes with written professor permission, or MIT OpenCourseWare) plus synthetic Brightspace-shaped data.
- **Phase 1:** a pilot with 3 to 5 professors in one department, run with the Center for Excellence in Teaching.
- **Phase 2:** official USC deployment as an LTI tool, with notice and opt-out and a data governance board.
- **Phase 3:** integration with Experience USC registration (the system replacing myUSC in 2027).

## 8. Hackathon rubric and demo
- **Rubric:** Impact & Campus Relevance 30%, Technical & AI Execution 25%, Feasibility & Implementation 25%, UX & Design 20%.
- **Demo flow, about 3 minutes:**
  1. A student opens registration and sees the fit ranges and the schedule-crunch warning.
  2. They try the same concept in two sections' pixel classrooms.
  3. The "felt vs. learned" screen.
  4. Switch to the professor's private mirror and what-if sandbox.
- **Lines to use:** "Students never have to do anything." "A video shows one day; Same Page SC shows the typical day." "Everything you hear, the professor actually said." "Same Page SC never judges a person."

## 9. How you (the agent) should work on this
- Uphold every rule in Sections 5 and 6. If a request conflicts with them, flag it and propose the compliant alternative.
- Use synthetic or permitted data only. Never scrape Brightspace or record anyone without consent.
- Label every number in the UI as either real or synthetic.
- Prefer simple, demo-able implementations over full infrastructure. A working rasterized simulation and a believable world-model output beat unfinished pipelines.
- Keep the tone professor-friendly: Same Page SC is a coach and a mirror, never an evaluator.

## 10. Product surfaces and where recording happens
- **Surface 1, Same Page SC Capture (professor-controlled; the only place recording happens):**
  - Runs on the podium computer, or wherever the professor teaches, as a Chrome side panel the professor starts per course. Zoom cloud recordings are pulled via the Zoom API instead when available.
  - The side panel shows the consent and notice status, a Start/Stop capture control, and a recording indicator.
  - Media is processed in memory and deleted; only features are uploaded.
  - Brightspace is connected through an LTI 1.3 tool, where the professor opts in once per course.
- **Surface 2, Student companion (optional, passive):**
  - An extension popup or side panel with the "I'm lost" button, quiz confidence ratings, and the private learning graph.
  - It never records other people. Capturing the student's own voice is opt-in only.
- **Surface 3, Web Registration overlay (read-only, no recording):**
  - A content script on USC Web Registration (webreg.usc.edu) and the Schedule of Classes (classes.usc.edu).
  - It adds a badge to each section: fit range, predicted hard weeks, time-of-day warning, and a "Try this class" button that opens the 3D classroom.
  - It reads only course and section IDs from the page. DOM selectors must be verified against the live, logged-in page.
- **Keep the registration extension free of any recording permissions** (tabCapture, microphone). This makes it easier for USC ITS and the Chrome Web Store to approve and for students to trust. Recording permissions live only in the Capture tool.