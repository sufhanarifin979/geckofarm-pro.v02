// Web Audio API Bell Synthesizer
// Produces a crisp, pleasant single-ring bell chime with zero external audio assets.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
  }
  return audioCtx;
}

export type SoundPreset = 'bell' | 'chime' | 'soft' | 'crystal' | 'digital' | 'marimba' | 'pop' | 'zen';

export interface SoundPresetInfo {
  id: SoundPreset;
  label: string;
  desc: string;
}

export const SOUND_PRESETS: SoundPresetInfo[] = [
  { id: 'bell', label: 'Bel Klasik', desc: 'Dentang jernih bel resepsi' },
  { id: 'chime', label: 'Chime Halus', desc: 'Dua nada melodis lembut' },
  { id: 'soft', label: 'Soft Ping', desc: 'Ping minimalis kalem' },
  { id: 'crystal', label: 'Crystal Ting', desc: 'Dentang lonceng kaca berkilau' },
  { id: 'digital', label: 'Digital Beep', desc: 'Nada elektronik modern jernih' },
  { id: 'marimba', label: 'Marimba Warm', desc: 'Ketukan kayu resonansi hangat' },
  { id: 'pop', label: 'Bubble Pop', desc: 'Bunyi letupan tetesan air' },
  { id: 'zen', label: 'Zen Bowl', desc: 'Mangkuk harmoni meditatif' },
];

/**
 * Plays a short, pleasant notification sound ("bel sekali bunyi").
 * @param volume 0 to 1
 * @param preset Choice from SOUND_PRESETS
 */
export function playNotificationSound(volume: number = 0.7, preset: SoundPreset = 'bell'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    const safeVolume = Math.max(0.01, Math.min(1, volume));

    if (preset === 'bell') {
      // Crisp metallic desk bell (880Hz / A5 + 1760Hz shimmer)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const bellGain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now);

      bellGain.gain.setValueAtTime(safeVolume * 0.75, now);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc1.connect(bellGain);
      osc2.connect(bellGain);
      bellGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } else if (preset === 'chime') {
      // Gentle two-tone chime (D6 -> G6)
      const osc = ctx.createOscillator();
      const chimeGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1174.66, now);
      osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12);

      chimeGain.gain.setValueAtTime(safeVolume * 0.65, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(chimeGain);
      chimeGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.6);
    } else if (preset === 'crystal') {
      // High-pitched crystal glass chime (2093Hz C7 + 3136Hz G7)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const crystalGain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2093, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3136, now);

      crystalGain.gain.setValueAtTime(safeVolume * 0.55, now);
      crystalGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc1.connect(crystalGain);
      osc2.connect(crystalGain);
      crystalGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } else if (preset === 'digital') {
      // Crisp modern digital blip
      const osc = ctx.createOscillator();
      const digGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      digGain.gain.setValueAtTime(safeVolume * 0.6, now);
      digGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(digGain);
      digGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.4);
    } else if (preset === 'marimba') {
      // Warm marimba/wood resonance (523.25Hz C5 -> 659.25Hz E5)
      const osc = ctx.createOscillator();
      const marimbaGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);

      marimbaGain.gain.setValueAtTime(safeVolume * 0.8, now);
      marimbaGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(marimbaGain);
      marimbaGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.5);
    } else if (preset === 'pop') {
      // Bubble / drop pop (frequency sweep down)
      const osc = ctx.createOscillator();
      const popGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

      popGain.gain.setValueAtTime(safeVolume * 0.7, now);
      popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(popGain);
      popGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } else if (preset === 'zen') {
      // Tibetan bell / singing bowl (harmonic warmth: 587Hz D5 + 1174Hz D6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const zenGain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now);

      zenGain.gain.setValueAtTime(safeVolume * 0.6, now);
      zenGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      osc1.connect(zenGain);
      osc2.connect(zenGain);
      zenGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } else {
      // Soft gentle ping (1046.5Hz C6)
      const osc = ctx.createOscillator();
      const softGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);

      softGain.gain.setValueAtTime(safeVolume * 0.5, now);
      softGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(softGain);
      softGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (err) {
    console.warn('Audio playback encountered an issue:', err);
  }
}
