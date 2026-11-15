// ===== Instruments (sons) =====
// Sources des sons (téléchargés depuis internet, mémorisés ensuite sur l'appareil) :
//  - Salamander Grand Piano (Alexander Holm, licence CC BY 3.0), via tonejs.github.io
//  - FluidR3_GM (licence CC BY 3.0), via gleitz.github.io/midi-js-soundfonts
// Un enregistrement existe toutes les 3 touches environ : les notes intermédiaires
// sont obtenues en accélérant ou ralentissant légèrement l'échantillon le plus proche.
// Tant que l'instrument n'est pas chargé (ou sans internet), l'ancien son synthétique
// (playNoteOscillator, défini dans index.html) sert de secours.
//
// Limite : ces échantillons ont une durée fixe (quelques secondes). Une note tenue très
// longtemps sur un orgue, des cordes ou une flûte finira donc par s'éteindre.

const SALAMANDER_BASE_URL = 'https://tonejs.github.io/audio/salamander/';
const SALAMANDER_NOTES = [
  'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4',
  'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7'
];
const GM_BASE_URL = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';

// Un "part" = une banque de sons. Un instrument peut en superposer plusieurs (ex. piano + cordes).
const SAL = { kind: 'salamander', gain: 1 };
const GM = (name, gain = 1) => ({ kind: 'gm', name, gain });

// Les noms viennent de la liste des sons du GO:PIANO ; les sons sont des équivalents libres,
// pas les sons Roland (approchants, pas identiques).
const INSTRUMENT_DEFS = [
  // — Pianos —
  { id: 'grand',      group: 'Pianos', label: 'GO Grand (piano à queue)', parts: [SAL] },
  { id: 'bright',     group: 'Pianos', label: 'Bright Grand',   parts: [GM('bright_acoustic_piano')] },
  { id: 'european',   group: 'Pianos', label: 'European Pf',    parts: [GM('acoustic_grand_piano')] },
  { id: 'mellow',     group: 'Pianos', label: 'Mellow Grand',   parts: [SAL], lowpass: 2200 },
  { id: 'honky',      group: 'Pianos', label: 'Honky-Tonk',     parts: [GM('honkytonk_piano')] },
  { id: 'grand-str',  group: 'Pianos', label: 'GO Grand + Str', parts: [SAL, GM('string_ensemble_1', 0.45)] },
  { id: 'grand-pad',  group: 'Pianos', label: 'GO Grand + Pad', parts: [SAL, GM('pad_2_warm', 0.4)] },
  { id: 'harpsi',     group: 'Pianos', label: 'CoupleHarpsi (clavecin)', parts: [GM('harpsichord')] },
  // — Pianos électriques —
  { id: 'vintage-ep', group: 'Pianos électriques', label: 'Vintage EP',    parts: [GM('electric_piano_1')] },
  { id: 'trem-ep',    group: 'Pianos électriques', label: 'TremEP Stage',  parts: [GM('electric_piano_1')], tremolo: { rate: 5, depth: 0.5 } },
  { id: 'wurly',      group: 'Pianos électriques', label: 'Wurly Trem',    parts: [GM('electric_piano_1')], tremolo: { rate: 6.5, depth: 0.35 }, lowpass: 4500 },
  { id: 'fm-ep',      group: 'Pianos électriques', label: 'FM Chorus EP',  parts: [GM('electric_piano_2')] },
  { id: 'fantasia',   group: 'Pianos électriques', label: 'D50 Fantasia',  parts: [GM('pad_1_new_age')] },
  { id: 'clavi',      group: 'Pianos électriques', label: 'Clavi',         parts: [GM('clavinet')] },
  // — Orgues —
  { id: 'fulldraw',   group: 'Orgues', label: 'FullDraw Org',  parts: [GM('drawbar_organ')] },
  { id: 'fd-slow',    group: 'Orgues', label: 'FullDrawSlow',  parts: [GM('drawbar_organ')], tremolo: { rate: 1.2, depth: 0.3 } },
  { id: 'fd-fast',    group: 'Orgues', label: 'FullDrawFast',  parts: [GM('drawbar_organ')], tremolo: { rate: 6.5, depth: 0.3 } },
  { id: 'perc-org',   group: 'Orgues', label: 'Perc Organ',    parts: [GM('percussive_organ')] },
  { id: 'chapel',     group: 'Orgues', label: 'Chapel Organ',  parts: [GM('church_organ')] },
  { id: 'positive',   group: 'Orgues', label: 'Positive Org',  parts: [GM('reed_organ')] },
  { id: 'accordion',  group: 'Orgues', label: 'Accordion',     parts: [GM('accordion')] },
  // — Voix, cordes, cuivres, etc. —
  { id: 'voice-doo',  group: 'Autres', label: 'Voice Doo',     parts: [GM('voice_oohs')] },
  { id: 'choir',      group: 'Autres', label: 'Choir Aahs',    parts: [GM('choir_aahs')] },
  { id: 'strings',    group: 'Autres', label: 'Strings',       parts: [GM('string_ensemble_1')] },
  { id: 'violin',     group: 'Autres', label: 'Violin',        parts: [GM('violin')] },
  { id: 'flute',      group: 'Autres', label: 'Flute',         parts: [GM('flute')] },
  { id: 'trombone',   group: 'Autres', label: 'Trombone',      parts: [GM('trombone')] },
  { id: 'nylon',      group: 'Autres', label: 'SoftNyln Gtr',  parts: [GM('acoustic_guitar_nylon')] },
  { id: 'vibes',      group: 'Autres', label: 'Vibraphone',    parts: [GM('vibraphone')] },
  { id: 'saw',        group: 'Autres', label: 'Saw Lead',      parts: [GM('lead_2_sawtooth')] },
  { id: 'synpad',     group: 'Autres', label: 'Super SynPad',  parts: [GM('pad_3_polysynth')] },
  { id: 'brass',      group: 'Autres', label: 'Jump Brass',    parts: [GM('brass_section')] },
  { id: 'fingered',   group: 'Autres', label: 'Fingerd Bass',  parts: [GM('electric_bass_finger')], transpose: -12 },
  { id: 'acoustic-bass', group: 'Autres', label: 'AcousticBass', parts: [GM('acoustic_bass')], transpose: -12 },
];

