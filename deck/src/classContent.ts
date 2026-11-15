/*
 * The class version of the pitch. It is a normal slideshow, except the live walkthrough, which is played as a class:
 * the professor teaches the room the newest feature while the deck laptop records it, and the class grades itself.
 * Lines in [brackets] are stage directions.
 */

/**
 * Who plays which part. Swap names here. Only the class walkthrough is recorded, and the professor talks most of it,
 * so the recording correctly finds them as the professor.
 */
export const roles = {
  presenter: "Srinija Chukkapalli",
  professor: "Lia Choi",
  ta: "Alexis Limary",
  student: "Ame Wang",
};

/** The slides played as a class. Only hands raised on these count toward the report card. */
export const CLASS_SLIDE_IDS = ["welcome", "lesson", "pop-quiz"];

export const opening = {
  script: [
    `${roles.presenter.toUpperCase()}: Good morning. Yesterday we heard that no one here is old enough to remember Foghorn Leghorn, and that paper makes you the least hip person in the room. [Holds up a sheet of paper.] So: do you remember?`,
  ],
};

export const classTitle = {
  heading: "Welcome to class.",
  course: "Same Page SC 101: picking the section that fits you",
  recordingNotice: "This class is being recorded. Only the professor is transcribed.",
  script: [
    `${roles.professor.toUpperCase()}, PROFESSOR: Welcome to class. Today's lesson is our newest feature, and you're in it. This class is being recorded, with my permission, since I'm the professor. Only my voice is transcribed. [${roles.ta}, TA, presses R to start recording.]`,
  ],
};

export const remember = {
  heading: "Do you remember?",
  question: "Picking classes out of a printed course catalog",
  handsLabel: "hands up",
  script: [
    `${roles.presenter.toUpperCase()}: Show of hands: who remembers picking classes out of a printed course catalog? [${roles.ta} presses H for each hand.] Neither do we. But we all remember this.`,
  ],
};

export const stars = {
  heading: "Raise your hand if you've picked a section by its star rating.",
  handsLabel: "hands in this room",
  survey: { count: 19, respondents: 29, mismatch: 13 },
  surveyLine: "of the 29 USC students we surveyed did the same",
  mismatchLine: "of them said the class didn't match the rating",
  script: [
    `${roles.presenter.toUpperCase()}: Raise your hand if you've picked a section by its star rating. [${roles.ta} presses H for each hand.] ${roles.ta.toUpperCase()}: I count [number]. ${roles.presenter.toUpperCase()}: In our survey, 19 of 29 students did too, and 13 said the class didn't match the rating.`,
  ],
};

export const syllabus = {
  heading: "Same Page SC in four lines",
  items: [
    { name: "Every section gets a shape", detail: "Seven teaching traits, built from student notes" },
    { name: "A fit score with one honest downside", detail: "Your answers, scored by a fixed formula" },
    { name: "Right inside Web Registration", detail: "A badge under every section" },
    { name: "Sit in before you register", detail: "A 3D classroom with fictional professors" },
  ],
  script: [
    `${roles.presenter.toUpperCase()}: You know Same Page SC. Every section gets a teaching profile from student notes, your answers turn it into a fit score with one honest downside, and it all shows up inside Web Registration. The best way to learn it is to take the class. Professor?`,
  ],
};

export const lesson = {
  heading: "Today's lesson: the lecture becomes the notes.",
  exampleLabel: "Example timeline of a recorded class",
  professorLine: "Professor: transcribed",
  studentLine: "Students: counted, never transcribed",
  consentLine: "Only with the professor's permission and an announcement to the class.",
  script: [
    `PROFESSOR: You don't have to type notes anymore. With the professor's permission, Same Page SC listens to the lecture and builds the profile from it. ${roles.student.toUpperCase()}, STUDENT [raising a hand in the audience]: Wait, are you recording me right now? PROFESSOR: Great question. Your words are never transcribed. You're just one student turn on a timeline.`,
  ],
};

export const popQuiz = {
  heading: "Pop quiz: has this class been lecture or discussion?",
  prompt: "Hands up for discussion",
  handsLabel: "say discussion",
  script: [
    `PROFESSOR: Pop quiz, judges: has this class been more lecture or more discussion? Hands up for discussion. [${roles.ta} presses H for each hand.] Let's ask the data. [${roles.ta} presses R to stop the recording and grade the class.]`,
  ],
};

export const reportCard = {
  heading: "Your report card",
  waiting: "Grading this class",
  notStopped: "Press R to stop the recording and grade this class.",
  steps: ["Separating the professor's voice", "Reading the lecture", "Building the profile"],
  stillGrading: "Your report card will be ready before Q&A ends.",
  originLabel: {
    live: "Recorded live, just now",
    rehearsal: "From our rehearsal run",
    sample: "Sample lecture, fictional",
  },
  handsCounted: "hands raised in class, counted by our TA",
  script: [
    `PROFESSOR: Here's the report card for the class you just took. [Read the talk time, student turns and hands off the slide. If it's still grading: It'll be ready before Q&A ends. If it failed, ${roles.ta} presses S for the backup.]`,
  ],
};

export const dismissed = {
  heading: "Class dismissed.",
  tagline: "Your next chapter begins with the right class.",
  cta: "Scan to try it",
  script: [
    `PROFESSOR [holding up the paper]: So, do you remember picking classes with paper and a star rating? Your students won't. Your next chapter begins with the right class. Class dismissed.`,
  ],
};

export const howItWorks = {
  script: [
    `${roles.ta.toUpperCase()}, TA [from the laptop]: While it grades: Claude reads only the professor's words and builds the profile, a fixed formula does the ranking, and student voices are only counted.`,
  ],
};

export const pilot = {
  script: [
    `${roles.ta.toUpperCase()}: Student Government can pilot this next semester. It's live today and needs no USC login.`,
  ],
};

export const classScriptIntro = `The pitch is a normal slideshow except the walkthrough (slides 5 to 7), which is played as a class and recorded. ${roles.presenter} opens and presents the slideshow. ${roles.professor} is the professor for the class and the close, and talks most of the recorded part. ${roles.ta} is the TA at the laptop: R starts and stops the recording, H counts each raised hand (Shift+H takes one back), and S shows the backup report card. ${roles.student} sits in the audience as a student with one planted question.`;
