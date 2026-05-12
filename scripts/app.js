const DEFAULTS = {
  stepLength: 12,
  stepLengthDelta: 0,
  angleDelta: 0,
};

const FPS_DEFAULTS = { grow: 2, turtle: 10 };

const state = {
  grammar: grammars[0],
  angle: grammars[0].angle,
  stepLength: DEFAULTS.stepLength,
  stepLengthDelta: DEFAULTS.stepLengthDelta,
  angleDelta: DEFAULTS.angleDelta,
  seed: 42,
  iterations: grammars[0].iterations,
  tickMs: 1000 / FPS_DEFAULTS.grow,
  mode: 'grow',
  allStrings: [],
  currentStep: 0,
  animTimer: null,
  turtleData: null,
  currentSymbol: -1,
};

const sel       = document.getElementById('grammar-select');
const btnGrow   = document.getElementById('btn-grow');
const btnTurtle = document.getElementById('btn-turtle');
const btnPlay   = document.getElementById('btn-play');
const bannerEl  = document.getElementById('banner');
const bannerMsg = document.getElementById('banner-msg');
const seedEl    = document.getElementById('seed');
const speedEl   = document.getElementById('speed');
const speedOutEl = document.getElementById('speed-out');
const angleEl   = document.getElementById('angle');
const stepLenEl      = document.getElementById('step-length');
const stepLenDeltaEl = document.getElementById('step-length-delta');
const customRowEl    = document.getElementById('custom-row');
const customJsonEl   = document.getElementById('custom-json');
const angleDeltaEl   = document.getElementById('angle-delta');
const itersEl   = document.getElementById('iterations');
const panelLeft = document.getElementById('panel-left');
const canvas    = document.getElementById('canvas');

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseCustomGrammar(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    return { error: `JSON inválido: ${e.message}` };
  }
  if (typeof obj.axiom !== 'string' || !obj.axiom)
    return { error: "Falta o es inválido el campo 'axiom' (string)" };
  if (!obj.rules || typeof obj.rules !== 'object' || Array.isArray(obj.rules))
    return { error: "Falta o es inválido el campo 'rules' (objeto)" };
  for (const [sym, opts] of Object.entries(obj.rules)) {
    if (!Array.isArray(opts) || opts.length === 0)
      return { error: `Regla '${sym}': debe ser un array de { p, successor }` };
    for (const opt of opts) {
      if (typeof opt.p !== 'number' || typeof opt.successor !== 'string')
        return { error: `Regla '${sym}': cada entrada necesita p (número) y successor (string)` };
    }
  }
  return { grammar: { name: 'Custom', fitCanvas: false, ...obj } };
}

function validateGrammar(grammar) {
  const errors = [];
  Object.entries(grammar.rules).forEach(([sym, opts]) => {
    const sum = opts.reduce((acc, o) => acc + o.p, 0);
    if (Math.abs(sum - 1) > 0.01) {
      errors.push(`'${sym}' suma ${sum.toFixed(3)}`);
    }
  });
  if (errors.length) {
    bannerMsg.textContent = `Probabilidades inválidas en ${grammar.name}: ${errors.join(', ')} — deben sumar 1`;
    bannerEl.hidden = false;
  } else {
    bannerEl.hidden = true;
  }
}

function syncCanvasSize() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function stopAnim() {
  if (state.animTimer) { clearInterval(state.animTimer); state.animTimer = null; }
  btnPlay.textContent = '▶ Animar';
  btnPlay.classList.remove('playing');
}

function truncate(s, max = 120) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// reduced lines JSON.stringify
function grammarToJson(g) {
  const { axiom, rules, fitCanvas } = g;

  const rulesStr = Object.entries(rules).map(([sym, opts]) => {
    const entries = opts.map(o =>
      `{ "p": ${o.p}, "successor": ${JSON.stringify(o.successor)} }`
    );
    const arr = entries.length === 1
      ? `[${entries[0]}]`
      : `[\n      ${entries.join(',\n      ')}\n    ]`;
    return `    ${JSON.stringify(sym)}: ${arr}`;
  }).join(',\n');

  return [
    '{',
    `  "axiom": ${JSON.stringify(axiom)},`,
    `  "rules": {`,
    rulesStr,
    `  },`,
    `  "fitCanvas": ${fitCanvas}`,
    '}'
  ].join('\n');
}

// ── Grow ───────────────────────────────────────────────────────────────
function renderGrowPanel() {
  panelLeft.innerHTML = '';
  state.allStrings.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'deriv-line' + (i === state.currentStep ? ' active' : '');
    div.dataset.step = i;
    div.innerHTML = `<span class="step-label">n=${i}</span>${truncate(s)}`;
    panelLeft.appendChild(div);
  });
  const active = panelLeft.querySelector('.deriv-line.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function renderGrowCanvas() {
  syncCanvasSize();
  draw(state.allStrings[state.currentStep], canvas, {
    angle: state.angle,
    stepLength: state.stepLength,
    angleDelta: state.angleDelta,
    stepLengthDelta: state.stepLengthDelta,
    seed: state.seed,
    fitCanvas: !!state.grammar.fitCanvas,
  });
}

