/**
 * Every line of copy, figure and source in the Same Page deck. Edit here, not in the slide components.
 * Profiles and fit scores are the fictional samples the live Same Page app ships with, read from its public API.
 */

export const links = {
  site: "https://samepage.replit.app",
  siteLabel: "samepage.replit.app",
  webregDemo: "https://samepage.replit.app/demo/webreg",
};

export type SourceStatus = "survey" | "study" | "prototype" | "sample" | "policy";

export type Source = { cite: string; title: string; url?: string; status: SourceStatus };

export const sources = {
  survey: {
    cite: "Same Page survey of 29 USC students, Nov 14 and 15, 2026",
    title: "Same Page team survey of 29 USC students, freshmen through grad students in more than 20 majors, November 14 and 15, 2026",
    url: "https://samepage.replit.app",
    status: "survey",
  },
  felton: {
    cite: "Felton, Mitchell and Stinson 2004",
    title: "Felton, Mitchell and Stinson (2004). Web-based student evaluations of professors: the relations between perceived quality, easiness and sexiness. Assessment and Evaluation in Higher Education 29(1)",
    url: "https://doi.org/10.1080/0260293032000158180",
    status: "study",
  },
  carrellWest: {
    cite: "Carrell and West 2010",
    title: "Carrell and West (2010). Does professor quality matter? Evidence from random assignment of students to professors. Journal of Political Economy 118(3)",
    url: "https://doi.org/10.1086/653808",
    status: "study",
  },
  uttl: {
    cite: "Uttl, White and Gonzalez 2017",
    title: "Uttl, White and Gonzalez (2017). Meta-analysis of faculty's teaching effectiveness: student evaluation of teaching ratings and student learning are not related. Studies in Educational Evaluation 54",
    url: "https://doi.org/10.1016/j.stueduc.2016.08.007",
    status: "study",
  },
  subtirelu: {
    cite: "Subtirelu 2015",
    title: "Subtirelu (2015). “She does have an accent but…”: race and language ideology in students' evaluations of mathematics instructors on RateMyProfessors.com. Language in Society 44(1)",
    url: "https://www.cambridge.org/core/journals/language-in-society/article/abs/she-does-have-an-accent-but-race-and-language-ideology-in-students-evaluations-of-mathematics-instructors-on-ratemyprofessorscom/1D4C9E099B351BADE27C9211526C4E01",
    status: "study",
  },
  reid: {
    cite: "Reid 2010",
    title: "Reid (2010). The role of perceived race and gender in the evaluation of college teaching on RateMyProfessors.com. Journal of Diversity in Higher Education 3(3)",
    url: "https://doi.org/10.1037/a0019865",
    status: "study",
  },
  boring: {
    cite: "Boring, Ottoboni and Stark 2016",
    title: "Boring, Ottoboni and Stark (2016). Student evaluations of teaching (mostly) do not measure teaching effectiveness. ScienceOpen Research",
    url: "https://doi.org/10.14293/S2199-1006.1.SOR-EDU.AETBZC.v1",
    status: "study",
  },
  brownKosovich: {
    cite: "Brown and Kosovich 2015",
    title: "Brown and Kosovich (2015). The impact of professor reputation and section attributes on student course selection. Research in Higher Education 56",
    url: "https://doi.org/10.1007/s11162-014-9356-8",
    status: "study",
  },
  usc2018: {
    cite: "Higher Ed Dive, 2018",
    title: "Higher Ed Dive (2018). USC nixes student evaluations as part of tenure review",
    url: "https://www.highereddive.com/news/usc-nixes-student-evaluations-as-part-of-tenure-review/524163/",
    status: "policy",
  },
  pashler: {
    cite: "Pashler et al. 2008",
    title: "Pashler, McDaniel, Rohrer and Bjork (2008). Learning styles: concepts and evidence. Psychological Science in the Public Interest 9(3)",
    url: "https://doi.org/10.1111/j.1539-6053.2009.01038.x",
    status: "study",
  },
  assistments: {
    cite: "Same Page prototype notebook on ASSISTments data",
    title: "Same Page prototype notebook: knowledge tracing on the public ASSISTments data set (130,000 answers from 3,239 students). The section ranges are for one synthetic student",
    status: "prototype",
  },
  samples: {
    cite: "Same Page sample profiles (fictional professors)",
    title: "Sample teaching profiles shipped with the Same Page app. Every professor named in them is fictional",
    url: "https://samepage.replit.app/demo/webreg",
    status: "sample",
  },
  studentHandbook: {
    cite: "USC Student Handbook",
    title: "USC Student Handbook: recording a class needs the instructor's permission and an announcement to the class",
    url: "https://policy.usc.edu/student-handbook/",
    status: "policy",
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof sources;

export const statusLabel: Record<SourceStatus, string> = {
  survey: "Our survey",
  study: "Published study",
  prototype: "Our prototype",
  sample: "Fictional sample",
  policy: "Policy or news report",
};

/** The seven fields of a teaching profile, in the order the app draws them. */
export const profileFields = [
  { key: "pace", label: "Pace", range: "Slow to fast" },
  { key: "format", label: "Format", range: "Lecture to discussion" },
  { key: "structure", label: "Structure", range: "Loose to organized" },
  { key: "grading", label: "Grading", range: "Exams to projects" },
  { key: "participation", label: "Participation", range: "Optional to graded" },
  { key: "guidance", label: "Guidance", range: "Guided to open-ended" },
  { key: "workload", label: "Workload", range: "Light to heavy" },
] as const;

/** Seven scores from 1 to 5, in the order of `profileFields`. */
export type Profile = readonly [number, number, number, number, number, number, number];

export type SampleSection = { number: string; instructor: string; shortName: string; days: string; time: string; profile: Profile };

/** The brand kit asks for this label wherever a sample professor appears. */
export const sampleLabel = "Sample professor, fictional";

export const sampleCourse = {
  code: "CSCI 103",
  name: "Object Oriented Programming",
  sections: [
    { number: "29901", instructor: "Dr. Maya Reyes", shortName: "Reyes", days: "MW", time: "10:00 to 11:50 am", profile: [2, 2, 5, 3, 2, 1, 3] },
    { number: "29903", instructor: "Prof. Daniel Okafor", shortName: "Okafor", days: "TTh", time: "2:00 to 3:50 pm", profile: [4, 4, 3, 5, 4, 4, 4] },
    { number: "29905", instructor: "Dr. Priya Natarajan", shortName: "Natarajan", days: "MWF", time: "9:00 to 9:50 am", profile: [5, 1, 4, 1, 1, 3, 3] },
  ] satisfies SampleSection[],
};

export const title = {
  wordmarkAlt: "Same Page SC",
  pitch: ["Pick the section", "that fits how", "you learn."],
  tagline: "Your next chapter begins with the right class.",
  byline: "Built by Trojans, for Trojans. AI@USC hackathon, November 2026.",
  notes: [
    "Hi, we're Same Page SC. Same Page helps USC students choose a section by how the class is actually taught, and it works right inside Web Registration as a Chrome extension. The line drawing in on the right is a teaching profile. You'll see it on every slide, because it's the whole product in one picture.",
  ],
};

export const survey = {
  heading: ["Most students we asked choose", "a section by its star rating."],
  respondents: 29,
  rows: [
    { count: 19, percent: 66, line: "use Rate My Professors to choose a class" },
    { count: 22, percent: 76, line: "say a professor's rating matters when they pick" },
    { count: 13, percent: 45, line: "said their class matched its ratings only somewhat or worse" },
  ],
  legend: "Each dot is one of the 29 USC students we surveyed this weekend. Mattering and accuracy were rated from 1 to 5: 4 or 5 counts as mattering, 3 or lower as somewhat or worse.",
  notes: [
    "This weekend we surveyed 29 USC students, from freshmen to grad students in more than 20 majors. Each dot is one of them. 19 of the 29 use Rate My Professors to choose a class, and 22 say the rating matters when they pick. But 13 of them said the class they got matched the ratings only somewhat or worse. The average accuracy score was 3.4 out of 5. So students lean on a number that often doesn't describe the class they end up in.",
  ],
};

export const ratings = {
  learning: {
    heading: ["Star ratings track how easy a class is", "and not how much students learn."],
    cards: [
      { figure: "r = 0.61", name: "Easy classes get higher ratings", detail: "Correlation between easiness and “quality” across 3,190 professors on Rate My Professors", source: "felton" },
      { figure: "Grades up", name: "Ratings rise with the grade you expect", detail: "In a randomized study, ratings went up with current grades and down with performance in later courses", source: "carrellWest" },
      { figure: "No link", name: "Ratings don't predict learning", detail: "A meta-analysis of multisection studies found no significant correlation between evaluations and learning", source: "uttl" },
    ],
  },
  bias: {
    heading: ["The same teaching gets a lower score", "depending on who teaches it."],
    cards: [
      { figure: "0.6 to 0.8", name: "Lower clarity scores for Asian-named math instructors", detail: "On a 5-point scale, with frequent comments about accents", source: "subtirelu" },
      { figure: "Lower", name: "Black and Asian faculty", detail: "Rated lower on quality, helpfulness and clarity", source: "reid" },
      { figure: "Can't be adjusted away", name: "Bias against women", detail: "Shown in evaluation data from France and the United States", source: "boring" },
    ],
    uscNote: "USC stopped using student evaluations in tenure decisions in 2018.",
  },
  followNote: "Students still follow the ratings: sections taught by higher-rated professors fill faster.",
  notes: [
    "The deeper problem is what the number measures. Across 3,190 professors, easiness and “quality” correlate at 0.61. In a randomized study at the Air Force Academy, ratings rose with the grades students expected and fell with how well they did in the next course. A meta-analysis found no significant link between ratings and learning.",
    "And the ratings are biased. Asian-named math instructors scored 0.6 to 0.8 points lower on clarity, with comments about their accents. Black and Asian faculty were rated lower on quality, helpfulness and clarity, and the bias against women can't be adjusted away statistically. USC itself stopped using student evaluations in tenure decisions in 2018. Students still follow the ratings anyway, and sections with higher-rated professors fill faster. That's unfair to professors, and it sends students to the wrong class.",
  ],
};

export const shapes = {
  heading: ["Same Page draws every section", "as a seven-point teaching profile."],
  explainer: "Three sample sections of CSCI 103. Each point is a 1 to 5 rating built from notes and syllabi that students shared from that exact section.",
  notes: [
    "Here's what we show instead. These are three sections of the same course, CSCI 103, and each one is drawn as a teaching profile: seven ratings from pace down to workload, connected into one line. Students who took the section share typed notes and the syllabus, and AI turns them into these ratings. Every point links back to the notes behind it. You can see right away that these are three different classes. Reyes is slow and highly organized with step-by-step examples. Natarajan moves fast and is mostly exams. Okafor is discussion-heavy and project-based. None of them is the best professor. Each one is the best fit for somebody.",
  ],
};

export const fit = {
  heading: ["Your answers turn a profile into a fit score", "with one honest downside."],
  score: 93,
  scoreCounts: "fit out of 100, from pace, structure, grading and 4 more",
  student: [1.5, 3, 4, 3, 2, 1, 3] as Profile,
  whyTitle: "Why it fits",
  why: "You're new to coding and want step-by-step guidance. Reyes works through every example live before you try one, at a pace that leaves room for questions.",
  downsideTitle: "Watch out for",
  downside: "Her syllabus is strict and every deadline is fixed, which is a bit more structure than you asked for. Class is mostly lecture, with little discussion.",
  legend: { student: "You", section: "Dr. Reyes", gap: "Where you differ" },
  notes: [
    "A student answers eight quick questions about how they learn best: pace, structure, how they like to be graded. There's no “visual learner” quiz, because the research doesn't support learning styles. Their answers become the dashed line, drawn over each section's profile, and the shaded area is where they differ. A fixed scoring function turns that into a fit score, and the score always says what it counts. Then Claude explains the match in plain language and always names one honest downside. Here that's a stricter syllabus and less discussion than this student asked for.",
  ],
};

export const webreg = {
  heading: ["Same Page shows up where students", "already register."],
  page: "Web Registration",
  term: "Spring 2027 Classes",
  badge: (score: number, name: string) => `${score}% teaching fit with ${name}`,
  needsQuiz: "Answer 8 questions to see your fit",
  panelTitle: "In Chrome's side panel",
  panelLines: ["The full match and its downside", "The section's profile next to yours", "The notes behind every point"],
  demoNote: "Demo class list with fictional sample professors, at samepage.replit.app/demo/webreg",
  notes: [
    "Students don't have to change how they register. The Chrome extension reads the course codes and instructor names already on the Web Registration page and puts a small badge under each section, with the profile line and the fit score. Clicking it opens the full match in Chrome's side panel. The extension never asks for a USC login and never sends requests to Web Registration itself. You can try it on our demo class list today.",
  ],
};

export const tryClass = {
  heading: ["Students can sit in on a simulated class", "before they register."],
  hall: "A 144-seat hall modeled on USC's published specs for GFS 106",
  moments: ["How class opens", "A question to the class", "A student's question", "Engagement", "A worked example", "How class ends"],
  momentsTitle: "Jump to a moment",
  seatNote: "Pick any seat",
  status: "Built in 3D with Three.js and neural voices. Professors A and B are fictional, and every number in the simulation is simulated.",
  notes: [
    "Some things a profile can't tell you, like what it feels like to sit in that room. So we built Try this class, a 3D lecture hall modeled on GFS 106. A student picks a seat and jumps to moments like how class opens, a student's question or a worked example, and hears the lesson in a neural voice. From Web Registration, the button under each section opens the simulation in the style closest to that section's profile. The professors are fictional characters, and we never imitate a real professor. This part is built on a branch and isn't on the live site yet.",
  ],
};

export const ai = {
  pipeline: {
    heading: ["Claude reads the notes and explains the match.", "A fixed formula does the ranking."],
    steps: [
      { name: "Students share notes", detail: "Typed notes and syllabi. Names are removed before anything is saved." },
      { name: "Claude builds the profile", detail: "Seven 1 to 5 ratings, each with an evidence note" },
      { name: "A fixed formula ranks sections", detail: "Deterministic scoring. The AI never changes the order." },
      { name: "Claude explains the fit", detail: "Plain words and exactly one downside, with structured outputs" },
    ],
    safeguards: ["The API key stays on our server", "A written fallback if the model is unavailable", "Comments about personality or looks are dropped"],
  },
  model: {
    heading: ["Our prototype predicts a range for each section", "instead of one number."],
    aucTitle: "Knowledge tracing on real student answers",
    aucLine: "130,000 answers from 3,239 students in the public ASSISTments data set",
    auc: [
      { label: "Our model", value: 0.74 },
      { label: "Skill difficulty only", value: 0.58 },
    ],
    aucScale: "Area under the curve for held-out students' next answers. 0.5 is a coin flip and 1.0 is perfect.",
    rangeTitle: "Predicted fit for one synthetic student",
    ranges: [
      { label: "Section A", low: 56, high: 79 },
      { label: "Section B", low: 63, high: 82 },
    ],
    rangeNote: "Synthetic student and sections. Effects are modest, so we show ranges.",
  },
  notes: [
    "Here's how the AI fits together, and where we deliberately don't let it decide. Claude reads the notes students share and turns them into the seven ratings, each with an evidence note. Then a fixed scoring formula ranks the sections, so the ranking is repeatable and explainable, and the AI never changes the order. Claude comes back at the end to explain the fit in plain words with exactly one downside, using structured outputs, with a fallback on the server if the model is down. The API key never leaves our server.",
    "We're also prototyping a learning model. Knowledge tracing on the public ASSISTments data, 130,000 real answers from 3,239 students, predicts held-out students' next answers with an AUC of 0.74, against 0.58 for a baseline that only knows how hard each skill is. For a student choosing between sections, it gives a range, not a promise: here 56 to 79 percent in Section A and 63 to 82 in Section B, for a synthetic student. The effects of teaching style are real but modest, so we always show ranges.",
  ],
};

export const fairness = {
  heading: ["Profiles describe the class", "and never the person."],
  rules: [
    { name: "Text notes only", detail: "We never record classes. Students share typed notes and syllabi." },
    { name: "Names come out first", detail: "Student names and personal details are removed before anything is saved." },
    { name: "No star ratings", detail: "Comments about a professor's personality, looks or accent are dropped." },
    { name: "No learning-style quiz", detail: "We match on how you learn best, not “visual” or “auditory” labels." },
    { name: "Professors get a say", detail: "Professors can see how students describe their class and add a response." },
  ],
  notes: [
    "Because this touches professors' reputations, fairness is built into the rules, not added later. We only take typed notes and syllabi, never recordings. Names come out before anything is saved. Comments about personality, looks or accent are dropped, so a profile can only describe how the class runs. We don't sort students into learning styles, because the research doesn't back it. And professors can see how students describe their class and respond. It's a mirror of the teaching, not a ranking of the teacher.",
  ],
};

export const rollout = {
  heading: ["Student Government can pilot Same Page", "next semester."],
  phases: [
    {
      when: "Built this weekend",
      name: "Live and usable now",
      items: ["Web app with guest access", "Chrome extension for Web Registration", "Try this class simulation"],
    },
    {
      when: "Spring 2027 pilot",
      name: "Run with Student Government",
      items: ["Collect notes for high-enrollment courses", "Invite professors to review and respond", "Measure drops and switches against the fit score"],
    },
    {
      when: "After review",
      name: "Professors choose what to share",
      items: ["Syllabus and slides", "Audio processed on the device", "Existing Zoom transcripts"],
    },
  ],
  needsNothing: "The pilot needs no USC login and no access to USC systems. The extension only reads the page a student already has open.",
  gate: "Any recording waits for the professor's permission, review by USC's Office of the General Counsel and IRB approval.",
  notes: [
    "This is something Student Government can actually run. It's live today, and the pilot needs nothing from USC IT: no USC login, no data feed, because the extension only reads the page a student already has open. In a spring pilot, Student Government would gather notes for a set of high-enrollment courses, invite those professors to review and respond, and check whether students who follow the fit score drop or switch less. Later, if professors want richer profiles, each one chooses what to share: syllabus and slides, audio processed on their own device, or Zoom transcripts they already make. We won't add any recording until the professor has given permission and USC's general counsel and IRB have signed off.",
  ],
};

export const closing = {
  heading: ["Your next chapter begins", "with the right class."],
  goals: ["Fewer drops and switches", "Fairer treatment of professors", "Credits well spent", "Better learning"],
  goalsTitle: "What we're aiming for",
  cta: "Try it now",
  notes: [
    "When Monday's registration opens, we want every Trojan to know how each section is taught and why it fits them, with an honest downside. Our goals are fewer drops and switches, fairer treatment of professors, credits well spent and better learning. Same Page is live at samepage.replit.app. Thank you.",
  ],
};

export const appendix = {
  heading: "Sources",
  notes: ["Every figure in the deck and where it comes from. Survey results are ours. Profiles and fit scores are fictional samples."],
};
