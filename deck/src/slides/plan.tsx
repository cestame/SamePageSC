import { ArrowRight, ArrowSquareOut, Function as FunctionIcon, LockKey, NotePencil, ShieldCheck, Sparkle, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { StepView, fadeReveal } from "@/engine/primitives";
import { easeDrawn } from "@/engine/motion";
import { ai, appendix, closing, fairness, links, rollout, sampleCourse, sources, statusLabel, type Source } from "../content";
import { ProfileLine, profileSizes } from "../ProfileLine";
import { Callout, Card, Heading, Note, Wordmark } from "../ui";

type SlideProps = { step: number };

/** Which pipeline steps the model runs. The ranking step is plain code, and the slide shows that with a different icon and fill. */
const stepIcons: Icon[] = [NotePencil, Sparkle, FunctionIcon, Sparkle];
const RANKING_STEP = 2;

function PipelineView() {
  const { pipeline } = ai;
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={pipeline.heading} />
      <ol className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-6">
        {pipeline.steps.flatMap((item, index) => {
          const StepIcon = stepIcons[index];
          const isRanking = index === RANKING_STEP;
          const card = (
            <motion.li
              key={item.name}
              variants={fadeReveal(0.5 + index * 0.35, 20)}
              className={`flex flex-col gap-4 rounded-card p-8 ${isRanking ? "bg-mark" : "bg-paper-raised shadow-card"}`}
            >
              <StepIcon size={48} className={isRanking ? "text-ink" : "text-accent"} aria-hidden />
              <p className="text-point leading-tight font-bold">{item.name}</p>
              <p className={`text-caption ${isRanking ? "text-ink-soft" : "text-ink-muted"}`}>{item.detail}</p>
            </motion.li>
          );
          if (index === 0) return [card];
          const arrow = (
            <motion.li key={`${item.name}-arrow`} aria-hidden variants={fadeReveal(0.4 + index * 0.35)} className="flex items-center text-ink-faint">
              <ArrowRight size={40} />
            </motion.li>
          );
          return [arrow, card];
        })}
      </ol>
      <motion.ul variants={fadeReveal(2)} className="flex gap-12 text-caption text-ink-muted">
        {pipeline.safeguards.map((safeguard) => (
          <li key={safeguard} className="flex items-center gap-3">
            <ShieldCheck size={32} aria-hidden />
            {safeguard}
          </li>
        ))}
      </motion.ul>
    </StepView>
  );
}

function grow(delay: number): Variants {
  return {
    enter: { scaleX: 0 },
    present: { scaleX: 1, transition: { duration: 1, ease: easeDrawn, delay } },
  };
}

const CHART = { width: 760, labelWidth: 250, barHeight: 56, rowGap: 84 };
const plotWidth = CHART.width - CHART.labelWidth;
const growFromLeft = { transformBox: "fill-box", transformOrigin: "left center" } as const;

/** AUC runs from 0.5 (a coin flip) to 1.0 (perfect), so the axis starts at 0.5 and a longer bar means a better model. */
const AUC_FLOOR = 0.5;
const aucX = (value: number) => CHART.labelWidth + ((value - AUC_FLOOR) / (1 - AUC_FLOOR)) * plotWidth;

function AucChart() {
  const { model } = ai;
  const height = model.auc.length * CHART.rowGap;
  return (
    <motion.figure variants={fadeReveal(0.5)} className="flex flex-col gap-6">
      <figcaption>
        <p className="text-point font-bold">{model.aucTitle}</p>
        <p className="text-caption text-ink-muted">{model.aucLine}</p>
      </figcaption>
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
      <p className="text-fineprint text-ink-muted">{model.aucScale}</p>
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
      <p className="text-fineprint text-ink-muted">{model.rangeNote}</p>
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

export function FairnessSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={fairness.heading} size="headline" />
      <ul className="grid grid-cols-6 gap-gap-sm">
        {fairness.rules.map((rule, index) => (
          <Card key={rule.name} name={rule.name} detail={rule.detail} delay={0.5 + index * 0.18} className={index < 3 ? "col-span-2" : "col-span-3"} />
        ))}
      </ul>
    </StepView>
  );
}

function Phase({ phase, index }: { phase: (typeof rollout.phases)[number]; index: number }) {
  const isNow = index === 0;
  return (
    <motion.li variants={fadeReveal(0.6 + index * 0.35, 20)} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className={`size-7 shrink-0 rounded-full ${isNow ? "bg-accent" : "bg-paper-raised ring-4 ring-rule"}`} />
        <p className={`text-caption font-bold ${isNow ? "text-accent" : "text-ink-muted"}`}>{phase.when}</p>
      </div>
      <p className="text-point leading-tight font-bold">{phase.name}</p>
      <ul className="flex flex-col gap-2 text-caption text-ink-muted">
        {phase.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </motion.li>
  );
}

export function RolloutSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={rollout.heading} />
      <ol className="grid grid-cols-3 gap-gap">
        {rollout.phases.map((phase, index) => (
          <Phase key={phase.name} phase={phase} index={index} />
        ))}
      </ol>
      <div className="flex flex-col gap-4">
        <Callout delay={1.8}>{rollout.needsNothing}</Callout>
        <motion.p variants={fadeReveal(2.1)} className="flex items-center gap-3 text-caption text-ink-muted">
          <LockKey size={32} aria-hidden />
          {rollout.gate}
        </motion.p>
      </div>
    </StepView>
  );
}

export function ClosingSlide() {
  return (
    <StepView className="grid grid-cols-[1fr_auto] items-center gap-gap">
      <div className="flex flex-col gap-12">
        <motion.div variants={fadeReveal(0.1, 20)}>
          <Wordmark className="w-[420px]" />
        </motion.div>
        <Heading lines={closing.heading} size="headline" delay={0.3} />
        <motion.div variants={fadeReveal(1)}>
          <p className="text-caption text-ink-muted">{closing.goalsTitle}</p>
          <ul className="mt-3 flex flex-wrap gap-4">
            {closing.goals.map((goal) => (
              <li key={goal} className="rounded-chip bg-paper-raised px-6 py-3 text-body font-bold shadow-card">
                {goal}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.a
          data-interactive
          variants={fadeReveal(1.4)}
          href={links.site}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto flex items-center gap-4 self-start rounded-chip bg-control px-10 py-5 text-point font-bold text-on-control"
        >
          {closing.cta} at {links.siteLabel}
          <ArrowSquareOut size={44} aria-hidden />
        </motion.a>
      </div>
      <ProfileLine profile={sampleCourse.sections[1].profile} label="A sample teaching profile drawn as one line" size={profileSizes.large} delay={0.5} />
    </StepView>
  );
}

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
      <Note delay={0.6}>{appendix.notes[0]}</Note>
    </StepView>
  );
}
