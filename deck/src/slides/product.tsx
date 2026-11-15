import { ArrowSquareOut, Armchair, WarningCircle } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { StepView, fadeReveal } from "@/engine/primitives";
import { fit, links, sampleCourse, sampleLabel, shapes, tryClass, webreg } from "../content";
import { ProfileGlyph, ProfileLabels, ProfileLine, profileSizes } from "../ProfileLine";
import { Heading, Note } from "../ui";

const [reyes] = sampleCourse.sections;

export function ShapesSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={shapes.heading} />
      <div className="flex items-end gap-12">
        <motion.div variants={fadeReveal(0.5)}>
          <ProfileLabels size={profileSizes.card} />
        </motion.div>
        {sampleCourse.sections.map((section, index) => (
          <motion.figure key={section.number} variants={fadeReveal(0.5 + index * 0.3, 24)} className="flex flex-col gap-8 rounded-card bg-paper-raised px-10 pt-8 pb-10 shadow-card">
            <figcaption>
              <p className="text-point leading-tight font-bold">{section.instructor}</p>
              <p className="text-caption text-ink-muted">
                {section.days} {section.time}
              </p>
              <p className="text-fineprint text-ink-faint">{sampleLabel}</p>
            </figcaption>
            <ProfileLine profile={section.profile} label={`Teaching profile for ${section.instructor}'s section`} size={profileSizes.card} delay={0.8 + index * 0.3} />
          </motion.figure>
        ))}
      </div>
      <Note delay={1.8}>{shapes.explainer}</Note>
    </StepView>
  );
}

function Legend() {
  return (
    <motion.dl variants={fadeReveal(2)} className="flex gap-10 text-caption text-ink-muted">
      <div className="flex items-center gap-3">
        <dt className="h-1 w-12 border-t-[3px] border-dashed border-ink-muted" />
        <dd>{fit.legend.student}</dd>
      </div>
      <div className="flex items-center gap-3">
        <dt className="h-1.5 w-12 bg-accent" />
        <dd>{fit.legend.section}</dd>
      </div>
      <div className="flex items-center gap-3">
        <dt className="h-6 w-12 bg-accent-wash" />
        <dd>{fit.legend.gap}</dd>
      </div>
    </motion.dl>
  );
}

export function FitSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={fit.heading} />
      <div className="grid grid-cols-[auto_1fr] items-center gap-gap">
        <div className="flex flex-col gap-10">
          <div className="flex items-start gap-10">
            <ProfileLabels size={profileSizes.large} />
            <ProfileLine profile={reyes.profile} student={fit.student} label="Dr. Reyes's profile with the student's answers drawn over it" size={profileSizes.large} delay={0.4} />
          </div>
          <Legend />
        </div>
        <motion.article variants={fadeReveal(1.2, 24)} className="flex flex-col gap-9 rounded-card bg-paper-raised p-12 shadow-offset">
          <div>
            <p className="text-point font-bold">
              {reyes.instructor}, {sampleCourse.code}
            </p>
            <p className="text-fineprint text-ink-faint">{sampleLabel}</p>
          </div>
          <p className="flex items-center gap-6">
            <span aria-hidden className="size-6 shrink-0 rounded-full bg-mark-strong" />
            <span className="font-display text-display leading-none font-extrabold figures-tabular">{fit.score}%</span>
            <span className="max-w-[420px] text-caption text-ink-muted">{fit.scoreCounts}</span>
          </p>
          <motion.div variants={fadeReveal(1.8)}>
            <p className="text-point font-bold">{fit.whyTitle}</p>
            <p className="mt-2 text-body text-ink-soft">{fit.why}</p>
          </motion.div>
          <motion.div variants={fadeReveal(2.3)}>
            <p className="flex items-center gap-3 text-point font-bold">
              <WarningCircle size={36} className="text-warning" aria-hidden />
              {fit.downsideTitle}
            </p>
            <p className="mt-2 text-body text-ink-soft">{fit.downside}</p>
          </motion.div>
        </motion.article>
      </div>
    </StepView>
  );
}

const webregColumns = ["Section", "Type", "Time", "Days", "Instructor"];

