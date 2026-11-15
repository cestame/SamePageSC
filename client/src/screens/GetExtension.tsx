import { useState } from 'react';
import { ArrowDown, ArrowRight, Check, Copy } from '@phosphor-icons/react';
import { asset } from '../lib/target';
import { Button, Card } from '../components/ui';

/** Where to test the extension: a fictional class list with Web Registration's layout, served by our own site. */
export const DEMO_WEBREG_URL = '/demo/webreg';
const EXTENSIONS_PAGE = 'chrome://extensions';

/** Chrome blocks links to chrome:// pages, so the address is copied for the student to paste instead. */
function CopyExtensionsAddress() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(EXTENSIONS_PAGE);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <Button variant="secondary" onClick={copy} icon={copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}>
      {copied ? 'Copied. Paste it into the address bar' : `Copy ${EXTENSIONS_PAGE}`}
    </Button>
  );
}

const STEPS = [
  {
    title: 'Download the extension.',
    body: 'You get a file called same-page-extension.zip.',
    action: <Button href={asset('same-page-extension.zip')} icon={<ArrowDown size={20} aria-hidden />}>Download the extension</Button>,
  },
  {
    title: 'Unzip it.',
    body: 'On a Mac, double-click the file. On Windows, right-click it and choose Extract All. You get a folder called same-page-extension.',
  },
  {
    title: 'Open Chrome\'s extensions page.',
    body: 'Paste chrome://extensions into Chrome\'s address bar, then turn on Developer mode in the top right corner.',
    action: <CopyExtensionsAddress />,
  },
  {
    title: 'Click Load unpacked.',
    body: 'Choose the unzipped same-page-extension folder. Same Page now appears in your list of extensions.',
  },
  {
    title: 'Pin it to your toolbar.',
    body: 'Click the puzzle piece next to the address bar and pin Same Page, so its side panel is one click away.',
  },
];

export function GetExtension() {
  return (
    <>
      <h1 className="text-display">Get the Same Page extension</h1>
      <p className="text-body">
        The extension puts a fit badge under every section in USC Web Registration. Installing it takes about a minute in Chrome.
      </p>

      <ol className="install-steps plain-list">
        {STEPS.map((step, i) => (
          <li key={step.title} className="install-steps__step">
            <span className="step__number" aria-hidden="true">{i + 1}</span>
            <div className="stack-2">
              <h2 className="text-heading">{step.title}</h2>
              <p className="text-small text-muted">{step.body}</p>
              {step.action && <div>{step.action}</div>}
            </div>
          </li>
        ))}
      </ol>

      <Card emphasis>
        <h2 className="text-title">Test it on the sample Web Registration</h2>
        <p className="text-body">
          Open our sample class list with the extension installed. A badge appears under every section. Click one, answer 8 quick questions in Chrome's side panel, and every badge updates with your fit.
        </p>
        <div>
          <Button className="button--large" href={DEMO_WEBREG_URL} iconAfter={<ArrowRight size={20} aria-hidden />}>
            Open the sample Web Registration
          </Button>
        </div>
        <p className="text-small text-muted">
          The sample uses fictional professors. It isn't a USC site, and nothing on it registers you for classes.
        </p>
      </Card>
    </>
  );
}
