import { FIELDS } from '../../../shared/content.js';
import type { FieldKey } from '../lib/api';

type Row = { value: number | null; evidence: string[] };

/**
 * Each profile row with the line from the source text that supports it, so readers can check the AI's work.
 * Rows without evidence are shown as not found instead of being hidden.
 */
export function EvidenceList({ rows }: { rows: Record<FieldKey, Row> }) {
  return (
    <ul className="evidence-list">
      {FIELDS.map((f) => {
        const row = rows[f.key];
        const found = row.value != null;
        return (
          <li key={f.key} className={found ? 'evidence-list__row' : 'evidence-list__row evidence-list__row--missing'}>
            <div className="evidence-list__head">
              <span className="text-heading">{f.label}</span>
              <span className="text-small text-muted">{found ? describeValue(row.value as number, f.low, f.high) : 'Not in the text'}</span>
            </div>
            {row.evidence.length > 0 && (
              <ul className="evidence-list__quotes">
                {row.evidence.map((e, i) => <li key={i} className="text-small">{e}</li>)}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function describeValue(value: number, low: string, high: string) {
  if (value <= 2) return `${value} of 5, toward ${low.toLowerCase()}`;
  if (value >= 4) return `${value} of 5, toward ${high.toLowerCase()}`;
  return `${value} of 5, in between`;
}
