import { motion } from 'motion/react';
import { api, type Course } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { isComplete, loadAnswers } from '../lib/storage';
import { ProfileLine } from '../components/ProfileLine';
import { Button, EmptyState, ErrorState, LoadingState } from '../components/ui';

export function CoursePicker() {
  const [courses, retry] = useAsync(api.courses, []);
  const answered = isComplete(loadAnswers());

  return (
    <>
      <h1 className="text-display">Which class are you picking a section for?</h1>
      {courses.status === 'loading' && <LoadingState label="Loading courses" lines={4} />}
      {courses.status === 'error' && <ErrorState title="We couldn't load the courses" error={courses.error} onRetry={retry} />}
      {courses.status === 'success' && courses.data.length === 0 && (
        <EmptyState title="No courses yet" body="Once someone adds notes for a class, it will show up here." />
      )}
      {courses.status === 'success' && courses.data.length > 0 && (
        <ul className="stack-3 plain-list">
          {courses.data.map((course, i) => (
            <motion.li key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CourseOption course={course} answered={answered} />
            </motion.li>
          ))}
        </ul>
      )}
      <div className="stack-2">
        {answered && (
          <p className="text-small text-muted">
            Your answers are saved on this device, so picking a class goes straight to your matches.{' '}
            <a href="#/intake">Answer the questions again</a>
          </p>
        )}
        <div><Button variant="quiet" href="#/contribute">Taking a class now? Add your notes</Button></div>
      </div>
    </>
  );
}

function CourseOption({ course, answered }: { course: Course; answered: boolean }) {
  const target = answered ? `#/matches?course=${course.id}` : `#/intake?course=${course.id}`;
  const shapes = course.sections.slice(0, 4);
  return (
    <a className="course-option" href={target} aria-label={`${course.code} ${course.title}, ${course.sections.length} sections`}>
      <span className="stack-1 min-0">
        <span className="text-title">{course.code}</span>
        <span className="text-small text-muted">{course.title}</span>
      </span>
      <span className="course-option__shapes" aria-hidden>
        {shapes.map((s) => {
          const values = Object.fromEntries(Object.entries(s.profile).map(([k, v]) => [k, v.value]));
          return <ProfileLine key={s.id} values={values} size="glyph" label={s.name} />;
        })}
      </span>
    </a>
  );
}
