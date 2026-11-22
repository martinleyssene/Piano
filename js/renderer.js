// ===== Dessin du clavier, de la grille et placement des touches =====
// (Le dessin de l'éditeur de notes est dans index.html, avec le reste de l'éditeur.)

function buildLayout() {
  noteLayout = [];
  totalWhites = 0;
  for (let oct = START_OCTAVE; oct < START_OCTAVE + NUM_OCTAVES; oct++) {
    for (let n = 0; n < 12; n++) {
      const midi = (oct + 1) * 12 + n;
      const isBlack = [1, 3, 6, 8, 10].includes(n);
      noteLayout.push({ midi, isBlack, n, oct });
      if (!isBlack) totalWhites++;
    }
  }
  // Touche finale : le Do le plus aigu (C7), pour avoir les 61 touches du GO:PIANO (C2 à C7)
  noteLayout.push({ midi: (START_OCTAVE + NUM_OCTAVES + 1) * 12, isBlack: false, n: 0, oct: START_OCTAVE + NUM_OCTAVES });
  totalWhites++;
}

function resizeAll() {
  const pw = window.innerWidth;
  pianoCanvas.width = pw;
  pianoCanvas.height = PIANO_H;
  pianoCanvas.style.width = pw + 'px';
  pianoCanvas.style.height = PIANO_H + 'px';
  document.getElementById('piano-wrapper').style.height = PIANO_H + 'px';
  whiteW = pw / totalWhites;
  blackW = whiteW * 0.6;
  blackH = PIANO_H * 0.6;
  let wi = 0;
  for (const note of noteLayout) {
    if (!note.isBlack) {
      note.x = wi * whiteW;
      note.w = whiteW;
      wi++;
    }
  }
  for (let i = 0; i < noteLayout.length; i++) {
    const note = noteLayout[i];
    if (note.isBlack) {
      const prev = noteLayout[i - 1];
      note.x = prev.x + prev.w - blackW / 2;
      note.w = blackW;
    }
  }
  const fz = document.getElementById('fall-zone');
  gridCanvas.width = fz.offsetWidth;
  gridCanvas.height = fz.offsetHeight;
  drawGrid();
  drawPiano();
  repositionBlocks();
}

// Après un redimensionnement (rotation du téléphone, etc.) : replace les notes déjà affichées
function repositionBlocks() {
  const place = (el, midi) => {
    const note = noteLayout.find(n => n.midi === midi);
    if (!note || !el) return;
    el.style.left = (note.x + 2) + 'px';
    el.style.width = (note.w - 4) + 'px';
  };
  noteBlocks.forEach(b => place(b.el, b.midi));
  liveNotes.forEach(n => place(n.el, n.midi));
}

function drawGrid() {
  const W = gridCanvas.width;
  const H = gridCanvas.height;
  gridCtx.clearRect(0, 0, W, H);
  for (const note of noteLayout) {
    if (!note.isBlack) {
      gridCtx.strokeStyle = '#ffffff08';
      gridCtx.lineWidth = 1;
      gridCtx.beginPath();
      gridCtx.moveTo(note.x, 0);
      gridCtx.lineTo(note.x, H);
      gridCtx.stroke();
    }
    if (note.n === 0) {
      gridCtx.fillStyle = '#ffffff18';
      gridCtx.font = '11px monospace';
      gridCtx.fillText('C' + note.oct, note.x + 2, H - 6);
    }
  }
}

function drawPiano() {
  const ctx = pianoCtx;
  const W = pianoCanvas.width;
  const H = pianoCanvas.height;
  ctx.clearRect(0, 0, W, H);
  for (const note of noteLayout) {
    if (note.isBlack) continue;
    const on = activeKeys.has(note.midi);
    ctx.fillStyle = on ? '#ffe060' : '#f0f0f0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(note.x + 1, 0, note.w - 2, H - 2, [0, 0, 4, 4]);
    ctx.fill();
    ctx.stroke();
    if (note.n === 0) {
      ctx.fillStyle = on ? '#333' : '#999';
      ctx.font = `bold ${Math.max(9, whiteW * 0.45)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('C' + note.oct, note.x + note.w / 2, H - 8);
    }
  }
  for (const note of noteLayout) {
    if (!note.isBlack) continue;
    const on = activeKeys.has(note.midi);
    const grad = ctx.createLinearGradient(note.x, 0, note.x, blackH);
    if (on) {
      grad.addColorStop(0, '#ffd000');
      grad.addColorStop(1, '#997700');
    } else {
      grad.addColorStop(0, '#1a1a1a');
      grad.addColorStop(1, '#111');
    }
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(note.x, 0, note.w, blackH, [0, 0, 3, 3]);
    ctx.fill();
    ctx.stroke();
  }
}
