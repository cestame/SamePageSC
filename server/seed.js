// Sample data so the demo works on first load. All professors here are FICTIONAL
// and are flagged is_sample = true, which the UI labels as "Sample data".
import { query } from './db.js';

const COURSES = [
  { id: 'csci-103', code: 'CSCI 103', title: 'Introduction to Programming' },
  { id: 'econ-203', code: 'ECON 203', title: 'Principles of Microeconomics' },
];

const p = (value, evidence) => ({ value, evidence });

const PROFESSORS = [
  {
    course: 'csci-103', name: 'Dr. Maya Reyes', section: '29901', schedule: 'MW 10:00-11:50',
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
    course: 'csci-103', name: 'Prof. Daniel Okafor', section: '29903', schedule: 'TTh 14:00-15:50',
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
    course: 'csci-103', name: 'Dr. Priya Natarajan', section: '29905', schedule: 'MWF 09:00-09:50',
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
    course: 'econ-203', name: 'Prof. James Whitfield', section: '26301', schedule: 'TTh 10:00-11:20',
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
    course: 'econ-203', name: 'Dr. Sofia Marchetti', section: '26303', schedule: 'MW 12:00-13:20',
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
    course: 'econ-203', name: 'Prof. Kevin Tran', section: '26305', schedule: 'MWF 13:00-13:50',
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
];

const SAMPLE_RESPONSES = {
  'Prof. Daniel Okafor': 'Thanks for the honest profile. I do move quickly early on; office hours on Thursday are specifically for anyone who wants worked examples before the projects start. (Sample response)',
};

export async function seedIfEmpty() {
  const [{ count }] = await query('SELECT COUNT(*)::int AS count FROM courses');
  if (count > 0) return false;

  for (const c of COURSES) {
    await query('INSERT INTO courses (id, code, title) VALUES ($1, $2, $3)', [c.id, c.code, c.title]);
  }
  for (const prof of PROFESSORS) {
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
    // A few sample confirmations so the feedback counter is not empty on first load.
    const confirmations = 2 + (row.id % 3);
    for (let i = 0; i < confirmations; i++) {
      await query(
        `INSERT INTO feedback (professor_id, pace_as_expected, format_as_expected, workload_as_expected)
         VALUES ($1, TRUE, TRUE, $2)`,
        [row.id, i !== 0],
      );
    }
    if (SAMPLE_RESPONSES[prof.name]) {
      await query('INSERT INTO professor_responses (professor_id, body, verified) VALUES ($1, $2, FALSE)', [
        row.id, SAMPLE_RESPONSES[prof.name],
      ]);
    }
  }
  return true;
}