let currentInstrumentId = 'grand';
try { currentInstrumentId = localStorage.getItem('piano_instrument') || 'grand'; } catch (e) {}
if (!INSTRUMENT_DEFS.some(d => d.id === currentInstrumentId)) currentInstrumentId = 'grand';

let activeInstrument = null;   // { def, parts: [{ samples, gain }], out, dispose }
let instrumentLoadToken = 0;
const partCache = new Map();   // clé de banque -> Promise des échantillons

// ---------- Utilitaires ----------

// "Ds4" -> 63, "Ab0" -> 20, "C#3" -> 49
function noteNameToMidi(name) {
  const m = /^([A-G])([sb#]?)(\d)$/.exec(name);
  if (!m) return null;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  const alt = (m[2] === 's' || m[2] === '#') ? 1 : (m[2] === 'b' ? -1 : 0);
  return (parseInt(m[3], 10) + 1) * 12 + base + alt;
}

// Télécharge un fichier et le mémorise sur l'appareil (Cache Storage) pour les fois suivantes.
async function cachedFetch(url) {
  let cache = null;
  try { if (window.caches) cache = await caches.open('piano-sons-v1'); } catch (e) {}
  if (cache) {
    try {
      const hit = await cache.match(url);
      if (hit) return hit;
    } catch (e) {}
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' pour ' + url);
  if (cache) {
    try { await cache.put(url, res.clone()); } catch (e) {}
  }
  return res;
}

function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// Exécute `tasks` (fonctions async) avec 4 en parallèle
async function runPool(tasks) {
  const queue = tasks.slice();
  const worker = async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      await task();
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}

// ---------- Chargement des banques de sons ----------

async function loadSalamander() {
  const samples = [];
  const names = SALAMANDER_NOTES.slice().sort(
    (a, b) => Math.abs(noteNameToMidi(a) - 60) - Math.abs(noteNameToMidi(b) - 60)
  );
  await runPool(names.map(name => async () => {
    try {
      const res = await cachedFetch(SALAMANDER_BASE_URL + name + '.mp3');
      const buffer = await audioContext.decodeAudioData(await res.arrayBuffer());
      samples.push({ midi: noteNameToMidi(name), buffer });
    } catch (err) {
      console.warn('Sample ' + name + ' non chargé :', err);
    }
  }));
  if (samples.length === 0) throw new Error('aucun fichier Salamander chargé');
  return samples;
}

async function loadGmPart(name) {
  const res = await cachedFetch(GM_BASE_URL + name + '-mp3.js');
  const text = await res.text();

  // Le fichier contient des lignes du genre :  "C4": "data:audio/mp3;base64,....."
  // On ne garde qu'une note sur trois (de A0 à C7) : le reste est obtenu par ajustement.
  const re = /"([A-G][b#]?\d)"\s*:\s*"data:audio\/[a-z0-9.+-]+;base64,([^"]+)"/g;
  const wanted = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const midi = noteNameToMidi(m[1]);
    if (midi !== null && midi >= 21 && midi <= 96 && midi % 3 === 0) {
      wanted.push({ midi, b64: m[2] });
    }
  }
  if (wanted.length === 0) throw new Error('format de fichier inattendu pour ' + name);

  const samples = [];
  await runPool(wanted.map(w => async () => {
    try {
      const buffer = await audioContext.decodeAudioData(base64ToArrayBuffer(w.b64));
      samples.push({ midi: w.midi, buffer });
    } catch (err) {
      console.warn('Note ' + w.midi + ' de ' + name + ' non décodée :', err);
    }
  }));
  if (samples.length === 0) throw new Error('aucune note décodée pour ' + name);
  return samples;
}

