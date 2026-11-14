// ===== Sons de piano (samples) =====
// Samples : Salamander Grand Piano, hébergés par le projet Tone.js.
// Un enregistrement existe toutes les 3 touches environ : les notes intermédiaires
// sont obtenues en accélérant ou ralentissant légèrement l'échantillon le plus proche.
// Tant que les samples ne sont pas chargés (ou si internet est coupé), l'ancien son
// synthétique (playNoteOscillator, défini dans index.html) sert de secours.

const SAMPLE_BASE_URL = 'https://tonejs.github.io/audio/salamander/';
const SAMPLE_NOTES = [
  'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4',
  'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7'
];

const pianoSamples = [];   // { midi, buffer }
let pianoSamplesLoading = false;

// "Ds4" -> 63 (Ré# 4), "A1" -> 33
function sampleNameToMidi(name) {
  const m = /^([A-G])(s?)(\d)$/.exec(name);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  return (parseInt(m[3], 10) + 1) * 12 + base + (m[2] ? 1 : 0);
}

async function loadPianoSamples() {
  if (pianoSamplesLoading || !audioContext) return;
  pianoSamplesLoading = true;

  const statusEl = document.getElementById('status');
  if (statusEl && statusEl.textContent === 'Prêt') {
    statusEl.textContent = '🎹 Chargement des sons de piano…';
  }

  // On charge d'abord les notes du milieu du clavier
  const queue = SAMPLE_NOTES.slice().sort(
    (a, b) => Math.abs(sampleNameToMidi(a) - 60) - Math.abs(sampleNameToMidi(b) - 60)
  );

  const worker = async () => {
    while (queue.length > 0) {
      const name = queue.shift();
      try {
        const res = await fetch(SAMPLE_BASE_URL + name + '.mp3');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(data);
        pianoSamples.push({ midi: sampleNameToMidi(name), buffer });
      } catch (err) {
        console.warn('Sample ' + name + ' non chargé :', err);
      }
    }
  };

  // 4 téléchargements en parallèle
  await Promise.all([worker(), worker(), worker(), worker()]);

  if (statusEl && statusEl.textContent.startsWith('🎹 Chargement')) {
    statusEl.textContent = pianoSamples.length > 0
      ? '🎹 Sons de piano prêts'
      : '⚠️ Sons de piano indisponibles (son de secours utilisé)';
  }
  if (pianoSamples.length === 0) pianoSamplesLoading = false; // on pourra réessayer
}

function findNearestSample(midi) {
  let best = null;
  let bestDist = Infinity;
  for (const s of pianoSamples) {
    const d = Math.abs(s.midi - midi);
    if (d < bestDist) { best = s; bestDist = d; }
  }
  return best;
}

// Remplace la version de index.html : joue un vrai son de piano si possible
function playNote(midi, velocity = 80) {
  ensureAudioContext();
  if (!audioContext || audioContext.state !== 'running') return;

  const sample = findNearestSample(midi);
  if (!sample) {
    playNoteOscillator(midi, velocity); // samples pas encore prêts
    return;
  }

  stopNote(midi); // évite les doublons sur la même touche

  const now = audioContext.currentTime;
  const volume = Math.max(0.05, Math.min(velocity / 127, 1));

  const source = audioContext.createBufferSource();
  source.buffer = sample.buffer;
  source.playbackRate.value = Math.pow(2, (midi - sample.midi) / 12);

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(volume, now);

  source.connect(gain);
  gain.connect(masterGain);
  source.start(now);

  // Même structure que les voix synthétiques : stopNote() fonctionne pour les deux
  activeVoices.set(midi, { oscillator: source, gain: gain });
}
