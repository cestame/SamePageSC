/**
 * Every line of copy, figure and source in the Same Page deck. Edit here, not in the slide components.
 * Profiles and fit scores are the fictional samples the live Same Page app ships with, read from its public API.
 */

export const links = {
  site: "https://samepage.replit.app",
  siteLabel: "samepage.replit.app",
  webregDemo: "https://samepage.replit.app/demo/webreg",
  tryClass: "https://samepage.replit.app/try-this-class/",
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

/**
 * `fit` is server/scoring.js's score for the landing page's sample student: new to coding (prior 1), pace 2,
 * format 3, structure 4, assessment 3, participation 2, workload 3, goal "foundation".
 */
export type SampleSection = { number: string; instructor: string; shortName: string; days: string; time: string; profile: Profile; fit: number };

/** The brand kit asks for this label wherever a sample professor appears. */
export const sampleLabel = "Sample professor, fictional";

export const sampleCourse = {
  code: "CSCI 103",
  name: "Object Oriented Programming",
  sections: [
    { number: "29901", instructor: "Dr. Maya Reyes", shortName: "Reyes", days: "MW", time: "10:00 to 11:50 am", profile: [2, 2, 5, 3, 2, 1, 3], fit: 93 },
    { number: "29903", instructor: "Prof. Daniel Okafor", shortName: "Okafor", days: "TTh", time: "2:00 to 3:50 pm", profile: [4, 4, 3, 5, 4, 4, 4], fit: 51 },
    { number: "29905", instructor: "Dr. Priya Natarajan", shortName: "Natarajan", days: "MWF", time: "9:00 to 9:50 am", profile: [5, 1, 4, 1, 1, 3, 3], fit: 65 },
  ] satisfies SampleSection[],
};

/*
 * Slide words are kept to what the audience needs to read at a glance. Everything the presenter says lives in
 * each slide's `script`, one paragraph per beat, which feeds both the presenter notes and the script page.
 */

export const title = {
  wordmarkAlt: "Same Page SC",
  pitch: ["Find the section", "that fits you."],
  byline: "Lia Choi, Alexis Limary, Ame Wang, and Srinija Chukkapalli",
  script: [
    "Hi, we're Same Page SC. Every semester, Trojans pick sections with almost nothing to go on. Same Page shows how each section is actually taught and how well it fits the way you learn, right inside Web Registration.",
  ],
};

export const survey = {
  heading: ["29 students. 3 signals."],
  respondents: 29,
  rows: [
    { count: 19, percent: 66, line: "use Rate My Professors" },
    { count: 22, percent: 76, line: "say ratings matter" },
    { count: 13, percent: 45, line: "found ratings only somewhat accurate or worse" },
  ],
  script: [
    "This weekend we surveyed 29 USC students, from freshmen to grad students in more than 20 majors. Each dot is one of them. 19 of the 29 use Rate My Professors to choose a class, and 22 say a professor's rating matters when they pick. But 13 told us the class they got matched the ratings only somewhat or worse. Their average accuracy score was 3.4 out of 5.",
  ],
};

export const ratings = {
  learning: {
    heading: ["Stars track ease, not learning."],
    easiness: { value: 0.61, label: "Easier classes tended to get higher ratings" },
    grades: { up: "Expected grade", down: "Next-course result" },
    learning: { label: "No significant link to learning" },
  },
  bias: {
    heading: ["Same teaching. Unequal ratings."],
    instructors: ["US-named instructor", "Asian-named instructor"],
    gap: "0.6–0.8 lower on clarity",
    scaleNote: "Bars illustrative. The gap is to scale on a 1 to 5 rating.",
  },
  script: [
    "The deeper problem is what a star rating measures. Across 3,190 professors on Rate My Professors, easiness and the quality score correlate at 0.61. In a randomized study, ratings went up with the grades students expected and down with how well they did in the next course. A meta-analysis of multisection studies found no significant link between ratings and learning. Students follow the ratings anyway: sections with higher-rated professors fill faster.",
    "The ratings are also unfair to professors. These two instructors teach the same way, and in one study the Asian-named math instructors still scored 0.6 to 0.8 points lower on clarity, often with comments about their accents. Black and Asian faculty are rated lower on quality, helpfulness and clarity, and the bias against women can't be adjusted away. USC itself stopped using student evaluations in tenure decisions in 2018.",
  ],
};

export const shapes = {
  heading: ["One profile. Seven teaching traits."],
  script: [
    "So instead of a star, Same Page draws every section as a teaching profile. Students who took the section share typed notes and the syllabus, and Claude turns them into seven ratings, from pace down to workload, each tied to the notes behind it. These are three sections of the same course, CSCI 103. Reyes is slow and highly organized and walks you through every example. Natarajan moves fast and grades on exams. Okafor runs discussions and grades on projects. None of them is the best professor, and each one is the best fit for somebody. All three are fictional samples.",
  ],
};

export const fit = {
  heading: ["A match you can see."],
  scoreCounts: "fit across 7 teaching traits",
  student: [1.5, 3, 4, 3, 2, 1, 3] as Profile,
  whyTitle: "Fits",
  why: "Step-by-step examples",
  downsideTitle: "Trade-off",
  downside: "Fewer discussions. Tighter deadlines.",
  legend: { student: "You", section: "Dr. Reyes", gap: "Where you differ" },
  script: [
    "Then you answer eight quick questions about how you learn best. There's no visual-learner quiz, because the research doesn't support learning styles. Your answers become the dashed line, and the shaded area is where you and the class differ. Our scoring function turns that into a fit score, and the score always says what it counts. Then Claude explains the match in plain words and always names one honest downside. For this new coder, Reyes is a 93 percent fit, and the catch is stricter deadlines and less discussion than they asked for.",
  ],
};

export const webreg = {
  heading: ["See fit inside WebReg."],
  page: "Web Registration",
  badge: (score: number, name: string) => `${score}% fit with ${name}`,
  panelTitle: "Chrome side panel",
  demoNote: "Try it: samepage.replit.app/demo/webreg",
  script: [
    "You don't have to change how you register. Our Chrome extension reads the sections already on the Web Registration page and puts a badge under each one. For the same new coder, Reyes's section is a 93, Natarajan's is a 65 and Okafor's is a 51. Click a badge and the full match opens in Chrome's side panel. The extension never asks for your USC login, and you can try it today on our demo class list.",
  ],
};

export const tryClass = {
  heading: ["Preview the room before class."],
  moments: ["How class opens", "A question to the class", "A student's question", "A worked example", "How class ends"],
  status: "Fictional professors, synthetic voices",
  script: [
    "Some things a profile can't capture, like what it feels like to sit in that room. So we built Try this class: a 3D model of GFS 106 with all 144 seats. You pick a seat, choose a teaching style, jump to moments like a student's question or a worked example, and hear the lesson out loud. The professors are fictional characters, and the hall is live on our site right now.",
  ],
};

export const ai = {
  pipeline: {
    heading: ["Claude reads. Formula ranks."],
    stages: ["Notes", "Profile", "Rank", "Explain"],
    explanation: ["Why it fits", "One honest downside"],
    safeguard: "API key stays on our server",
  },
  model: {
    heading: ["Predictions come with ranges."],
    aucTitle: "Next-answer prediction (AUC)",
    auc: [
      { label: "Our model", value: 0.74 },
      { label: "Skill difficulty only", value: 0.58 },
    ],
    rangeTitle: "Synthetic student's fit range",
    ranges: [
      { label: "Section A", low: 56, high: 79 },
      { label: "Section B", low: 63, high: 82 },
    ],
  },
  script: [
    "Here's how the AI fits together. Claude reads the notes and builds the profile, with evidence for every point. Then a fixed scoring formula ranks the sections, not the AI, so every ranking is repeatable and explainable. Claude comes back at the end to write the explanation and the downside, using structured outputs with a fallback if the model is down. The API key never leaves our server.",
    "We're also prototyping a learning model. Knowledge tracing on the public ASSISTments data, 130,000 answers from 3,239 students, predicts held-out students' next answers with an AUC of 0.74, against 0.58 for a baseline that only knows how hard each skill is. For a section choice it gives a range instead of a promise, because the effect of teaching style is real but modest. These ranges are for a synthetic student.",
  ],
};

export const fairness = {
  heading: ["Trust, built into the rules."],
  rules: ["Typed notes, no recordings", "Names removed", "Describe the class", "No learning-style labels", "Professors can respond"],
  script: [
    "Fairness is built into the rules. We only take typed notes and syllabi, never recordings. Names come out before anything is saved. Comments about a professor's personality, looks or accent get dropped, so a profile can only describe how the class runs. We don't sort students into learning styles, and professors can see how students describe their class and respond. It's a mirror of the teaching, not a ranking of the teacher.",
  ],
};

export const rollout = {
  heading: ["Start with a spring pilot."],
  phases: [
    { when: "Today", name: "Live" },
    { when: "Spring 2027", name: "Student Government pilot" },
    { when: "After review", name: "Professor opt-in" },
  ],
  needsNothing: "No USC login. No IT integration.",
  script: [
    "Student Government can run this next semester. It's live today, and a pilot needs nothing from USC IT: no USC login and no data feed, because the extension only reads the page a student already has open. In a spring pilot, USG gathers notes for high-enrollment courses, invites those professors to review and respond, and checks whether students who follow the fit score drop or switch less. Later, professors who want richer profiles can choose to share slides, audio processed on their own device, or Zoom transcripts, but only after review by USC's general counsel and the IRB.",
  ],
};

export const closing = {
  heading: ["Try Same Page."],
  cta: "Scan to try it",
  script: [
    "Our goals are fewer drops and switches, fairer treatment of professors, credits well spent and better learning. Scan the code to try Same Page yourself. Your next chapter begins with the right class. Thank you.",
  ],
};

export const appendix = {
  heading: "Sources",
  script: ["Every figure in the deck and where it comes from. Survey results are ours. Profiles and fit scores are fictional samples."],
};
