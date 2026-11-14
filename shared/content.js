// Product copy that appears in more than one place. A rename is a one-line change here.
// Imported by both the Express server and the React client.

export const PRODUCT_NAME = 'Trojan Fit';
export const TAGLINE = 'Made by USC students for USC students.';
export const NOT_OFFICIAL = 'Not an official USC site.';

/**
 * The seven teaching-profile dimensions. Every value is 1 to 5.
 * `low` and `high` say what 1 and 5 mean, so the diagram, the evidence list
 * and the AI prompt all share one definition.
 * @type {ReadonlyArray<{ key: FieldKey, label: string, low: string, high: string }>}
 */
export const FIELDS = [
  { key: 'pace', label: 'Pace', low: 'Slow and thorough', high: 'Fast-moving' },
  { key: 'format', label: 'Format', low: 'Lecture-heavy', high: 'Discussion-heavy' },
  { key: 'structure', label: 'Structure', low: 'Loose and flexible', high: 'Highly organized' },
  { key: 'assessment', label: 'Grading', low: 'Exam-based', high: 'Project-based' },
  { key: 'participation', label: 'Participation', low: 'Optional', high: 'Cold-calling or graded' },
  { key: 'guidance', label: 'Guidance', low: 'Step-by-step worked examples', high: 'Open-ended' },
  { key: 'workload', label: 'Workload', low: 'Light', high: 'Heavy' },
];

/** @typedef {'pace' | 'format' | 'structure' | 'assessment' | 'participation' | 'guidance' | 'workload'} FieldKey */

export const FIELD_KEYS = FIELDS.map((f) => f.key);

/** @typedef {'requirement' | 'foundation' | 'mastery'} Goal */
export const GOALS = /** @type {const} */ (['requirement', 'foundation', 'mastery']);

/** @typedef {{ key: string, question: string, options: ReadonlyArray<{ value: number | string, label: string, detail?: string }> }} Question */

/**
 * Every matching question. No "visual, auditory or kinesthetic learner" question:
 * learning styles are not supported by research.
 * @type {ReadonlyArray<Question>}
 */
const ALL_QUESTIONS = [
  {
    key: 'prior',
    question: 'How much do you already know about {course}?',
    options: [
      { value: 1, label: 'Nothing yet', detail: 'It will all be new to me' },
      { value: 2, label: 'A little', detail: 'Some exposure, nothing formal' },
      { value: 3, label: 'Some', detail: 'I took a related class or learned some on my own' },
      { value: 4, label: 'A fair amount', detail: 'I could explain the basics to a friend' },
      { value: 5, label: 'A lot', detail: 'I could teach parts of it' },
    ],
  },
  {
    key: 'format',
    question: 'What kind of class time helps you learn?',
    options: [
      { value: 1, label: 'Mostly lecture', detail: 'The professor explains and I take notes' },
      { value: 2, label: 'Lecture with some questions' },
      { value: 3, label: 'An even mix of lecture and activities' },
      { value: 4, label: 'Mostly discussion or group work' },
      { value: 5, label: 'All discussion', detail: 'I learn by talking it through' },
    ],
  },
  {
    key: 'structure',
    question: 'How much structure do you want?',
    options: [
      { value: 1, label: 'Loose is fine', detail: 'I like flexibility' },
      { value: 2, label: 'A little structure' },
      { value: 3, label: 'Somewhere in the middle' },
      { value: 4, label: 'A clear plan', detail: 'I like knowing what is coming next week' },
      { value: 5, label: 'Highly organized', detail: 'Every date and rubric posted on day one' },
    ],
  },
  {
    key: 'assessment',
    question: 'How would you rather be graded?',
    options: [
      { value: 1, label: 'Exams', detail: 'I do my best work on tests' },
      { value: 2, label: 'Mostly exams' },
      { value: 3, label: 'A mix of exams and projects' },
      { value: 4, label: 'Mostly projects' },
      { value: 5, label: 'Projects', detail: 'I show what I know by making things' },
    ],
  },
  {
    key: 'participation',
    question: 'How do you feel about being called on in class?',
    options: [
      { value: 1, label: 'I would rather not be', detail: 'I learn best by listening' },
      { value: 2, label: 'Only when I volunteer' },
      { value: 3, label: 'Now and then is okay' },
      { value: 4, label: 'I am comfortable with it', detail: 'Graded participation is fine' },
      { value: 5, label: 'I like it', detail: 'Cold-calling keeps me on my toes' },
    ],
  },
  {
    key: 'pace',
    question: 'What pace works for you?',
    options: [
      { value: 1, label: 'Slow and thorough', detail: 'Fewer topics, more depth' },
      { value: 2, label: 'Steady' },
      { value: 3, label: 'Moderate' },
      { value: 4, label: 'Brisk' },
      { value: 5, label: 'Fast', detail: 'Cover as much as possible' },
    ],
  },
  {
    key: 'workload',
    question: 'How many hours a week can you give {course} outside of class?',
    options: [
      { value: 1, label: 'About 2 hours', detail: 'My semester is packed' },
      { value: 2, label: '3 to 4 hours' },
      { value: 3, label: '5 to 6 hours' },
      { value: 4, label: '7 to 8 hours' },
      { value: 5, label: 'As much as it takes' },
    ],
  },
  {
    key: 'goal',
    question: 'What do you want out of this class?',
    options: [
      { value: 'requirement', label: 'Meet the requirement', detail: 'I want to do well and move on' },
      { value: 'foundation', label: 'A solid foundation', detail: 'I will build on this later' },
      { value: 'mastery', label: 'Real mastery', detail: 'This is my area and I want to go further' },
    ],
  },
];