function WebRegMock() {
  return (
    <motion.figure variants={fadeReveal(0.5, 24)} className="overflow-hidden rounded-card bg-sheet text-sheet-ink shadow-float">
      <p className="bg-accent-deep px-10 py-6 font-display text-title leading-none font-bold text-sheet">{webreg.page}</p>
      <div className="flex flex-col gap-6 px-10 pt-8 pb-10">
        <p className="text-point font-bold">
          {sampleCourse.code}: {sampleCourse.name}
        </p>
        <table className="w-full text-left text-caption">
          <thead>
            <tr className="border-b-2 border-sheet-rule">
              {webregColumns.map((column) => (
                <th key={column} className="pb-3 font-bold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pt-4">{reyes.number} R</td>
              <td className="pt-4">Lecture</td>
              <td className="pt-4">10:00am-11:50am</td>
              <td className="pt-4">{reyes.days}</td>
              <td className="pt-4">Reyes, Maya</td>
            </tr>
          </tbody>
        </table>
        <motion.p variants={fadeReveal(1.3, 12)} className="flex items-center gap-4 self-start rounded-chip bg-sheet px-5 py-3 text-body shadow-lift ring-2 ring-sheet-rule">
          <ProfileGlyph profile={reyes.profile} ground="light" className="h-12 w-8" />
          <span>
            <span className="font-extrabold">{fit.score}%</span> teaching fit with {reyes.instructor}
          </span>
        </motion.p>
      </div>
    </motion.figure>
  );
}

function SidePanelMock() {
  return (
    <motion.aside variants={fadeReveal(1.8, 24)} className="flex flex-col gap-6 rounded-card bg-paper-raised p-10 shadow-card">
      <p className="text-point font-bold">{webreg.panelTitle}</p>
      <ProfileLine profile={reyes.profile} student={fit.student} label="The side panel shows the profile with your answers" size={profileSizes.card} delay={2.1} />
      <ul className="flex flex-col gap-3 text-caption text-ink-muted">
        {webreg.panelLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </motion.aside>
  );
}

export function WebRegSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={webreg.heading} />
      <div className="grid grid-cols-[1fr_auto] items-center gap-gap">
        <WebRegMock />
        <SidePanelMock />
      </div>
      <motion.a data-interactive variants={fadeReveal(2.4)} href={links.webregDemo} target="_blank" rel="noreferrer" className="pointer-events-auto flex items-center gap-2 self-start text-caption text-ink-muted underline decoration-1 underline-offset-4">
        {webreg.demoNote}
        <ArrowSquareOut size={24} aria-hidden />
      </motion.a>
    </StepView>
  );
}

const HALL = { rows: 12, seatsPerRow: 12, seatGap: 50, rowGap: 40 };
const YOUR_SEAT = { row: 5, seat: 7 };

/** Rows bow toward the stage, the way the hall's fixed seating curves. */
function seatPosition(row: number, seat: number) {
  const fromCenter = (seat - (HALL.seatsPerRow - 1) / 2) / HALL.seatsPerRow;
  return { x: 60 + seat * HALL.seatGap, y: 190 + row * HALL.rowGap - fromCenter ** 2 * 100 };
}

function Seat({ row, seat }: { row: number; seat: number }) {
  const { x, y } = seatPosition(row, seat);
  const isYours = row === YOUR_SEAT.row && seat === YOUR_SEAT.seat;
  return (
    <motion.rect
      x={x - 16}
      y={y - 14}
      width={32}
      height={28}
      rx={7}
      className={isYours ? "fill-accent" : "fill-rule"}
      variants={fadeReveal(0.6 + (row * HALL.seatsPerRow + seat) * 0.004)}
    />
  );
}

function SeatMap() {
  const width = 60 * 2 + (HALL.seatsPerRow - 1) * HALL.seatGap;
  const seats = Array.from({ length: HALL.rows * HALL.seatsPerRow }, (_, index) => ({ row: Math.floor(index / HALL.seatsPerRow), seat: index % HALL.seatsPerRow }));
  return (
    <svg viewBox={`0 0 ${width} 650`} width={width} height={650} role="img" aria-label={`${tryClass.hall}. ${tryClass.seatNote}.`}>
      <motion.rect x={40} y={40} width={width - 80} height={14} rx={4} className="fill-sheet" variants={fadeReveal(0.4)} />
      <motion.rect x={width / 2 - 40} y={80} width={80} height={40} rx={8} className="fill-ink-faint" variants={fadeReveal(0.5)} />
      {seats.map(({ row, seat }) => (
        <Seat key={`${row}-${seat}`} row={row} seat={seat} />
      ))}
    </svg>
  );
}

export function TryClassSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={tryClass.heading} />
      <div className="grid grid-cols-[auto_1fr] items-center gap-gap">
        <figure className="flex flex-col gap-4">
          <SeatMap />
          <motion.figcaption variants={fadeReveal(1.4)} className="flex items-center gap-3 text-caption text-ink-muted">
            <Armchair size={32} weight="fill" className="text-accent" aria-hidden />
            {tryClass.seatNote}. {tryClass.hall}.
          </motion.figcaption>
        </figure>
        <div className="flex flex-col gap-6">
          <motion.p variants={fadeReveal(1)} className="text-point font-bold">
            {tryClass.momentsTitle}
          </motion.p>
          <ol className="flex flex-col gap-3">
            {tryClass.moments.map((moment, index) => (
              <motion.li key={moment} variants={fadeReveal(1.2 + index * 0.12, 12)} className="rounded-card bg-paper-raised px-7 py-4 text-body">
                {moment}
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
      <Note delay={2}>{tryClass.status}</Note>
    </StepView>
  );
}
