import { ChatCircleText, EyeSlash, Function as FunctionIcon, LockKey, NotePencil, Prohibit, Sparkle, UserCircleMinus, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import qrcode from "qrcode-generator";
import { StepView, fadeReveal } from "@/engine/primitives";
import { easeSamePage } from "@/engine/motion";
import { ai, appendix, closing, fairness, links, rollout, sampleCourse, sources, statusLabel, type Source } from "../content";
import { ProfileLine, profileSizes } from "../ProfileLine";
import { Heading, Note, Wordmark } from "../ui";

type SlideProps = { step: number };

const growFromLeft = { transformBox: "fill-box", transformOrigin: "left center" } as const;

function grow(delay: number, duration = 1): Variants {
  return {
    enter: { scaleX: 0 },
    present: { scaleX: 1, transition: { duration, ease: easeSamePage, delay } },
  };
}

/* ---------- How the AI works: one animated flow from notes to explanation ---------- */

const STAGE_GAP = 1.1;
const stageAt = (index: number) => 0.5 + index * STAGE_GAP;

function Stage({ index, label, icon: StageIcon, plain = false, children }: { index: number; label: string; icon: Icon; plain?: boolean; children: ReactNode }) {
  return (
    <motion.li variants={fadeReveal(stageAt(index), 24)} className="flex flex-col items-center gap-6">
      <div className={`flex h-[300px] w-[330px] items-center justify-center rounded-card shadow-card ${plain ? "bg-mark" : "bg-paper-raised"}`}>{children}</div>
      <p className="flex items-center gap-3 text-point font-bold">
        <StageIcon size={36} className={plain ? "text-ink" : "text-accent"} aria-hidden />
        {label}
      </p>
    </motion.li>
  );
}

function Arrow({ index }: { index: number }) {
  return (
    <li aria-hidden className="flex h-[300px] items-center">
      <svg viewBox="0 0 80 24" width={80}>
        <motion.path
          d="M2 12 H70 M60 3 L72 12 L60 21"
          fill="none"
          className="stroke-ink-faint"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, transition: { duration: 0.5, delay: stageAt(index) - 0.35 } }}
        />
      </svg>
    </li>
  );
}

