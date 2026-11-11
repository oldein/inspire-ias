/* OBJECT REFERENCES */
const startBtn = document.getElementById('start-btn');
const nameInput = document.getElementById('annotator-name');
const bckgInput = document.getElementById('annotator-bckg');
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
const doneData = document.getElementById('done-data');
const relevanceLabels = document.getElementById('relevance-labels');
const subjectsLabels = document.getElementById('subjects-labels');
const relevanceChips = document.querySelectorAll('.relevance-chip');
const subjectChips = document.querySelectorAll('.subject-chip');

/* STATE */
const responses = {};
let currentIndex = 0;
let articles = [];
let selected = { name: '', count: null, task: null };

/* FUNCTIONS */

async function loadData() {
    const res = await fetch('data.json');
    articles = await res.json();
  }

function checkReady() {
    const ready = nameInput.value.trim() && selected.count && selected.task;
    startBtn.classList.toggle('ready', !!ready);
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

  function showDone() {
    annotationScreen.hidden = true;
    doneScreen.hidden = false;
    doneMessage.textContent = `Collected ${Object.keys(responses).length} labels. Thanks ${selected.name}!`;
    doneData.textContent = JSON.stringify(responses, null, 2);
  }

/* KIND OF INIT */

nameInput.addEventListener('input', () => {
    nameInput.classList.remove('error');
    checkReady();
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

    await loadData();
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
  
    const total = Math.min(selected.count, articles.length);
    if (currentIndex === total - 1) {
      showDone();
    } else {
      showAnnotation(currentIndex + 1);
    }
  });


  
  