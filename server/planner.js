// Schedule planning. Picks one section per course so the total fit is as high as possible,
// with no two sections overlapping and every section inside the student's time window.
// Deterministic, like the scoring: the AI is not involved.

const DAY_PATTERN = /Th|M|T|W|F/g;

/** Parses "MWF 09:00-09:50" into { days: ['M','W','F'], start: 540, end: 590 } (minutes after midnight). */
export function parseSchedule(schedule) {
  const match = /^([A-Za-z]+)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(String(schedule || '').trim());
  if (!match) return null;
  const [, dayText, sh, sm, eh, em] = match;
  return {
    days: dayText.match(DAY_PATTERN) ?? [],
    start: Number(sh) * 60 + Number(sm),
    end: Number(eh) * 60 + Number(em),
  };
}

export function overlaps(a, b) {
  if (!a || !b) return false;
  const sharesDay = a.days.some((d) => b.days.includes(d));
  return sharesDay && a.start < b.end && b.start < a.end;
}

function outsideWindow(time, { earliest, latest }) {
  if (!time) return null;
  if (earliest != null && time.start < earliest) return 'starts-too-early';
  if (latest != null && time.end > latest) return 'ends-too-late';
  return null;
}

/**
 * @param courses [{ courseId, sections: [{ id, score, schedule }] }]
 * @param window { earliest?: minutes, latest?: minutes }
 * @param locked { [courseId]: sectionId } sections the student chose by hand
 * @returns { [courseId]: { chosenId, sections: [{ id, status, reason, conflictWith }] } }
 */
export function planSchedule(courses, window = {}, locked = {}) {
  const prepared = courses.map((c) => ({
    courseId: c.courseId,
    sections: c.sections.map((s) => {
      const time = parseSchedule(s.schedule);
      return { ...s, time, windowProblem: outsideWindow(time, window) };
    }),
  }));

  const best = searchBest(prepared, locked);
  const chosen = Object.fromEntries(prepared.map((c, i) => [c.courseId, best.picks[i]]));
  return Object.fromEntries(prepared.map((c) => [c.courseId, describeCourse(c, chosen)]));
}

// Each course contributes its candidate sections: the locked one if set, otherwise every section
// inside the time window. A course with nothing in the window falls back to all its sections so
// the student still sees a plan (those picks are flagged).
function candidatesFor(course, locked) {
  const lockedId = locked[course.courseId];
  if (lockedId != null) {
    const pick = course.sections.find((s) => s.id === lockedId);
    if (pick) return [pick];
  }
  const inWindow = course.sections.filter((s) => !s.windowProblem);
  return inWindow.length ? inWindow : course.sections;
}

function searchBest(prepared, locked) {
  const candidates = prepared.map((c) => [...candidatesFor(c, locked)].sort((a, b) => b.score - a.score));
  let best = { total: -1, conflicts: Infinity, picks: candidates.map((list) => list[0] ?? null) };

  function visit(index, picks, total, conflicts) {
    if (index === candidates.length) {
      const better = conflicts < best.conflicts || (conflicts === best.conflicts && total > best.total);
      if (better) best = { total, conflicts, picks: [...picks] };
      return;
    }
    const list = candidates[index];
    if (!list.length) return visit(index + 1, [...picks, null], total, conflicts);
    for (const section of list) {
      const clashes = picks.filter((p) => p && overlaps(p.time, section.time)).length;
      visit(index + 1, [...picks, section], total + section.score, conflicts + clashes);
    }
  }

  visit(0, [], 0, 0);
  return best;
}

function describeCourse(course, chosen) {
  const pick = chosen[course.courseId];
  const others = Object.entries(chosen).filter(([id, s]) => id !== course.courseId && s);
  return {
    chosenId: pick?.id ?? null,
    sections: course.sections.map((s) => {
      const clash = others.find(([, o]) => overlaps(o.time, s.time));
      return {
        id: s.id,
        status: statusOf(s, pick, clash),
        reason: s.windowProblem ?? (clash ? 'conflict' : null),
        conflictWith: clash ? clash[0] : null,
        time: s.time,
      };
    }),
  };
}

function statusOf(section, pick, clash) {
  if (pick && section.id === pick.id) return clash || section.windowProblem ? 'chosen-with-problem' : 'chosen';
  if (section.windowProblem || clash) return 'unavailable';
  return 'available';
}
