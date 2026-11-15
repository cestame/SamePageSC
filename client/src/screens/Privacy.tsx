import { ChalkboardTeacher, Eraser, Handshake, Plugs, TextAa, Trash, type Icon } from '@phosphor-icons/react';
import { PRIVACY_POINTS } from '../../../shared/content.js';
import { ProfileLine } from '../components/ProfileLine';
import { Card } from '../components/ui';

const ICONS: Record<string, Icon> = { text: TextAa, eraser: Eraser, trash: Trash, person: ChalkboardTeacher, handshake: Handshake, plug: Plugs };

// A worked example: a sample section against a beginner who wants a steady, organized class.
const EXAMPLE_CLASS = { pace: 2, format: 2, structure: 5, assessment: 3, participation: 2, guidance: 1, workload: 3 };
const EXAMPLE_STUDENT = { pace: 1.5, format: 2, structure: 4, assessment: 3, participation: 2, guidance: 1, workload: 3 };

export function Privacy() {
  return (
    <>
      <h1 className="text-display">How your notes and answers are handled</h1>
      <Card>
        <ul className="privacy-list">
          {PRIVACY_POINTS.map((p) => {
            const PointIcon = ICONS[p.icon];
            return (
              <li key={p.icon} className="privacy-list__item">
                <PointIcon className="privacy-list__icon" size={22} aria-hidden />
                <span className="stack-1">
                  <span className="text-heading">{p.title}</span>
                  <span className="text-small text-muted">{p.body}</span>
                </span>
              </li>
            );
          })}
          <li className="privacy-list__item">
            <span />
            <span className="text-small text-muted">With an account, your answers and schedule are saved to it and your password is stored only as a salted hash. Without one, they stay in this browser. We never ask for your USC login.</span>
          </li>
        </ul>
      </Card>

      <section className="stack-3">
        <h2 className="text-title">How a match is scored</h2>
        <Card>
          <ProfileLine values={EXAMPLE_CLASS} target={EXAMPLE_STUDENT} label="Example class compared with a beginner's answers" />
          <p className="text-body">
            The red line is a class and the dashed line is what one student asked for. Each row scores how close the two are, and the fit is the weighted average of the seven rows, so a thin shaded gap means a high score.
          </p>
          <p className="text-body">
            How much you already know moves your guidance and pace targets. A beginner is matched toward step-by-step classes, and someone with experience is matched toward open-ended ones.
            The AI model writes the explanation you read, but it never changes the order.
          </p>
        </Card>
      </section>

      <section className="stack-3">
        <h2 className="text-title">Why we don't ask about learning styles</h2>
        <p className="text-body">
          The idea that people learn better when taught in their visual, auditory or kinesthetic style hasn't held up in controlled studies.
          We ask about things that actually differ between sections and that you can judge for yourself, such as pace, grading and how often you get called on.
        </p>
      </section>
    </>
  );
}