function initGrow() {
  state.allStrings = deriveAll(state.grammar.axiom, state.grammar.rules, state.iterations, state.seed);
  state.currentStep = 0;
  renderGrowPanel();
  renderGrowCanvas();
}

function tickGrow() {
  if (state.currentStep >= state.iterations) { stopAnim(); return; }
  state.currentStep++;
  renderGrowPanel();
  renderGrowCanvas();
}

function startGrow() {
  if (state.currentStep >= state.iterations) state.currentStep = 0;
  btnPlay.textContent = '■ Parar';
  btnPlay.classList.add('playing');
  state.animTimer = setInterval(tickGrow, state.tickMs);
}

// ── Turtle ──────────────────────────────────────────────────────────────
function renderTurtlePanel() {
  panelLeft.innerHTML = '';

  const label = document.createElement('div');
  label.id = 'turtle-label';
  const activeStr = state.allStrings[state.currentStep] ?? state.grammar.axiom;
  label.textContent = `Interpretando n=${state.currentStep} (${activeStr.length} símbolos)`;
  panelLeft.appendChild(label);

  const container = document.createElement('div');
  container.id = 'symbol-string';

  for (let i = 0; i < activeStr.length; i++) {
    const span = document.createElement('span');
    span.className = 'sym' + (i === state.currentSymbol ? ' active' : '');
    span.dataset.idx = i;
    span.textContent = activeStr[i];
    container.appendChild(span);
  }

  panelLeft.appendChild(container);

  if (state.currentSymbol >= 0) {
    const activeSpan = container.querySelector('.sym.active');
    if (activeSpan) activeSpan.scrollIntoView({ block: 'nearest' });
  }
}

function renderTurtleCanvas() {
  if (!state.turtleData) return;
  syncCanvasSize();
  drawUpToStep(state.turtleData, state.currentSymbol, canvas, !!state.grammar.fitCanvas);
}

function initTurtle() {
  const s = state.allStrings[state.currentStep] ?? state.grammar.axiom;
  state.turtleData = buildSteps(s, {
    angle: state.angle,
    stepLength: state.stepLength,
    angleDelta: state.angleDelta,
    stepLengthDelta: state.stepLengthDelta,
    seed: state.seed,
  });
  state.currentSymbol = -1;
  syncCanvasSize();
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  renderTurtlePanel();
}

function tickTurtle() {
  const total = state.turtleData.steps.length;
  if (state.currentSymbol >= total - 1) { stopAnim(); return; }
  state.currentSymbol++;
  const prev = panelLeft.querySelector('.sym.active');
  if (prev) prev.classList.remove('active');
  const next = panelLeft.querySelector(`.sym[data-idx="${state.currentSymbol}"]`);
  if (next) {
    next.classList.add('active');
    next.scrollIntoView({ block: 'nearest' });
  }
  renderTurtleCanvas();
}

