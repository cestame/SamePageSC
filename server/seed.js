// Sample data so the demo works on first load. All professors here are FICTIONAL
// and are flagged is_sample = true, which the UI labels as "Sample data".
import { query } from './db.js';

const COURSES = [
  { id: 'csci-103', code: 'CSCI 103', title: 'Object Oriented Programming' },
  { id: 'econ-203', code: 'ECON 203', title: 'Principles of Microeconomics' },
  { id: 'writ-150', code: 'WRIT 150', title: 'Writing and Critical Reasoning–Thematic Approaches' },
  { id: 'math-125', code: 'MATH 125', title: 'Calculus I' },
  { id: 'csci-102', code: 'CSCI 102', title: 'Introduction to Programming' },
  { id: 'csci-104', code: 'CSCI 104', title: 'Data Structures' },
  { id: 'acad-176', code: 'ACAD 176', title: 'Rapid Visualization' },
];

const p = (value, evidence) => ({ value, evidence });

const PROFESSORS = [
  {
    course: 'csci-103', name: 'Dr. Maya Reyes', voice: 'f', section: '29901', schedule: 'MW 10:00-11:50',
    summary: 'Class opens with a short recap quiz, then live-coding where every step is narrated and students type along. The last 15 minutes are a guided practice problem with TAs walking the room.',
    profile: {
      pace: p(2, '"She re-did the recursion example three times until people got it."'),
      format: p(2, 'Mostly live-coding lecture with short pair-programming breaks.'),
      structure: p(5, 'Syllabus lists every lecture topic and due date for the whole semester.'),
      assessment: p(3, '50% weekly labs and projects, 50% two exams.'),
      participation: p(2, 'Participation is optional; questions taken through anonymous chat.'),
      guidance: p(1, 'Every new concept comes with a fully worked example before any exercise.'),
      workload: p(3, 'One lab per week, usually 3-5 hours.'),
    },
  },
  {
    course: 'csci-103', name: 'Prof. Daniel Okafor', voice: 'm', section: '29903', schedule: 'TTh 14:00-15:50',
    summary: 'Short lecture on a concept, then students are dropped into an open-ended problem and asked to design a solution in groups. Ends with groups presenting their approach and the professor critiquing it.',
    profile: {
      pace: p(4, '"We covered pointers and dynamic memory in the same week."'),
      format: p(4, 'About half of each class is group problem-solving and presentations.'),
      structure: p(3, 'Weekly topics are set but the schedule shifts based on how groups are doing.'),
      assessment: p(5, '70% projects, including a 4-week final project you design yourself.'),
      participation: p(4, 'Groups are called on at random to present; presentations are graded.'),
      guidance: p(4, 'Project specs describe the goal, not the steps.'),
      workload: p(4, 'Projects regularly take 8+ hours per week.'),
    },
  },
  {
    course: 'csci-103', name: 'Dr. Priya Natarajan', voice: 'f', section: '29905', schedule: 'MWF 09:00-09:50',
    summary: 'Fast, dense slide lectures that cover a lot of ground with occasional worked examples. Most practice happens outside class in problem sets, and the exams are the main event.',
    profile: {
      pace: p(5, '"Slides move fast; the recordings are essential."'),
      format: p(1, 'Pure lecture, almost no in-class discussion.'),
      structure: p(4, 'Clear weekly schedule and rubric, posted the first day.'),
      assessment: p(1, 'Two midterms and a final make up 75% of the grade.'),
      participation: p(1, 'Attendance is not taken and nobody is called on.'),
      guidance: p(3, 'Some worked examples in lecture, harder variations left for homework.'),
      workload: p(3, 'Weekly problem sets, around 4 hours.'),
    },
  },
  {
    course: 'econ-203', name: 'Prof. James Whitfield', voice: 'm', section: '26301', schedule: 'TTh 14:00-15:20',
    summary: 'Classic lecture with graphs built step by step on the board, followed by a few practice multiple-choice questions. Very predictable rhythm from week to week.',
    profile: {
      pace: p(3, 'One chapter per week, matching the textbook.'),
      format: p(1, 'Lecture the whole period; discussion is saved for TA sections.'),
      structure: p(5, '"Every class follows the exact same format, which honestly helps."'),
      assessment: p(1, 'Grade is three exams plus weekly online quizzes.'),
      participation: p(1, 'Participation is not graded.'),
      guidance: p(2, 'Each graph is derived step by step before practice questions.'),
      workload: p(2, 'Weekly quiz plus reading, about 2-3 hours.'),
    },
  },
  {
    course: 'econ-203', name: 'Dr. Sofia Marchetti', voice: 'f', section: '26303', schedule: 'MW 12:00-13:20',
    summary: 'Each class starts from a real-world news story and the class works out the economics together through discussion. Theory is introduced in response to questions students raise.',
    profile: {
      pace: p(3, 'Moderate; slows down when discussion gets going.'),
      format: p(5, 'Most of each class is whole-room discussion around a case.'),
      structure: p(2, '"The schedule on the syllabus was more of a suggestion."'),
      assessment: p(4, 'Two policy memos and a group project make up 60% of the grade.'),
      participation: p(5, 'Cold-calls every class; participation is 15% of the grade.'),
      guidance: p(4, 'Expects students to apply models to new cases on their own.'),
      workload: p(3, 'Readings plus a memo every few weeks.'),
    },
  },
  {
    course: 'econ-203', name: 'Prof. Kevin Tran', voice: 'm', section: '26305', schedule: 'MWF 10:00-10:50',
    summary: 'A mix of lecture and in-class worksheets done in pairs, with the professor solving each worksheet on the board afterwards. Lots of practice, tightly organized.',
    profile: {
      pace: p(4, 'Covers more chapters than other sections; extra topics on game theory.'),
      format: p(3, 'Roughly half lecture, half paired worksheets.'),
      structure: p(4, 'Detailed weekly plan posted on Brightspace.'),
      assessment: p(2, 'Exams are 60%, worksheets and a short project the rest.'),
      participation: p(3, 'Worksheets are collected and graded for completion.'),
      guidance: p(2, 'Worksheets come with a solved example at the top.'),
      workload: p(4, 'Problem sets every week plus worksheets; 5-6 hours.'),
    },
  },

  // WRIT 150
  {
    course: 'writ-150', name: 'Dr. Hannah Brooks', voice: 'f', section: '64101', schedule: 'TTh 09:30-10:50',
    summary: 'Each class is a writing workshop: a short model paragraph on the screen, then students draft and trade pages with a partner. The professor ends by walking through one anonymous draft line by line.',
    profile: {
      pace: p(2, 'One essay per five weeks, with every draft stage scheduled.'),
      format: p(4, '"Most of class is drafting and peer review, not lecture."'),
      structure: p(5, 'Every draft deadline and rubric is in the syllabus on day one.'),
      assessment: p(5, 'Grade is three portfolio essays and revisions; no exams.'),
      participation: p(4, 'Peer review is graded, and everyone shares a draft at least once.'),
      guidance: p(2, 'Model paragraphs show exactly what a strong thesis looks like.'),
      workload: p(3, 'About 4 hours a week of reading and drafting.'),
    },
  },
  {
    course: 'writ-150', name: 'Prof. Marcus Bell', voice: 'm', section: '64103', schedule: 'MW 14:00-15:20',
    summary: "Class is a seminar around the week's reading, with the professor asking open questions and letting the room argue it out. Essay topics are chosen by students, so drafts look very different from each other.",
    profile: {
      pace: p(3, 'A new reading most weeks, discussed in depth.'),
      format: p(5, `"It's basically a 20-person conversation every class."`),
      structure: p(2, 'The reading list changed twice during the semester.'),
      assessment: p(5, 'Two essays and a final portfolio, no exams.'),
      participation: p(5, 'Cold-calls on the reading; participation is 20% of the grade.'),
      guidance: p(5, 'Essay prompts are one line and you design your own argument.'),
      workload: p(3, 'Reading plus drafting, around 4 to 5 hours.'),
    },
  },
  {
    course: 'writ-150', name: 'Dr. Lena Okoye', voice: 'f', section: '64105', schedule: 'TTh 12:30-13:50',
    summary: 'The first half is a mini-lesson on one writing skill with examples, and the second half is quiet writing time with one-on-one check-ins. Rubrics are shared before every assignment.',
    profile: {
      pace: p(3, 'One skill per class, building toward each essay.'),
      format: p(3, 'Half mini-lecture, half in-class writing.'),
      structure: p(4, 'Weekly plan posted every Sunday.'),
      assessment: p(4, 'Essays make up 80%, plus short reading quizzes.'),
      participation: p(2, 'Participation is a small share; no cold-calling.'),
      guidance: p(2, 'Each skill comes with an annotated example essay.'),
      workload: p(2, 'About 3 hours a week outside class.'),
    },
  },

  // MATH 125
  {
    course: 'math-125', name: 'Dr. Ethan Park', voice: 'm', section: '39401', schedule: 'MWF 08:00-08:50',
    summary: 'A fast chalkboard lecture that covers a full textbook section each class, with a couple of examples at the end. Practice happens in online homework and the discussion section.',
    profile: {
      pace: p(5, '"We finished derivatives a week earlier than the other sections."'),
      format: p(1, 'Lecture the whole hour.'),
      structure: p(4, 'Section-by-section schedule posted for the semester.'),
      assessment: p(1, 'Two midterms and a final are 85% of the grade.'),
      participation: p(1, "Attendance isn't taken."),
      guidance: p(3, 'A few examples per topic; harder problems left for homework.'),
      workload: p(4, 'Online homework twice a week, 5 to 6 hours.'),
    },
  },
  {
    course: 'math-125', name: 'Prof. Rosa Delgado', voice: 'f', section: '39403', schedule: 'MWF 11:00-11:50',
    summary: "Every new rule comes with two or three fully worked examples before students try one on their own. Fridays start with a short quiz on the week's material.",
    profile: {
      pace: p(2, '"She slows down whenever the room looks lost."'),
      format: p(2, 'Mostly lecture with short try-it-yourself problems.'),
      structure: p(5, 'Weekly quiz every Friday, same format all semester.'),
      assessment: p(2, 'Weekly quizzes 30%, exams 70%.'),
      participation: p(2, 'Volunteers answer; nobody is called on.'),
      guidance: p(1, 'Fully worked examples before every practice problem.'),
      workload: p(3, 'Homework and quiz prep, about 4 hours.'),
    },
  },
  {
    course: 'math-125', name: 'Dr. Samuel Kim', voice: 'm', section: '39405', schedule: 'TTh 11:00-12:20',
    summary: 'Students watch a short video before class, then spend class solving problems in groups at the whiteboards while the professor moves between tables. Groups present one solution at the end.',
    profile: {
      pace: p(3, 'One topic per class, with the video beforehand.'),
      format: p(5, 'Group whiteboard work for most of class.'),
      structure: p(3, 'Topics are set, but groups move at their own speed.'),
      assessment: p(3, 'Exams 60%, group problem sets 40%.'),
      participation: p(4, 'Groups are picked at random to present.'),
      guidance: p(4, 'Problems are open-ended and you work out the method together.'),
      workload: p(3, 'Pre-class videos plus problem sets, around 4 hours.'),
    },
  },

  // CSCI 102
  {
    course: 'csci-102', name: 'Prof. Nora Fitzgerald', voice: 'f', section: '29911', schedule: 'MW 13:00-13:50',
    summary: 'A short lecture introduces one programming idea, then everyone writes a tiny program together with the professor typing along. Weekly labs repeat the same idea with a twist.',
    profile: {
      pace: p(2, `"Perfect if you've never coded before."`),
      format: p(2, 'Live coding the whole time, typed along by students.'),
      structure: p(5, 'Lab every week, same rhythm all semester.'),
      assessment: p(4, 'Labs and two small projects are 70% of the grade.'),
      participation: p(1, 'Questions go in an anonymous chat.'),
      guidance: p(1, 'Every lab starts from a worked example.'),
      workload: p(2, 'Labs take about 2 to 3 hours.'),
    },
  },
  {
    course: 'csci-102', name: 'Dr. Omar Haddad', voice: 'm', section: '29913', schedule: 'TTh 16:00-16:50',
    summary: 'Class opens with a puzzle that students try to solve in pairs before the professor shows the idea behind it. Assignments are small open-ended programs with a creative twist.',
    profile: {
      pace: p(3, 'One concept per class.'),
      format: p(4, 'Pair puzzles take up half of each class.'),
      structure: p(3, 'Assignments are posted a week at a time.'),
      assessment: p(4, 'Creative programming assignments are 60%.'),
      participation: p(3, 'Pairs share their approach most classes.'),
      guidance: p(4, 'Assignments describe a goal, not the steps.'),
      workload: p(3, 'About 4 hours a week.'),
    },
  },
  {
    course: 'csci-102', name: 'Dr. Julia Weiss', voice: 'f', section: '29915', schedule: 'F 10:00-11:50',
    summary: 'One long Friday session with a lecture block, a break, and a hands-on lab. Two exams make up most of the grade.',
    profile: {
      pace: p(4, 'Covers two topics in each Friday session.'),
      format: p(2, 'An hour of lecture, then lab.'),
      structure: p(4, 'Everything is posted on Brightspace by Monday.'),
      assessment: p(2, 'Two exams are 60% of the grade.'),
      participation: p(1, 'No participation grade.'),
      guidance: p(3, 'Lab handouts walk through the first half of each problem.'),
      workload: p(2, 'Light outside class, around 2 hours.'),
    },
  },

  // CSCI 104
  {
    course: 'csci-104', name: 'Dr. Aisha Rahman', voice: 'f', section: '29921', schedule: 'TTh 12:30-13:50',
    summary: 'Lectures build each data structure from scratch on the screen, then point straight to the matching homework. The programming assignments are long and are most of the grade.',
    profile: {
      pace: p(4, '"Heaps, hash tables and trees all in about four weeks."'),
      format: p(1, 'Lecture with slides and live code.'),
      structure: p(4, 'Homework due dates set for the whole semester.'),
      assessment: p(4, 'Programming assignments are 55%, exams 45%.'),
      participation: p(1, 'No participation grade.'),
      guidance: p(3, 'Starter code is given, but the design is up to you.'),
      workload: p(5, '"Assignments regularly took me 12+ hours."'),
    },
  },
  {
    course: 'csci-104', name: 'Prof. Leo Martins', voice: 'm', section: '29923', schedule: 'MW 16:00-17:20',
    summary: 'A whiteboard lecture that traces each algorithm step by step on small examples. Exams ask you to trace and analyze code by hand.',
    profile: {
      pace: p(3, 'One structure per week.'),
      format: p(1, 'Whiteboard lecture all class.'),
      structure: p(4, 'Clear weekly topics and practice exams posted.'),
      assessment: p(2, 'Exams are 60% of the grade.'),
      participation: p(2, 'He asks the room questions but nobody is graded on it.'),
      guidance: p(2, 'Every algorithm is traced on a worked example.'),
      workload: p(4, 'Weekly homework, about 7 hours.'),
    },
  },
  {
    course: 'csci-104', name: 'Dr. Grace Liu', voice: 'f', section: '29925', schedule: 'MWF 12:00-12:50',
    summary: "Short lectures alternate with in-class exercises where you complete a half-written function. Office hours are tied to each assignment's checkpoints.",
    profile: {
      pace: p(3, 'Steady, with checkpoints inside each assignment.'),
      format: p(3, 'Half lecture, half in-class exercises.'),
      structure: p(5, 'Every assignment has two graded checkpoints.'),
      assessment: p(3, 'Assignments and exams split evenly.'),
      participation: p(3, 'In-class exercises are collected for credit.'),
      guidance: p(2, 'Exercises give half the code and ask you to finish it.'),
      workload: p(4, 'About 7 to 8 hours a week.'),
    },
  },

  // ACAD 176
  {
    course: 'acad-176', name: 'Prof. Theo Grant', voice: 'm', section: '21001', schedule: 'MW 09:00-10:50',
    summary: 'A hands-on studio: a quick demo of a sketching technique, then most of the session drawing while the professor gives feedback at each desk. Every week ends with a pin-up critique.',
    profile: {
      pace: p(4, 'A new technique every class.'),
      format: p(4, 'Mostly studio time with feedback at your desk.'),
      structure: p(3, 'Weekly prompts, but the final project is self-directed.'),
      assessment: p(5, 'Grade is a sketchbook and final project.'),
      participation: p(5, 'Everyone presents work at the weekly critique.'),
      guidance: p(3, 'Each technique is demonstrated, then you apply it your way.'),
      workload: p(4, 'Sketchbook pages take 5 to 6 hours a week.'),
    },
  },
  {
    course: 'acad-176', name: 'Dr. Mia Castellanos', voice: 'f', section: '21003', schedule: 'TTh 15:30-17:20',
    summary: 'Each session opens with a slideshow of product sketches from industry, then students redraw them step by step. Critiques are in small groups rather than in front of the whole class.',
    profile: {
      pace: p(2, '"She lets you redo a sketch until it clicks."'),
      format: p(3, 'Demo and slideshow, then guided drawing.'),
      structure: p(5, 'Week-by-week plan with example sketches for each.'),
      assessment: p(4, 'Weekly sketch assignments and a final portfolio.'),
      participation: p(3, 'Small-group critiques every other week.'),
      guidance: p(1, 'Step-by-step redrawing of example sketches.'),
      workload: p(3, 'About 4 hours a week.'),
    },
  },
  {
    course: 'acad-176', name: 'Prof. Ben Avery', voice: 'm', section: '21005', schedule: 'F 13:00-15:50',
    summary: 'One long Friday studio built around a client-style brief that changes each week. Students pitch their sketches to the class at the end of the session.',
    profile: {
      pace: p(4, 'A new brief every week.'),
      format: p(5, 'Studio and pitching for the whole session.'),
      structure: p(2, '"Briefs were announced the day of class."'),
      assessment: p(5, 'Project-based, graded on weekly pitches and a final.'),
      participation: p(5, 'Everyone pitches every week.'),
      guidance: p(5, 'Briefs are open-ended with no example to follow.'),
      workload: p(3, 'Prep for pitches, about 4 hours.'),
    },
  },
];

