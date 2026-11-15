import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { ArrowClockwise, CaretDown, WarningCircle } from '@phosphor-icons/react';

// ---------- Button ----------

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'quiet' | 'accent-link';
  block?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  href?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function Button({ variant = 'primary', block, icon, iconAfter, href, children, className, ...rest }: ButtonProps) {
  const classes = ['button', `button--${variant}`, block ? 'button--block' : '', className ?? ''].join(' ').trim();
  const content = <>{icon}<span>{children}</span>{iconAfter}</>;
  if (href) {
    return <motion.a className={classes} href={href} whileTap={{ scale: 0.98 }}>{content}</motion.a>;
  }
  return (
    <motion.button className={classes} type="button" whileTap={{ scale: 0.98 }} {...(rest as object)}>
      {content}
    </motion.button>
  );
}

// ---------- Card ----------

export function Card({ children, as: Tag = 'section', emphasis, className, id }: {
  children: ReactNode;
  as?: 'section' | 'article' | 'div';
  emphasis?: boolean;
  className?: string;
  id?: string;
}) {
  return <Tag id={id} className={['card', emphasis ? 'card--emphasis' : '', className ?? ''].join(' ').trim()}>{children}</Tag>;
}

// ---------- Badge ----------

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'sample' | 'verified'; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function SampleBadge() {
  return <Badge tone="sample">Sample professor, fictional</Badge>;
}

// ---------- Disclosure ----------

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="disclosure">
      <summary className="disclosure__summary">
        <span>{summary}</span>
        <CaretDown className="disclosure__caret" size={18} aria-hidden />
      </summary>
      <div className="disclosure__body">{children}</div>
    </details>
  );
}

// ---------- Key/value block ----------

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="key-value">
      {items.map(([k, v]) => (
        <div key={k} className="key-value__row">
          <dt className="text-small text-muted">{k}</dt>
          <dd className="text-small">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- Fit score ----------

/** A fit score that counts up once, with what it measures written beside it. */
export function FitScore({ score, size = 'large', caption }: { score: number; size?: 'large' | 'small'; caption?: string }) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? score : 0);

  useEffect(() => {
    if (reduceMotion) {
      setShown(score);
      return;
    }
    const controls = animate(0, score, { duration: 0.9, ease: [0.22, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [score, reduceMotion]);

  return (
    <div className={`fit-score fit-score--${size}`}>
      <span className={size === 'large' ? 'text-score' : 'text-title'} aria-hidden>
        {shown}<span className="fit-score__unit">%</span>
      </span>
      <span className="visually-hidden">{score}% fit</span>
      {caption && <span className="fit-score__caption text-small text-muted">{caption}</span>}
    </div>
  );
}

// ---------- Quiz question ----------

export type QuizOption<V> = { value: V; label: string; detail?: string };

/** A single-choice question. Used for the intake and the feedback prompts. */
export function QuizQuestion<V extends string | number | boolean>({ id, question, options, value, onSelect, layout = 'stack', headingClass = 'text-display' }: {
  id: string;
  question: string;
  options: readonly QuizOption<V>[];
  value: V | undefined;
  onSelect: (value: V) => void;
  layout?: 'stack' | 'pair' | 'chips';
  headingClass?: string;
}) {
  return (
    <div className="quiz">
      <h2 id={id} className={headingClass}>{question}</h2>
      <div className={`quiz__options quiz__options--${layout}`} role="radiogroup" aria-labelledby={id}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <motion.button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? 'quiz__option quiz__option--selected' : 'quiz__option'}
              onClick={() => onSelect(o.value)}
              whileTap={{ scale: 0.98 }}
            >
              <span className="quiz__mark" aria-hidden>
                {selected && <motion.span className="quiz__mark-fill" layoutId={`mark-${id}`} transition={{ duration: 0.18 }} />}
              </span>
              <span className="quiz__text">
                <span className="quiz__label">{o.label}</span>
                {o.detail && layout === 'stack' && <span className="quiz__detail text-small text-muted">{o.detail}</span>}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- States ----------

export function LoadingState({ label, lines = 3 }: { label: string; lines?: number }) {
  return (
    <div className="state state--loading" role="status">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton" style={{ width: `${92 - i * 18}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({ title, error, onRetry }: { title: string; error: Error; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <WarningCircle className="state__icon" size={28} weight="duotone" aria-hidden />
      <div className="stack-2 min-0">
        <p className="text-heading">{title}</p>
        <p className="text-small text-muted">{error.message}</p>
        {onRetry && (
          <div><Button variant="secondary" icon={<ArrowClockwise size={18} aria-hidden />} onClick={onRetry}>Try again</Button></div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="state state--empty">
      <div className="stack-2">
        <p className="text-heading">{title}</p>
        <p className="text-small text-muted">{body}</p>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
