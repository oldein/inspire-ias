/*I FEEL NAKED*/
const DATA_URL = 'https://script.google.com/macros/s/AKfycbxWiuoKYqARA1H8z7WX8u-jI7BfOGo5pO0cvUXu02ygesU-45WLcXRZsxeN0go6Ksyb/exec'

/* OBJECT REFERENCES */
const step1 = document.getElementById('setup-step1');
const moreBtn = document.getElementById('more-btn');
const codeInput = document.getElementById('access-code');
const setupError = document.getElementById('setup-error');
const startBtn = document.getElementById('start-btn');
const nameInput = document.getElementById('annotator-name');
const continueBtn = document.getElementById('continue-btn');
const step2 = document.getElementById('setup-step2');
const greeting = document.getElementById('greeting');
const chips = document.querySelectorAll('#setup-screen .chip');
const setupScreen = document.getElementById('setup-screen');
const annotationScreen = document.getElementById('annotation-screen');
const doneScreen = document.getElementById('done-screen');
const progressFill = document.querySelector('.progress-fill');
const articleTitle = document.getElementById('article-title');
const articleAbstract = document.getElementById('article-abstract');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const doneMessage = document.getElementById('done-message');
const relevanceLabels = document.getElementById('relevance-labels');
const subjectsLabels = document.getElementById('subjects-labels');
const relevanceChips = document.querySelectorAll('.relevance-chip');
const subjectChips = document.querySelectorAll('.subject-chip');

/* STATE */
const responses = {};
let currentIndex = 0;
let articles = [];
let selected = { name: '', code: '', count: null, task: null };
/* FUNCTIONS */

// async function loadData() {
//     const res = await fetch('data.json');
//     articles = await res.json();
//   }

async function loadData() {
  const params = new URLSearchParams({ count: selected.count, code: selected.code });
  const res = await fetch(`${DATA_URL}?${params}`);
  articles = await res.json();
}

function checkReady() {
  const ready = nameInput.value.trim() && selected.count && selected.task;
  startBtn.classList.toggle('ready', !!ready);
}

function resetStep2() {
  setupError.hidden = true;
  step2.hidden = true;
  continueBtn.hidden = false;
  continueBtn.classList.toggle('ready', !!(nameInput.value.trim() && codeInput.value.trim()));
}

function greetingText(name, done) {
  const labels = {
    Relevance: 'for relevance',
    Subjects: 'for subjects',
    Both: 'for both relevance and subjects'
  };

  const parts = Object.entries(done)
    .filter(([task, n]) => n > 0)
    .map(([task, n]) => `${n} article${n === 1 ? '' : 's'} ${labels[task]}`);

  if (parts.length === 0) return `Welcome, ${name}! Looks like you're new here.`;
  return `Welcome back, ${name}! So far you've annotated ${parts.join(', ')}.`;
}

function showAnnotation(i) {
  const a = articles[i];
  const total = Math.min(selected.count, articles.length);

  setupScreen.hidden = true;
  annotationScreen.hidden = false;

  relevanceLabels.hidden = selected.task === 'Subjects';
  subjectsLabels.hidden = selected.task === 'Relevance';

  progressFill.style.width = `${((i + 1) / total) * 100}%`;
  articleTitle.textContent = a.title;
  articleAbstract.textContent = a.abstract;
  renderMathInElement(document.querySelector('.article-card'), {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ],
    throwOnError: false
  });

  prevBtn.disabled = false;
  nextBtn.textContent = i === total - 1 ? 'Finish' : 'Next';

  relevanceChips.forEach(btn => {
    btn.classList.remove('error');
    btn.classList.toggle('selected', responses[a.id]?.relevance === btn.dataset.label);
  });

  subjectChips.forEach(btn => {
    btn.classList.remove('error');
    btn.classList.toggle('selected', responses[a.id]?.subjects?.includes(btn.dataset.subject) || false);
  });

  currentIndex = i;
}