const SAMPLE_RESPONSES = {
  'Prof. Daniel Okafor': 'Thanks for the honest profile. I do move quickly early on; office hours on Thursday are specifically for anyone who wants worked examples before the projects start. (Sample response)',
};

/** Adds any sample courses and sections that aren't in the database yet. Safe to run on every start. */
/** Voice for each fictional sample professor in the Try this class simulation: 'f' (feminine) or 'm' (masculine). */
export const SAMPLE_VOICES = Object.fromEntries(PROFESSORS.map((p) => [p.name, p.voice]));

export async function seedSamples() {
  let added = 0;
  for (const c of COURSES) {
    await query(
      'INSERT INTO courses (id, code, title) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, title = EXCLUDED.title',
      [c.id, c.code, c.title],
    );
  }
  for (const prof of PROFESSORS) {
    const [existing] = await query('SELECT id FROM professors WHERE course_id = $1 AND name = $2', [prof.course, prof.name]);
    if (existing) continue;
    added++;
    const [row] = await query(
      `INSERT INTO professors (course_id, name, section, schedule, is_sample)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
      [prof.course, prof.name, prof.section, prof.schedule],
    );
    await query(
      `INSERT INTO contributions (professor_id, profile, summary, source_type, is_sample)
       VALUES ($1, $2, $3, 'sample', TRUE)`,
      [row.id, JSON.stringify(prof.profile), prof.summary],
    );
    if (SAMPLE_RESPONSES[prof.name]) {
      await query('INSERT INTO professor_responses (professor_id, body, verified) VALUES ($1, $2, FALSE)', [
        row.id, SAMPLE_RESPONSES[prof.name],
      ]);
    }
  }
  return added;
}