/** @type {(keys: string[]) => Question[]} */
const pick = (keys) => keys.map((k) => /** @type {Question} */ (ALL_QUESTIONS.find((q) => q.key === k)));

/** Asked once, during setup. They describe how you like to learn, so they apply to every class. */
export const GENERAL_QUESTIONS = pick(['format', 'structure', 'assessment', 'participation', 'pace', 'goal']);

/** Asked for each class on the home page, because they depend on the subject. */
export const COURSE_QUESTIONS = pick(['prior', 'workload']);

const hour = (h) => h * 60;

/** Time window for the schedule planner. Values are minutes after midnight. */
export const TIME_QUESTIONS = [
  {
    key: 'earliest',
    question: 'What is the earliest a class can start?',
    options: [
      { value: hour(8), label: '8:00 am' },
      { value: hour(9), label: '9:00 am' },
      { value: hour(10), label: '10:00 am' },
      { value: hour(11), label: '11:00 am' },
      { value: hour(12), label: 'Noon' },
    ],
  },
  {
    key: 'latest',
    question: 'What is the latest a class can end?',
    options: [
      { value: hour(14), label: '2:00 pm' },
      { value: hour(16), label: '4:00 pm' },
      { value: hour(18), label: '6:00 pm' },
      { value: hour(22), label: 'Evening classes are fine' },
    ],
  },
];

export const MAJOR_SUGGESTIONS = [
  'Business Administration', 'Computer Science', 'Economics', 'Communication', 'Biological Sciences',
  'Psychology', 'Political Science', 'Cinematic Arts', 'Mechanical Engineering', 'Undeclared',
];

export const LEARNING_STYLES_NOTE =
  'We don\'t ask whether you are a visual or auditory learner, because research doesn\'t support learning styles.';

export const FEEDBACK_PROMPTS = [
  { key: 'pace', question: 'Was the pace what the profile describes?' },
  { key: 'format', question: 'Was the mix of lecture and discussion as described?' },
  { key: 'workload', question: 'Was the workload as described?' },
];

export const PRIVACY_POINTS = [
  { icon: 'text', title: 'Text only', body: 'You paste notes or a syllabus. There is no audio or video recording anywhere in the app.' },
  { icon: 'eraser', title: 'Names come out first', body: 'Names, emails, phone numbers and student IDs are removed before your text is sent to the AI model.' },
  { icon: 'trash', title: 'Your notes are not kept', body: 'Only the finished profile and short evidence lines are saved. The text you pasted is thrown away.' },
  { icon: 'person', title: 'The class, not the person', body: 'Profiles describe how a class runs. Anything about a professor\'s personality, appearance, accent or identity is dropped.' },
  { icon: 'handshake', title: 'With consent', body: 'Share only your own notes, or materials from a class whose professor agreed. Professors can read and respond to their profile.' },
  { icon: 'plug', title: 'No USC systems', body: 'There is no Brightspace crawling and no USC login, so a department could pilot this on its own.' },
];
