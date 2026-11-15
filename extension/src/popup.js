import { DEFAULT_API_ORIGIN, isAllowedApiOrigin } from './config.js';
import { CONTENT } from './generated/questions.js';
import { validateAnswers } from './lib/messages.js';

const $ = (id) => document.getElementById(id);

function renderQuestions(saved) {
  const form = $('answers');
  for (const q of CONTENT.questions) {
    const set = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = q.question;
    set.append(legend);
    const options = document.createElement('div');
    options.className = 'options';
    for (const o of q.options) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = q.key;
      input.value = String(o.value);
      input.checked = saved?.[q.key] === o.value;
      label.append(input, document.createTextNode(o.label));
      options.append(label);
    }
    set.append(options);
    form.append(set);
  }
}

function readAnswers() {
  const data = new FormData($('answers'));
  const answers = {};
  for (const q of CONTENT.questions) {
    const raw = data.get(q.key);
    if (raw === null) return null;
    answers[q.key] = q.key === 'goal' ? String(raw) : Number(raw);
  }
  return answers;
}

function status(text, isError = false) {
  $('status').textContent = text;
  $('status').className = isError ? 'error' : '';
}

async function load() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  $('notOfficial').textContent = CONTENT.notOfficial;
  $('learningStyles').textContent = CONTENT.learningStylesNote;
  $('consent').checked = settings.consented === true;
  $('apiOrigin').value = isAllowedApiOrigin(settings.apiOrigin) ? settings.apiOrigin : DEFAULT_API_ORIGIN;
  renderQuestions(settings.answers);
}

$('save').addEventListener('click', async () => {
  const apiOrigin = $('apiOrigin').value.trim().replace(/\/$/, '');
  if (!isAllowedApiOrigin(apiOrigin)) return status('That server address is not on the allowed list.', true);
  const answers = readAnswers();
  const checked = answers ? validateAnswers(answers) : null;
  await chrome.storage.local.set({
    settings: { consented: $('consent').checked, apiOrigin, answers: checked?.ok ? checked.value : null },
  });
  status(checked?.ok ? 'Saved. Fit scores will appear on Web Registration.' : 'Saved. Answer every question to see fit scores.');
});

$('forget').addEventListener('click', async () => {
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
  status('Deleted your answers, pinned sections and cached profiles.');
  $('consent').checked = false;
  for (const input of document.querySelectorAll('#answers input')) input.checked = false;
});

$('demo').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('src/demo.html') }));

load();
