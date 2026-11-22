// ===== Contrôles : clavier d'ordinateur, souris, écran tactile =====

// Mode jeu : quand il est actif (bouton « Mode jeu » de la barre d'outils), toutes les touches du clavier
// d'ordinateur sont désactivées sauf celles qui jouent des notes (KEY_MAP) et Espace (réverbération).
let keyboardLocked = false;
const REVERB_KEY_CODE = 'Space';   // touche qui bascule la réverbération (100 % <-> réglage de base)

function findNoteAt(x, y) {
  let found = null;
  for (const note of noteLayout) {
    if (note.isBlack && x >= note.x && x <= note.x + note.w && y <= blackH) {
      found = note;
      break;
    }
  }
  if (!found) {
    for (const note of noteLayout) {
      if (!note.isBlack && x >= note.x && x <= note.x + note.w) {
        found = note;
        break;
      }
    }
  }
  return found;
}

// Vrai si l'utilisateur est en train d'écrire dans un champ de texte (titre d'un enregistrement, etc.)
function isTypingInField(e) {
  const el = e.target;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  // Curseurs, cases a cocher, boutons... ne servent pas a ecrire : les touches restent des notes
  const nonText = ['range', 'checkbox', 'radio', 'button', 'color', 'file', 'submit'];
  if (tag === 'input') return !nonText.includes((el.type || '').toLowerCase());
  return tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

function initKeyboardControls() {
  const heldKeys = new Set();   // touches du clavier d'ordinateur actuellement enfoncées
  let mouseDown = false;
  let mouseCurrentMidi = null;

  // Relâche tout (changement d'onglet, perte du focus...) pour éviter les notes bloquées
  const releaseEverything = () => {
    heldKeys.forEach(m => onNoteOff(m));
    heldKeys.clear();
    if (mouseCurrentMidi != null) onNoteOff(mouseCurrentMidi);
    mouseCurrentMidi = null;
    mouseDown = false;
    for (const id in activeTouches) onNoteOff(activeTouches[id]);
    activeTouches = {};
  };
  window.addEventListener('blur', releaseEverything);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseEverything();
  });

  // ── Clavier d'ordinateur ──
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;   // raccourcis du navigateur : pas de notes
    if (isTypingInField(e)) return;                   // on tape du texte : pas de notes
    const midi = KEY_MAP[e.code];                     // position physique de la touche (voir KEY_MAP)
    if (midi == null) {
      // Espace : bascule la reverberation (100 % <-> reglage de base)
      if (e.code === REVERB_KEY_CODE) {
        e.preventDefault();
        if (typeof toggleReverbBoost === 'function') toggleReverbBoost();
      }
      return;
    }
    e.preventDefault();                               // evite les raccourcis du navigateur (ex. ' et / sous Firefox)
    if (heldKeys.has(midi)) return;
    heldKeys.add(midi);
    onNoteOn(midi, 80, 'keyboard');
  });

  document.addEventListener('keyup', e => {
    const midi = KEY_MAP[e.code];
    if (midi != null && heldKeys.delete(midi)) onNoteOff(midi);
    if (e.code === REVERB_KEY_CODE && !isTypingInField(e)) e.preventDefault();   // Espace ne doit pas "cliquer" sur un bouton
  });

  // ── Mode jeu : bloque toutes les autres touches ──
  // Ecouteur en capture (avant les autres). Passent : les touches qui jouent (KEY_MAP) et Espace, sans Ctrl/Alt/Meta.
  // La saisie dans un champ de texte (nom d'un enregistrement) reste possible.
  const blockOtherKeys = e => {
    if (!keyboardLocked) return;
    if (isTypingInField(e)) return;
    const hasModifier = e.ctrlKey || e.metaKey || e.altKey;
    const allowed = !hasModifier && (KEY_MAP[e.code] != null || e.code === REVERB_KEY_CODE);
    if (!allowed) e.preventDefault();
  };
  window.addEventListener('keydown', blockOtherKeys, true);
  window.addEventListener('keyup', blockOtherKeys, true);

  const lockBtn = document.getElementById('btn-kblock');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      keyboardLocked = !keyboardLocked;
      lockBtn.classList.toggle('active', keyboardLocked);
      lockBtn.textContent = keyboardLocked ? '⌨ Mode jeu : ON' : '⌨ Mode jeu';
      lockBtn.blur();   // le focus ne doit pas rester sur le bouton
    });
  }

  // ── Souris ──
  pianoCanvas.addEventListener('mousedown', e => {
    mouseDown = true;
    const rect = pianoCanvas.getBoundingClientRect();
    const note = findNoteAt(e.clientX - rect.left, e.clientY - rect.top);
    if (note) {
      mouseCurrentMidi = note.midi;
      onNoteOn(note.midi, 80, 'click');
    }
  });

  pianoCanvas.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    const rect = pianoCanvas.getBoundingClientRect();
    const note = findNoteAt(e.clientX - rect.left, e.clientY - rect.top);
    if (note && note.midi !== mouseCurrentMidi) {
      if (mouseCurrentMidi != null) onNoteOff(mouseCurrentMidi);
      mouseCurrentMidi = note.midi;
      onNoteOn(note.midi, 80, 'click');
    }
  });

  window.addEventListener('mouseup', () => {
    if (mouseCurrentMidi != null) onNoteOff(mouseCurrentMidi);
    mouseCurrentMidi = null;
    mouseDown = false;
  });

  pianoCanvas.addEventListener('mouseleave', () => {
    if (!mouseDown && mouseCurrentMidi != null) {
      onNoteOff(mouseCurrentMidi);
      mouseCurrentMidi = null;
    }
  });

  // ── Écran tactile ──
  pianoCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    [...e.changedTouches].forEach(t => {
      const rect = pianoCanvas.getBoundingClientRect();
      const note = findNoteAt(t.clientX - rect.left, t.clientY - rect.top);
      if (note) {
        activeTouches[t.identifier] = note.midi;
        onNoteOn(note.midi, 80, 'touch');
      }
    });
  }, { passive: false });

  pianoCanvas.addEventListener('touchmove', e => {
    e.preventDefault();
    [...e.changedTouches].forEach(t => {
      const rect = pianoCanvas.getBoundingClientRect();
      const note = findNoteAt(t.clientX - rect.left, t.clientY - rect.top);
      const prevMidi = activeTouches[t.identifier];
      if (note && note.midi !== prevMidi) {
        if (prevMidi != null) onNoteOff(prevMidi);
        activeTouches[t.identifier] = note.midi;
        onNoteOn(note.midi, 80, 'touch');
      }
    });
  }, { passive: false });

  const endTouch = e => {
    e.preventDefault();
    [...e.changedTouches].forEach(t => {
      const midi = activeTouches[t.identifier];
      if (midi != null) onNoteOff(midi);
      delete activeTouches[t.identifier];
    });
  };
  pianoCanvas.addEventListener('touchend', endTouch, { passive: false });
  pianoCanvas.addEventListener('touchcancel', endTouch, { passive: false });
}
