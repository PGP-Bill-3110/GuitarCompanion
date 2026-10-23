import type { GuitarChordPosition } from "../data/chordLibrary";

let audio: AudioContext | null = null;
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];

export function canPlayChordAudio() {
  return typeof window !== "undefined" && typeof window.AudioContext !== "undefined";
}

export function playGuitarChord(position: GuitarChordPosition) {
  if (!canPlayChordAudio()) return false;
  try {
    audio ||= new window.AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const base = Math.max(1, position.baseFret || 1);
    let played = 0;
    position.frets.forEach((fret, string) => {
      if (fret < 0) return;
      const midi = OPEN_MIDI[string] + (fret === 0 ? 0 : base + fret - 1);
      const start = audio!.currentTime + played * 0.052;
      played++;
      const osc = audio!.createOscillator();
      const harmonic = audio!.createOscillator();
      const volume = audio!.createGain();
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      osc.type = "triangle";
      osc.frequency.value = frequency;
      harmonic.type = "sine";
      harmonic.frequency.value = frequency * 2;
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(0.10, start + 0.01);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 1.5);
      osc.connect(volume);
      harmonic.connect(volume);
      volume.connect(audio!.destination);
      osc.start(start); harmonic.start(start);
      osc.stop(start + 1.52); harmonic.stop(start + 1.52);
    });
    return played > 0;
  } catch (error) {
    console.error("Chord audio playback:", error);
    return false;
  }
}