/** Three note cards that drop in one after another. */
function NoteStack() {
  return (
    <div className="relative h-[200px] w-[200px]">
      {[0, 1, 2].map((card) => (
        <motion.div
          key={card}
          className="absolute flex w-[170px] flex-col gap-3 rounded-xl bg-sheet p-5 shadow-float"
          style={{ left: card * 14, top: card * 18, rotate: (card - 1) * 4 }}
          variants={{
            enter: { y: -40, opacity: 0 },
            present: { y: 0, opacity: 1, transition: { duration: 0.5, ease: easeSamePage, delay: stageAt(0) + 0.2 + card * 0.2 } },
          }}
        >
          {[100, 80, 90, 60].map((width) => (
            <span key={width} className="block h-2.5 rounded-full bg-sheet-rule" style={{ width: `${width}%` }} />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

/** Sections enter in the order they're listed, then the formula sorts them by fit. */
const listed = sampleCourse.sections;
const ranked = [...listed].sort((a, b) => b.fit - a.fit);
const RANK_ROW = 70;

function RankedBars() {
  const sortAt = stageAt(2) + 0.8;
  return (
    <div className="relative h-[210px] w-[270px]">
      {listed.map((section, listIndex) => {
        const rankIndex = ranked.indexOf(section);
        return (
          <motion.div
            key={section.number}
            className="absolute inset-x-0 flex items-center gap-3"
            style={{ height: RANK_ROW - 14 }}
            initial={{ y: listIndex * RANK_ROW, opacity: 0 }}
            animate={{
              y: [listIndex * RANK_ROW, listIndex * RANK_ROW, rankIndex * RANK_ROW],
              opacity: 1,
              transition: { y: { duration: 0.8, delay: sortAt, times: [0, 0.01, 1], ease: easeSamePage }, opacity: { delay: stageAt(2) + 0.2 } },
            }}
          >
            <span className="w-[110px] text-caption text-ink">{section.shortName}</span>
            <span className="h-10 rounded-lg bg-ink" style={{ width: section.fit * 1.4 }} />
          </motion.div>
        );
      })}
    </div>
  );
}

function ExplanationBubble() {
  return (
    <div className="flex flex-col gap-4">
      {ai.pipeline.explanation.map((line, index) => (
        <motion.p
          key={line}
          className={`rounded-card px-6 py-4 text-caption font-bold ${index === 0 ? "bg-sheet text-sheet-ink" : "bg-accent-wash text-ink"}`}
          variants={fadeReveal(stageAt(3) + 0.3 + index * 0.4, 12)}
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}

function PipelineView() {
  const [notes, profile, rank, explain] = ai.pipeline.stages;
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={ai.pipeline.heading} />
      <ol className="flex items-start justify-between">
        <Stage index={0} label={notes} icon={NotePencil}>
          <NoteStack />
        </Stage>
        <Arrow index={1} />
        <Stage index={1} label={profile} icon={Sparkle}>
          <ProfileLine profile={listed[0].profile} label="The profile Claude builds from the notes" size={profileSizes.mini} delay={stageAt(1) + 0.3} />
        </Stage>
        <Arrow index={2} />
        <Stage index={2} label={rank} icon={FunctionIcon} plain>
          <RankedBars />
        </Stage>
        <Arrow index={3} />
        <Stage index={3} label={explain} icon={Sparkle}>
          <ExplanationBubble />
        </Stage>
      </ol>
      <motion.p variants={fadeReveal(stageAt(3) + 1.2)} className="flex items-center gap-3 text-caption text-ink-muted">
        <LockKey size={30} aria-hidden />
        {ai.pipeline.safeguard}
      </motion.p>
    </StepView>
  );
}

const CHART = { width: 760, labelWidth: 250, barHeight: 64, rowGap: 96 };
const plotWidth = CHART.width - CHART.labelWidth;

/** AUC runs from 0.5 (a coin flip) to 1.0 (perfect), so the axis starts at 0.5 and a longer bar means a better model. */
const AUC_FLOOR = 0.5;
const aucX = (value: number) => CHART.labelWidth + ((value - AUC_FLOOR) / (1 - AUC_FLOOR)) * plotWidth;

function AucChart() {
  const { model } = ai;
  const height = model.auc.length * CHART.rowGap;
  return (
    <motion.figure variants={fadeReveal(0.5)} className="flex flex-col gap-6">
      <figcaption className="text-point font-bold">{model.aucTitle}</figcaption>
      <svg viewBox={`0 0 ${CHART.width} ${height + 40}`} width={CHART.width} role="img" aria-label={model.auc.map((bar) => `${bar.label}: ${bar.value}`).join(", ")}>
        <rect x={CHART.labelWidth} width={plotWidth} height={height} className="fill-paper-raised" rx={8} />
        {model.auc.map((bar, index) => {
          const y = index * CHART.rowGap + (CHART.rowGap - CHART.barHeight) / 2;
          return (
            <g key={bar.label}>
              <text y={y + CHART.barHeight / 2} dy="0.35em" className="fill-ink text-caption">
                {bar.label}
              </text>
              <motion.rect x={CHART.labelWidth} y={y} width={aucX(bar.value) - CHART.labelWidth} height={CHART.barHeight} rx={8} className={index === 0 ? "fill-accent" : "fill-rule"} style={growFromLeft} variants={grow(0.8 + index * 0.3)} />
              <text x={aucX(bar.value) + 16} y={y + CHART.barHeight / 2} dy="0.35em" className="fill-ink font-display text-lede font-bold">
                {bar.value.toFixed(2)}
              </text>
            </g>
          );
        })}
        {[0.5, 1].map((tick) => (
          <text key={tick} x={aucX(tick)} y={height + 30} textAnchor={tick === 1 ? "end" : "start"} className="fill-ink-muted text-fineprint">
            {tick === 1 ? "1.0 perfect" : "0.5 coin flip"}
          </text>
        ))}
      </svg>
    </motion.figure>
  );
}

const percentX = (value: number) => CHART.labelWidth + (value / 100) * plotWidth;

function RangeChart() {
  const { model } = ai;
  const height = model.ranges.length * CHART.rowGap;
  return (
    <motion.figure variants={fadeReveal(1.2)} className="flex flex-col gap-6">
      <figcaption className="text-point font-bold">{model.rangeTitle}</figcaption>
      <svg viewBox={`0 0 ${CHART.width} ${height + 40}`} width={CHART.width} role="img" aria-label={model.ranges.map((range) => `${range.label}: ${range.low} to ${range.high}%`).join(", ")}>
        {model.ranges.map((range, index) => {
          const y = index * CHART.rowGap + (CHART.rowGap - CHART.barHeight) / 2;
          const middle = y + CHART.barHeight / 2;
          return (
            <g key={range.label}>
              <text y={middle} dy="0.35em" className="fill-ink text-caption">
                {range.label}
              </text>
              <rect x={CHART.labelWidth} y={y} width={plotWidth} height={CHART.barHeight} rx={CHART.barHeight / 2} className="fill-paper-raised" />
              <motion.rect x={percentX(range.low)} y={y} width={percentX(range.high) - percentX(range.low)} height={CHART.barHeight} rx={CHART.barHeight / 2} className="fill-accent" style={growFromLeft} variants={grow(1.5 + index * 0.3)} />
              <text x={percentX(range.low) - 12} y={middle} dy="0.35em" textAnchor="end" className="fill-ink text-caption font-bold figures-tabular">
                {range.low}%
              </text>
              <text x={percentX(range.high) + 12} y={middle} dy="0.35em" className="fill-ink text-caption font-bold figures-tabular">
                {range.high}%
              </text>
            </g>
          );
        })}
        {[0, 100].map((tick) => (
          <text key={tick} x={percentX(tick)} y={height + 30} textAnchor={tick === 100 ? "end" : "start"} className="fill-ink-muted text-fineprint">
            {tick}%
          </text>
        ))}
      </svg>
    </motion.figure>
  );
}

function ModelView() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={ai.model.heading} />
      <div className="grid grid-cols-2 gap-gap">
        <AucChart />
        <RangeChart />
      </div>
      <span />
    </StepView>
  );
}

export function AiSlide({ step }: SlideProps) {
  return <AnimatePresence mode="wait">{step === 0 ? <PipelineView key="pipeline" /> : <ModelView key="model" />}</AnimatePresence>;
}

/* ---------- Fairness: one icon per rule, a few words each ---------- */

const ruleIcons: Icon[] = [NotePencil, EyeSlash, UserCircleMinus, Prohibit, ChatCircleText];

export function FairnessSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={fairness.heading} size="headline" />
      <ul className="grid grid-cols-5 gap-gap-sm">
        {fairness.rules.map((rule, index) => {
          const RuleIcon = ruleIcons[index];
          return (
            <motion.li key={rule} variants={fadeReveal(0.6 + index * 0.25, 24)} className="flex flex-col gap-8 rounded-card bg-paper-raised p-9 shadow-card">
              <RuleIcon size={88} className="text-accent" aria-hidden />
              <p className="text-point leading-tight font-bold">{rule}</p>
            </motion.li>
          );
        })}
      </ul>
      <span />
    </StepView>
  );
}

/* ---------- Rollout: a timeline that draws left to right ---------- */

export function RolloutSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={rollout.heading} />
      <div className="relative">
        <svg aria-hidden viewBox="0 0 1696 20" className="absolute top-[18px] left-0 w-full">
          <motion.line x1={20} x2={1676} y1={10} y2={10} className="stroke-rule" strokeWidth={6} strokeLinecap="round" style={growFromLeft} variants={grow(0.5, 2)} />
        </svg>
        <ol className="relative grid grid-cols-3 gap-gap">
          {rollout.phases.map((phase, index) => {
            const isNow = index === 0;
            return (
              <motion.li key={phase.name} variants={fadeReveal(0.7 + index * 0.6, 16)} className="flex flex-col gap-6">
                <span className={`size-14 rounded-full ${isNow ? "bg-accent" : "bg-paper ring-[6px] ring-rule"}`} />
                <p className={`text-caption font-bold ${isNow ? "text-accent" : "text-ink-muted"}`}>{phase.when}</p>
                <p className="font-display text-title leading-tight font-bold">{phase.name}</p>
              </motion.li>
            );
          })}
        </ol>
      </div>
      <motion.p variants={fadeReveal(2.6, 12)} className="flex items-center gap-4 self-start rounded-chip bg-mark px-8 py-4 text-point font-bold">
        <LockKey size={36} aria-hidden />
        {rollout.needsNothing}
      </motion.p>
    </StepView>
  );
}

/* ---------- Closing: the tagline and a code the audience can scan ---------- */

/** A QR code for the live site, drawn as one SVG path so it stays sharp on a projector. */
function SiteQrCode({ size }: { size: number }) {
  const code = qrcode(0, "M");
  code.addData(links.site);
  code.make();
  const cells = code.getModuleCount();
  const squares: string[] = [];
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      if (code.isDark(row, col)) squares.push(`M${col} ${row}h1v1h-1z`);
    }
  }
  return (
    <svg viewBox={`-2 -2 ${cells + 4} ${cells + 4}`} width={size} height={size} role="img" aria-label={`QR code for ${links.siteLabel}`} shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={cells + 4} height={cells + 4} className="fill-sheet" />
      <path d={squares.join("")} className="fill-sheet-ink" />
    </svg>
  );
}

export function ClosingSlide() {
  return (
    <StepView className="grid grid-cols-[1fr_auto] items-center gap-gap">
      <div className="flex flex-col gap-14">
        <motion.div variants={fadeReveal(0.1, 20)}>
          <Wordmark className="w-[460px]" />
        </motion.div>
        <Heading lines={closing.heading} size="headline" delay={0.3} />
        <motion.a
          data-interactive
          variants={fadeReveal(1)}
          href={links.site}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto self-start text-lede font-bold text-ink-soft underline decoration-2 underline-offset-8"
        >
          {links.siteLabel}
        </motion.a>
      </div>
      <motion.figure variants={fadeReveal(0.8, 24)} className="flex flex-col items-center gap-6 rounded-card bg-paper-raised p-10 shadow-offset">
        <SiteQrCode size={440} />
        <figcaption className="text-point font-bold">{closing.cta}</figcaption>
      </motion.figure>
    </StepView>
  );
}

/* ---------- Sources ---------- */

function SourceRow({ source }: { source: Source }) {
  const title = source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer" data-interactive className="pointer-events-auto hover:underline">
      {source.title}
    </a>
  ) : (
    source.title
  );
  return (
    <li className="grid grid-cols-[220px_1fr] gap-6">
      <span className="font-bold text-ink-muted">{statusLabel[source.status]}</span>
      <span>{title}</span>
    </li>
  );
}

export function SourcesSlide() {
  return (
    <StepView className="flex flex-col gap-10">
      <h2 className="font-display text-title font-bold">{appendix.heading}</h2>
      <motion.ul variants={fadeReveal(0.3)} className="flex flex-col gap-3 text-fineprint">
        {Object.values(sources).map((source) => (
          <SourceRow key={source.title} source={source} />
        ))}
      </motion.ul>
      <Note delay={0.6}>{appendix.script[0]}</Note>
    </StepView>
  );
}