// Calcule un coefficient de volume pour que tous les instruments sonnent aussi fort :
// on mesure l'énergie moyenne de la première seconde des notes du milieu du clavier.
function loudnessGain(samples) {
  const TARGET_RMS = 0.09;
  let sum = 0;
  let count = 0;
  for (const s of samples) {
    if (s.midi < 36 || s.midi > 84) continue;
    const data = s.buffer.getChannelData(0);
    const n = Math.min(data.length, Math.floor(s.buffer.sampleRate));
    if (n === 0) continue;
    let acc = 0;
    for (let i = 0; i < n; i++) acc += data[i] * data[i];
    sum += acc / n;
    count++;
  }
  if (count === 0) return 1;
  const rms = Math.sqrt(sum / count);
  if (rms < 0.0001) return 1;
  return Math.max(0.2, Math.min(TARGET_RMS / rms, 6));
}

function loadSamplePart(part) {
  const key = part.kind === 'gm' ? 'gm:' + part.name : 'salamander';
  if (!partCache.has(key)) {
    const p = (part.kind === 'gm' ? loadGmPart(part.name) : loadSalamander())
      .then(samples => ({ samples, norm: loudnessGain(samples) }))
      .catch(err => { partCache.delete(key); throw err; });
    partCache.set(key, p);
  }
  return partCache.get(key);
}

// ---------- Effets (filtre, trémolo) ----------

function buildInstrumentOutput(def) {
  const input = audioContext.createGain();
  let last = input;
  let lfo = null;

  if (def.lowpass) {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = def.lowpass;
    filter.Q.value = 0.7;
    last.connect(filter);
    last = filter;
  }

  if (def.tremolo) {
    const trem = audioContext.createGain();
    trem.gain.value = 1 - def.tremolo.depth / 2;
    lfo = audioContext.createOscillator();
    lfo.frequency.value = def.tremolo.rate;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = def.tremolo.depth / 2;
    lfo.connect(lfoGain);
    lfoGain.connect(trem.gain);
    lfo.start();
    last.connect(trem);
    last = trem;
  }

  last.connect(masterGain);

  return {
    out: input,
    dispose: () => {
      try { if (lfo) lfo.stop(); } catch (e) {}
      try { input.disconnect(); } catch (e) {}
    }
  };
}

// ---------- Choix de l'instrument ----------

function showInstrumentStatus(text, force) {
  const el = document.getElementById('status');
  if (!el) return;
  const cur = el.textContent;
  if (force || cur === 'Prêt' || cur.startsWith('🎹') || cur.startsWith('⚠️ Son')) {
    el.textContent = text;
  }
}

