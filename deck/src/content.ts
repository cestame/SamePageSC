/**
 * Every line of copy, figure and source in the Same Page SC deck. Edit here, not in the slide components.
 * Profiles and fit scores are the fictional samples the live Same Page SC app ships with, read from its public API.
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
    cite: "Same Page SC survey of 29 USC students, Nov 14 and 15, 2026",
    title: "Same Page SC team survey of 29 USC students, freshmen through grad students in more than 20 majors, November 14 and 15, 2026",
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
    cite: "Same Page SC prototype notebook on ASSISTments data",
    title: "Same Page SC prototype notebook: knowledge tracing on the public ASSISTments data set (130,000 answers from 3,239 students). The section ranges are for one synthetic student",
    status: "prototype",
  },
  samples: {
    cite: "Same Page SC sample profiles (fictional professors)",
    title: "Sample teaching profiles shipped with the Same Page SC app. Every professor named in them is fictional",
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

/**
 * Who presents each part of the 3-minute pitch. Each person covers one judging area, about 45 seconds each.
 * To swap speakers, change the names here; slides.ts assigns the parts.
 */
export const speakers = {
  problem: "Lia Choi",
  solution: "Alexis Limary",
  experience: "Ame Wang",
  build: "Srinija Chukkapalli",
};

export const title = {
  wordmarkAlt: "Same Page SC",
  pitch: ["Before day one,", "your professor is a number."],
  byline: "Lia Choi, Alexis Limary, Ame Wang, and Srinija Chukkapalli",
  script: [
    "[Hold up a sheet of paper.] Yesterday, Dean Garrett held a sheet of paper like this and called himself the least hip person in the room. He was joking, but the distance between students and professors is real, and it starts before day one. The first time you meet your professor, they're a number.",
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
    "We surveyed 29 USC students across more than 20 majors. 19 use Rate My Professors to choose classes, and 22 say the rating matters. Yet 13 said their class matched the rating only somewhat, or worse.",
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
    "That number comes from anonymous reviews, and it mostly measures ease. Studies find no significant link between ratings and learning.",
    "It also measures things that aren't teaching. Asian-named instructors scored 0.6 to 0.8 points lower on clarity, often with comments about accents, and ratings run lower for women and for Black faculty. All of it collapses into one number.",
  ],
};

export const shapes = {
  heading: ["One profile. Seven teaching traits."],
  script: [
    "Behind every badge is a profile instead of a star: seven teaching traits, from pace to workload, built from notes, syllabi and consented recordings. Every trait shows its evidence, and comments about personality or accent are dropped.",
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
    "You answer a few quick questions, and a fixed formula compares you with each section. For this new coder, Dr. Reyes is a 93 percent fit, and Same Page SC always names one honest trade-off: fewer discussions and tighter deadlines.",
  ],
};

export const webreg = {
  heading: ["All inside WebReg."],
  page: "Web Registration",
  badge: (score: number, name: string) => `${score}% fit with ${name}`,
  panelTitle: "Chrome side panel",
  demoNote: "Try it: samepage.replit.app/demo/webreg",
  script: [
    "And you never leave Web Registration. Our Chrome extension puts a fit badge and a Try this class button under every section, and it never asks for your USC login.",
  ],
};

export const tryClass = {
  heading: ["Feel the room before you register."],
  moments: ["How class opens", "A question to the class", "A student's question", "A worked example", "How class ends"],
  status: "Fictional professors, synthetic voices",
  script: [
    "So students guess at a whole semester from a number and a wall of reviews. But people understand a place by being in it, and what helps most is the feel of the room.",
    "[Live demo.] While Lia spoke, I recorded her, with her consent, and you heard it announced. Same Page SC treated her as the professor and kept your voices as timing only. This is the room you're in, rebuilt in 3D: pick a seat, hear how class opens, and watch how a question gets handled.",
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
    "Under the hood, pyannoteAI's Precision-3 separates the professor from the room, Claude Opus 5.5 builds the profile, and a fixed formula ranks, so the AI never changes the order. Our knowledge-tracing prototype predicts answers with an AUC of 0.74.",
  ],
};

export const fairness = {
  heading: ["Trust, built into the rules."],
  rules: ["Recordings only with consent", "Only the professor is transcribed", "Names removed", "Describe the class", "Professors can respond"],
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
    "It's live today with no USC login, and Student Government can pilot it this spring, with recording only after legal and IRB review.",
  ],
};

export const closing = {
  heading: ["Try Same Page SC."],
  cta: "Scan to try it",
  script: [
    "The first time you meet your professor shouldn't be a number. Scan the code, and let's get on the same page. Thank you.",
  ],
};

export const appendix = {
  heading: "Sources",
  script: ["Every figure in the deck and where it comes from. Survey results are ours. Profiles and fit scores are fictional samples."],
};
