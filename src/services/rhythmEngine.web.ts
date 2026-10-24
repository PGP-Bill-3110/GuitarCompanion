import type { RhythmEngineHandle, RhythmEngineOptions } from "./rhythmEngine";

let audioContext: AudioContext | null = null;

export function rhythmAudioSupported(): boolean {
  return typeof window !== "undefined" && typeof window.AudioContext !== "undefined";
}

function playClick(context: AudioContext, when: number, accent: boolean) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(accent ? 1450 : 1050, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.21 : 0.12, when + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(when);
  osc.stop(when + 0.08);
}
function playStrum(context: AudioContext, when: number, up: boolean) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(up ? 560 : 390, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.055, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.085);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(when);
  osc.stop(when + 0.09);
}

/** Web Audio lookahead scheduler; tick UI uses the same audio clock. */
export function startRhythmEngine(opts: RhythmEngineOptions): RhythmEngineHandle {
  if (!rhythmAudioSupported()) throw new Error("Web Audio không khả dụng");
  if (!audioContext) audioContext = new window.AudioContext();
  const context = audioContext;
  void context.resume();
  const slotSeconds = 30 / opts.bpm;
  const countInSlots = opts.countIn ? opts.pattern.meter * 2 : 0;
  const firstWhen = context.currentTime + 0.14;
  let slotIndex = -countInSlots;
  let nextWhen = firstWhen;
  let stopped = false;
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  const scheduleTimer = (handler: () => void, when: number) => {
    const delay = Math.max(0, (when - context.currentTime) * 1000);
    const timer = setTimeout(() => { timeouts.delete(timer); if (!stopped) handler(); }, delay);
    timeouts.add(timer);
  };
  const schedule = () => {
    if (stopped) return;
    while (nextWhen < context.currentTime + 0.115) {
      const n = slotIndex++;
      const when = nextWhen;
      if (n < 0) {
        if (n % 2 === 0) {
          playClick(context, when, n === -countInSlots);
          scheduleTimer(() => opts.onCountIn?.(Math.ceil(-n / 2)), when);
        }
      } else {
        const slot = n % opts.pattern.steps.length;
        const beat = Math.floor(slot / 2) + 1;
        const bar = Math.floor(n / opts.pattern.steps.length) + 1;
        if (slot % 2 === 0 && opts.audibleMetronome) playClick(context, when, beat === 1);
        const strum = opts.pattern.steps[slot];
        if (strum && opts.audibleStrums) playStrum(context, when, strum === "U");
        const wallTime = Date.now() + (when - context.currentTime) * 1000;
        scheduleTimer(() => opts.onTick({slot, beat, bar, wallTime}), when);
      }
      nextWhen += slotSeconds;
    }
  };
  schedule();
  const interval = setInterval(schedule, 25);
  return {
    stop: () => {
      stopped = true;
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      // Oscillators scheduled in the short lookahead window finish naturally.
    }
  };
}
