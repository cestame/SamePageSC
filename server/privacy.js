// Privacy scrubbing. Runs on notes BEFORE they are sent to the AI model, and again on
// the extracted evidence notes before anything is stored. Raw notes are never stored.

const PATTERNS = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]'],
  [/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, '[phone]'],
  [/\b\d{10}\b/g, '[id]'], // USC ID numbers are 10 digits
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[id]'],
  [/(^|\s)@[A-Za-z0-9_.]{2,}/g, '$1[handle]'],
  // "my name is Jane Doe", "I'm Jane", "Name: Jane Doe", "Student: Jane Doe", "by Jane Doe"
  [/\b([Mm]y name is|I am|I'm|[Tt]his is)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g, '$1 [name]'],
  [/\b(name|student|author|submitted by|notes by|taken by)\s*[:-]\s*[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*/gi, '$1: [name]'],
  // "Notes by Jane Doe" with no colon. Case-sensitive name match, so "taken by the professor" is left alone.
  [/\b([Ss]ubmitted by|[Nn]otes by|[Tt]aken by|[Ww]ritten by)\s+[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*/g, '$1 [name]'],
  // Classmate names followed by a classroom verb, e.g. "Jake asked", "Maria Lopez said"
  [/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?=(asked|said|answered|presented|mentioned|raised)\b)/g, '[student] '],
];

// Words that commonly start a sentence before "asked/said" and are not names.
const SAFE_WORDS = new Set(['Someone', 'Somebody', 'Everyone', 'Nobody', 'He', 'She', 'They', 'Professor', 'Prof', 'Dr', 'The', 'A', 'TA', 'Students', 'Student', 'He also', 'She also', 'They also']);

export function scrubText(text) {
  if (typeof text !== 'string') return '';
  let out = text;
  for (const [re, replacement] of PATTERNS) {
    if (replacement === '[student] ') {
      out = out.replace(re, (m) => (SAFE_WORDS.has(m.trim()) ? m : replacement));
    } else {
      out = out.replace(re, replacement);
    }
  }
  return out;
}

// Rejects evidence lines that comment on the person rather than the class.
const PERSONAL = /\b(accent|ugly|attractive|creepy|fat|skinny|annoying voice|dresses|outfit|ethnicity|religion|religious|gay|pregnant|his looks|her looks)\b/i;

export function isAboutThePerson(text) {
  return PERSONAL.test(text || '');
}
