const LENGTH_RATIO = 0.75;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isMayus(ch) {
  return ch >= 'A' && ch <= 'Z';
}

class Segment {
  constructor(x0, y0, x1, y1) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  }

  draw(ctx, px, py) {
    ctx.moveTo(px(this.x0), py(this.y0));
    ctx.lineTo(px(this.x1), py(this.y1));
  }
}

function calculateStep(x, y, heading, len) {
  return {
    nx: x + Math.cos(heading) * len,
    ny: y - Math.sin(heading) * len,
  };
}

function createCoordTransform(transform, canvas) {
  if (transform) {
    return {
      px: x => x * transform.scale + transform.offsetX,
      py: y => y * transform.scale + transform.offsetY,
    };
  }
  return {
    px: x => x + canvas.width / 2,
    py: y => y + canvas.height - 24,
  };
}

function getTransform(bounds, canvasW, canvasH, padding = 24) {
  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;
  const scale = Math.min(
    (canvasW - padding * 2) / w,
    (canvasH - padding * 2) / h
  );
  const offsetX = padding + (canvasW - padding * 2 - w * scale) / 2 - bounds.minX * scale;
  const offsetY = padding + (canvasH - padding * 2 - h * scale) / 2 - bounds.minY * scale;
  return { scale, offsetX, offsetY };
}

// ── String Parsing ──────────────────────────────────────────────────────────────────

function walkString(string, params, onSymbol) {
  const { angle: angleDeg, stepLength, angleDelta = 0, stepLengthDelta = 0, seed = 42 } = params;
  const angleRad = angleDeg * Math.PI / 180;
  const angleDeltaRad = angleDelta * Math.PI / 180;
  const rng = makeRng(seed);

  let x = 0, y = 0, heading = Math.PI / 2, len = stepLength;
  const stack = [];
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  let cutting = 0;
  let symbolIndex = 0;

  for (const ch of string) {
    const x0 = x, y0 = y;
    let x1 = x, y1 = y, draws = false;

    if (cutting > 0) {
      if (ch === '[') {
        cutting++;
      } else if (ch === ']') {
        cutting--;
        if (cutting === 0) { ({ x, y, heading, len } = stack.pop()); x1 = x; y1 = y; }
      }
      onSymbol(symbolIndex++, ch, x0, y0, x1, y1, false, heading);
      continue;
    }

    if (isMayus(ch)) {
      const actualLen = len + (rng() * 2 - 1) * stepLengthDelta;
      ({ nx: x1, ny: y1 } = calculateStep(x, y, heading, actualLen));
      draws = true;
      x = x1; y = y1;
    } else if (ch === 'f') {
      const actualLen = len + (rng() * 2 - 1) * stepLengthDelta;
      const { nx, ny } = calculateStep(x, y, heading, actualLen);
      x1 = nx; y1 = ny;
      x = nx; y = ny;
    } else if (ch === '+') {
      heading += angleRad + (rng() * 2 - 1) * angleDeltaRad;
    } else if (ch === '-') {
      heading -= angleRad + (rng() * 2 - 1) * angleDeltaRad;
    } else if (ch === '|') {
      heading += Math.PI;
    } else if (ch === '[') {
      stack.push({ x, y, heading, len });
      len *= LENGTH_RATIO;
      x1 = x; y1 = y;
    } else if (ch === ']') {
      ({ x, y, heading, len } = stack.pop());
      x1 = x; y1 = y;
    } else if (ch === '%') {
      if (stack.length > 0) cutting = 1;
    }

    onSymbol(symbolIndex++, ch, x0, y0, x1, y1, draws, heading);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }

  return { minX, maxX, minY, maxY };
}

function parsePath(string, params) {
  const segments = [];

  function onSymbol(_idx, _ch, x0, y0, x1, y1, draws) {
    if (draws) segments.push(new Segment(x0, y0, x1, y1));
  }

  const bounds = walkString(string, params, onSymbol);
  return { segments, bounds };
}

function buildSteps(string, params) {
  const steps = [];

  function onSymbol(symbolIndex, ch, x0, y0, x1, y1, draws, heading) {
    const segment = draws ? new Segment(x0, y0, x1, y1) : null;
    steps.push({ symbolIndex, symbol: ch, segment, x0, y0, x1, y1, heading });
  }

  const bounds = walkString(string, params, onSymbol);
  return { steps, bounds };
}

// ── Drawing ──────────────────────────────────────────────────────────────────

function drawHeadingArrow(ctx, cx, cy, heading) {
  const size = 10;
  const dx =  Math.cos(heading);
  const dy = -Math.sin(heading);
  const px = -dy, py = dx;
  const half = size * 0.4;

  ctx.fillStyle = '#4a90c4';
  ctx.beginPath();
  ctx.moveTo(cx + dx * size,          cy + dy * size);
  ctx.lineTo(cx - dx * half + px * half, cy - dy * half + py * half);
  ctx.lineTo(cx - dx * half - px * half, cy - dy * half - py * half);
  ctx.closePath();
  ctx.fill();
}

function draw(string, canvas, params) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { segments, bounds } = parsePath(string, params);

  const transform = params.fitCanvas ? getTransform(bounds, canvas.width, canvas.height) : null;
  const { px, py } = createCoordTransform(transform, canvas);

  ctx.strokeStyle = '#2d7a50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const s of segments) { s.draw(ctx, px, py); }
  ctx.stroke();
}

function drawUpToStep(stepsData, upTo, canvas, fitCanvas) {
  const { steps, bounds } = stepsData;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const transform = fitCanvas ? getTransform(bounds, canvas.width, canvas.height) : null;
  const { px, py } = createCoordTransform(transform, canvas);

  ctx.strokeStyle = '#2d7a50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < upTo; i++) {
    const s = steps[i];
    if (s.segment) s.segment.draw(ctx, px, py);
  }
  ctx.stroke();

  const currentStep = steps[upTo];
  if (!currentStep) return;

  if (currentStep.segment) {
    ctx.strokeStyle = '#c07840';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    currentStep.segment.draw(ctx, px, py);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#c07840';
    ctx.beginPath();
    ctx.arc(px(currentStep.x0), py(currentStep.y0), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHeadingArrow(ctx, px(currentStep.x1), py(currentStep.y1), currentStep.heading);
}