function saveResponse(id) {
  const r = responses[id];
  const payload = {
    name: selected.name,
    code: selected.code,
    task: selected.task,
    count: Number(selected.count),
    id: id,
    relevance: r.relevance,
    subjects: r.subjects
  };

  fetch(DATA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
}

function showDone() {
  annotationScreen.hidden = true;
  doneScreen.hidden = false;
  doneMessage.textContent = `Collected ${Object.keys(responses).length} labels. Thanks ${selected.name}!`;
}

/* KIND OF INIT */

nameInput.addEventListener('input', () => {
  nameInput.classList.remove('error');
  resetStep2();
  checkReady();
});

codeInput.addEventListener('input', () => {
  codeInput.classList.remove('error');
  resetStep2();
});

continueBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const code = codeInput.value.trim();
  if (!code) codeInput.classList.add('error');
  if (!name) nameInput.classList.add('error');
  if (!code || !name) return;

  continueBtn.disabled = true;
  continueBtn.textContent = 'Checking…';

  const params = new URLSearchParams({ action: 'lookup', name: name, code: code });
  const res = await fetch(`${DATA_URL}?${params}`);
  const result = await res.json();

  continueBtn.disabled = false;
  continueBtn.textContent = 'Continue';

  if (result.error) {
    codeInput.classList.add('error');
    setupError.textContent = 'This access code is not valid.';
    setupError.hidden = false;
    return;
  }

  selected.code = code;

  try {
    localStorage.setItem('iaa-name', name);
    localStorage.setItem('iaa-code', code);
  } catch { }

  continueBtn.hidden = true;
  greeting.textContent = greetingText(name, result);
  step2.hidden = false;
});

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    const siblings = chip.parentElement.querySelectorAll('.chip');
    const deselect = chip.classList.contains('selected');

    siblings.forEach(c => c.classList.remove('selected', 'error'));

    if (deselect) {
      if (chip.dataset.count) selected.count = null;
      if (chip.dataset.task) selected.task = null;
    } else {
      chip.classList.add('selected');
      if (chip.dataset.count) selected.count = chip.dataset.count;
      if (chip.dataset.task) selected.task = chip.dataset.task;
    }

    checkReady();
  });
});

startBtn.addEventListener('click', async () => {
  selected.name = nameInput.value.trim();
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  let valid = true;

  if (!selected.name) { nameInput.classList.add('error'); valid = false; }
  if (!selected.count) {
    document.querySelectorAll('#count-section .chip').forEach(c => c.classList.add('error'));
    valid = false;
  }
  if (!selected.task) {
    document.querySelectorAll('#task-section .chip').forEach(c => c.classList.add('error'));
    valid = false;
  }

  if (!valid) return;

  startBtn.disabled = true;
  startBtn.textContent = 'Loading…';

  await loadData();

  startBtn.disabled = false;
  startBtn.textContent = 'Start';

  showAnnotation(0);
});

relevanceChips.forEach(btn => {
  btn.addEventListener('click', () => {
    relevanceChips.forEach(b => b.classList.remove('selected', 'error'));
    btn.classList.add('selected');
    const id = articles[currentIndex].id;
    if (!responses[id]) responses[id] = { relevance: null, subjects: [] };
    responses[id].relevance = btn.dataset.label;
  });
});

subjectChips.forEach(btn => {
  btn.addEventListener('click', () => {
    subjectChips.forEach(c => c.classList.remove('error'));
    btn.classList.toggle('selected');
    const id = articles[currentIndex].id;
    if (!responses[id]) responses[id] = { relevance: null, subjects: [] };
    const arr = responses[id].subjects;
    const sub = btn.dataset.subject;
    if (arr.includes(sub)) {
      arr.splice(arr.indexOf(sub), 1);
    } else {
      arr.push(sub);
    }
  });
});

prevBtn.addEventListener('click', () => {
  if (currentIndex === 0) {
    annotationScreen.hidden = true;
    setupScreen.hidden = false;
  } else {
    showAnnotation(currentIndex - 1);
  }
});

nextBtn.addEventListener('click', () => {
  const id = articles[currentIndex].id;
  const r = responses[id];
  let valid = true;

  if (selected.task !== 'Subjects' && !r?.relevance) {
    relevanceChips.forEach(c => c.classList.add('error'));
    valid = false;
  }
  if (selected.task !== 'Relevance' && (!r?.subjects || r.subjects.length === 0)) {
    subjectChips.forEach(c => c.classList.add('error'));
    valid = false;
  }

  if (!valid) return;
  saveResponse(id);

  const total = Math.min(selected.count, articles.length);
  if (currentIndex === total - 1) {
    showDone();
  } else {
    showAnnotation(currentIndex + 1);
  }
});

moreBtn.addEventListener('click', () => {
  doneScreen.hidden = true;
  setupScreen.hidden = false;
  step1.hidden = true;
  step2.hidden = false;
});

try {
  nameInput.value = localStorage.getItem('iaa-name') || '';
  codeInput.value = localStorage.getItem('iaa-code') || '';
} catch { }
continueBtn.classList.toggle('ready', !!(nameInput.value.trim() && codeInput.value.trim()));