function startTurtle() {
  if (state.currentSymbol >= (state.turtleData?.steps.length ?? 0) - 1) {
    state.currentSymbol = -1;
    renderTurtlePanel();
    syncCanvasSize();
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
  btnPlay.textContent = '■ Parar';
  btnPlay.classList.add('playing');
  state.animTimer = setInterval(tickTurtle, state.tickMs);
}

// ── Init ────────────────────────────────────────────────────────────
function populateSelect() {
  grammars.forEach((g, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = g.name;
    sel.appendChild(opt);
  });
}

function loadGrammar(index) {
  stopAnim();
  state.grammar    = grammars[index];
  state.angle      = state.grammar.angle;
  state.iterations = state.grammar.iterations;
  state.stepLength      = DEFAULTS.stepLength;
  state.stepLengthDelta = DEFAULTS.stepLengthDelta;
  state.angleDelta      = DEFAULTS.angleDelta;
  angleEl.value         = state.angle;
  itersEl.value         = state.iterations;
  stepLenEl.value       = state.stepLength;
  stepLenDeltaEl.value  = state.stepLengthDelta;
  angleDeltaEl.value    = state.angleDelta;
  customJsonEl.value = grammarToJson(state.grammar);
  validateGrammar(state.grammar);
  if (state.mode === 'grow') initGrow();
}

function applyCustomIfValid() {
  const text = customJsonEl.value.trim();
  if (!text) return;
  const result = parseCustomGrammar(text);
  if (result.error) {
    bannerMsg.textContent = result.error;
    bannerEl.hidden = false;
    return;
  }
  bannerEl.hidden = true;
  validateGrammar(result.grammar);
  stopAnim();
  state.grammar    = result.grammar;
  if (typeof result.grammar.angle === 'number') {
    state.angle   = result.grammar.angle;
    angleEl.value = state.angle;
  }
  if (typeof result.grammar.iterations === 'number') {
    state.iterations = Math.min(10, result.grammar.iterations);
    itersEl.value    = state.iterations;
  }
  if (state.mode === 'grow') initGrow();
}

// ── Events ───────────────────────────────────────────────────────────────────
let customDebounce = null;

sel.addEventListener('change', () => loadGrammar(+sel.value));

customJsonEl.addEventListener('input', () => {
  clearTimeout(customDebounce);
  customDebounce = setTimeout(applyCustomIfValid, 500);
});

btnPlay.addEventListener('click', () => {
  if (state.animTimer) { stopAnim(); return; }
  if (state.mode === 'grow')   startGrow();
  if (state.mode === 'turtle') startTurtle();
});

seedEl.addEventListener('change', () => {
  state.seed = Math.max(0, Math.floor(+seedEl.value));
  seedEl.value = state.seed;
  stopAnim();
  const stochastic = Object.values(state.grammar.rules).some(opts => opts.length > 1);
  if (stochastic) {
    // re-derivar con nueva semilla, pero mantener el paso actual
    state.allStrings = deriveAll(state.grammar.axiom, state.grammar.rules, state.iterations, state.seed);
  }
  if (state.mode === 'grow')   { renderGrowPanel(); renderGrowCanvas(); }
  if (state.mode === 'turtle') { stopAnim(); initTurtle(); }
});

function applyFps(fps) {
  const clamped = Math.max(1, Math.min(60, Math.round(fps)));
  state.tickMs = 1000 / clamped;
  speedEl.value = clamped;
  speedOutEl.textContent = clamped;
  if (state.animTimer) {
    clearInterval(state.animTimer);
    state.animTimer = setInterval(
      state.mode === 'grow' ? tickGrow : tickTurtle,
      state.tickMs
    );
  }
}

speedEl.addEventListener('input', () => applyFps(+speedEl.value));

angleEl.addEventListener('change', () => {
  state.angle = +angleEl.value;
  if (state.mode === 'grow')   renderGrowCanvas();
  if (state.mode === 'turtle') { stopAnim(); initTurtle(); }
});

stepLenEl.addEventListener('change', () => {
  state.stepLength = +stepLenEl.value;
  if (state.mode === 'grow')   renderGrowCanvas();
  if (state.mode === 'turtle') { stopAnim(); initTurtle(); }
});

stepLenDeltaEl.addEventListener('change', () => {
  state.stepLengthDelta = Math.max(0, +stepLenDeltaEl.value);
  if (state.mode === 'grow')   renderGrowCanvas();
  if (state.mode === 'turtle') { stopAnim(); initTurtle(); }
});

angleDeltaEl.addEventListener('change', () => {
  state.angleDelta = Math.max(0, +angleDeltaEl.value);
  if (state.mode === 'grow')   renderGrowCanvas();
  if (state.mode === 'turtle') { stopAnim(); initTurtle(); }
});

itersEl.addEventListener('change', () => {
  state.iterations = Math.min(10, Math.max(1, +itersEl.value));
  itersEl.value = state.iterations;
  stopAnim();
  if (state.mode === 'grow') initGrow();
});

panelLeft.addEventListener('click', e => {
  if (state.mode !== 'grow') return;
  const line = e.target.closest('.deriv-line');
  if (!line) return;
  stopAnim();
  state.currentStep = +line.dataset.step;
  renderGrowPanel();
  renderGrowCanvas();
});

window.addEventListener('resize', () => {
  if (state.mode === 'grow')   renderGrowCanvas();
  if (state.mode === 'turtle') renderTurtleCanvas();
});

btnGrow.addEventListener('click', () => {
  if (state.mode === 'grow') return;
  state.mode = 'grow';
  btnGrow.classList.add('active');
  btnTurtle.classList.remove('active');
  stopAnim();
  applyFps(FPS_DEFAULTS.grow);
  initGrow();
});

btnTurtle.addEventListener('click', () => {
  if (state.mode === 'turtle') return;
  state.mode = 'turtle';
  btnTurtle.classList.add('active');
  btnGrow.classList.remove('active');
  stopAnim();
  applyFps(FPS_DEFAULTS.turtle);
  initTurtle();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
populateSelect();
angleEl.value      = state.angle;
itersEl.value      = state.iterations;
seedEl.value       = state.seed;
customJsonEl.value = grammarToJson(state.grammar);
validateGrammar(state.grammar);
state.mode = 'grow';
syncCanvasSize();
initGrow();
