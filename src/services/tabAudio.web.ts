import { TabBeat } from "../data/guitarTabs";
const MIDI_OPEN = [64, 59, 55, 50, 45, 40];
let context: AudioContext | null = null;

export function canPlayTabAudio(): boolean {
  return typeof window !== "undefined" && Boolean(window.AudioContext);
}

export function playTabNote(note: TabBeat, seconds = 0.55): void {
  if (!canPlayTabAudio()) return;
  try {
    if (!context) context = new window.AudioContext();
    if (context.state === "suspended") void context.resume();
    const midi = MIDI_OPEN[note.string - 1] + note.fret;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    // Plucked-string approximation. Audio samples will be added later.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.013);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.16, seconds));
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + Math.max(0.16, seconds) + 0.02);
  } catch (error) {
    console.error("Tab preview audio error:", error);
  }
}