async function setInstrument(id, userChoice) {
  const def = INSTRUMENT_DEFS.find(d => d.id === id) || INSTRUMENT_DEFS[0];
  currentInstrumentId = def.id;
  try { localStorage.setItem('piano_instrument', def.id); } catch (e) {}
  if (!audioContext) return; // le chargement se fera au premier toucher (ensureAudioContext)

  const token = ++instrumentLoadToken;
  showInstrumentStatus('🎹 Chargement : ' + def.label + '…', userChoice);
  try {
    const parts = [];
    for (const p of def.parts) {
      const loaded = await loadSamplePart(p);
      parts.push({ samples: loaded.samples, gain: (p.gain == null ? 1 : p.gain) * loaded.norm });
    }
    if (token !== instrumentLoadToken) return; // un autre choix a été fait entre-temps
    const old = activeInstrument;
    const chain = buildInstrumentOutput(def);
    activeInstrument = { def, parts, out: chain.out, dispose: chain.dispose };
    if (old) setTimeout(() => old.dispose(), 1500); // laisse finir les notes en cours
    showInstrumentStatus('🎹 ' + def.label + ' prêt', userChoice);
  } catch (err) {
    console.warn('Instrument ' + def.label + ' non chargé :', err);
    if (token === instrumentLoadToken) {
      showInstrumentStatus('⚠️ Son « ' + def.label + ' » indisponible (internet ?), ancien son conservé', true);
    }
  }
}

// Appelée par ensureAudioContext() (index.html) dès que le son est débloqué
function loadPianoSamples() {
  setInstrument(currentInstrumentId, false);
}

// Remplit le menu déroulant de la barre d'outils
function initInstrumentSelect() {
  const sel = document.getElementById('instrument-select');
  if (!sel) return;
  let lastGroup = '';
  let groupEl = null;
  INSTRUMENT_DEFS.forEach(def => {
    if (def.group !== lastGroup) {
      groupEl = document.createElement('optgroup');
      groupEl.label = def.group;
      sel.appendChild(groupEl);
      lastGroup = def.group;
    }
    const opt = document.createElement('option');
    opt.value = def.id;
    opt.textContent = def.label;
    groupEl.appendChild(opt);
  });
  sel.value = currentInstrumentId;
  sel.addEventListener('change', () => {
    ensureAudioContext();
    setInstrument(sel.value, true);
    sel.blur();
  });
}

// ---------- Jouer une note ----------

function findNearestSample(samples, midi) {
  let best = null;
  let bestDist = Infinity;
  for (const s of samples) {
    const d = Math.abs(s.midi - midi);
    if (d < bestDist) { best = s; bestDist = d; }
  }
  return best;
}

// Remplace la version de index.html : joue l'instrument choisi si possible
function playNote(midi, velocity = 80) {
  ensureAudioContext();
  if (!audioContext || audioContext.state !== 'running') return;

  const inst = activeInstrument;
  if (!inst) {
    playNoteOscillator(midi, velocity); // instrument pas encore prêt
    return;
  }

  stopNote(midi); // évite les doublons sur la même touche

  const now = audioContext.currentTime;
  const volume = Math.max(0.05, Math.min(velocity / 127, 1));

  const noteGain = audioContext.createGain();
  noteGain.gain.setValueAtTime(volume, now);
  noteGain.connect(inst.out);

  const sources = [];
  // Certains instruments (basses) sonnent une octave plus bas que la touche jouée
  const target = midi + (inst.def.transpose || 0);
  for (const part of inst.parts) {
    const sample = findNearestSample(part.samples, target);
    if (!sample) continue;
    const source = audioContext.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = Math.pow(2, (target - sample.midi) / 12);
    const partGain = audioContext.createGain();
    partGain.gain.value = part.gain;
    source.connect(partGain);
    partGain.connect(noteGain);
    source.start(now);
    sources.push(source);
  }

  if (sources.length === 0) {
    noteGain.disconnect();
    playNoteOscillator(midi, velocity);
    return;
  }

  // Même structure que les voix synthétiques : stopNote() fonctionne pour tout
  activeVoices.set(midi, {
    oscillator: { stop: t => sources.forEach(s => { try { s.stop(t); } catch (e) {} }) },
    gain: noteGain
  });
}
