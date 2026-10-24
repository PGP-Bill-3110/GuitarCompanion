import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { RhythmPattern } from "../data/rhythmPatterns";

export interface RhythmTick {
  slot: number;
  beat: number;
  bar: number;
  /** Wall-clock time of the visual tick, used for approximate manual TAP scoring. */
  wallTime: number;
}

export interface RhythmEngineOptions {
  bpm: number;
  pattern: RhythmPattern;
  countIn: boolean;
  audibleMetronome: boolean;
  audibleStrums: boolean;
  onTick: (tick: RhythmTick) => void;
  onCountIn?: (remaining: number) => void;
}

export interface RhythmEngineHandle {
  stop: () => void;
}

// Native playback uses short, locally generated PCM/WAV assets.
// The .web.ts engine continues to use Web Audio's lookahead scheduler.
const CUES = {
  accent: require("../../assets/rhythm/accent.wav"),
  click: require("../../assets/rhythm/click.wav"),
  down: require("../../assets/rhythm/down.wav"),
  up: require("../../assets/rhythm/up.wav"),
};

export function rhythmAudioSupported(): boolean { return true; }

/** Best-effort native audio + visual beat clock, not sample-accurate scheduling. */
export function startRhythmEngine(opts: RhythmEngineOptions): RhythmEngineHandle {
  const players = {
    accent: createAudioPlayer(CUES.accent),
    click: createAudioPlayer(CUES.click),
    down: createAudioPlayer(CUES.down),
    up: createAudioPlayer(CUES.up),
  };
  void setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
    console.warn("Rhythm audio mode unavailable:", error);
  });

  const { pattern, bpm } = opts;
  const slotMs = 30_000 / bpm;
  const countInSlots = opts.countIn ? pattern.meter * 2 : 0;
  let index = -countInSlots;
  let stopped = false;
  // Allow enough time for local short audio clips to begin loading.
  let nextTime = Date.now() + 240;
  let pending: ReturnType<typeof setTimeout> | null = null;

  const playCue = (cue: keyof typeof players) => {
    const player = players[cue];
    // Rewind first so repeated clicks work reliably with the same player.
    void player.seekTo(0).then(() => {
      if (stopped) return;
      try { player.play(); }
      catch (error) { console.warn("Rhythm cue playback failed:", error); }
    }).catch((error) => {
      if (!stopped) console.warn("Rhythm cue could not seek:", error);
    });
  };

  const step = () => {
    if (stopped) return;
    const current = index++;
    if (current < 0) {
      if (current % 2 === 0) {
        opts.onCountIn?.(Math.ceil(-current / 2));
        playCue(current === -countInSlots ? "accent" : "click");
      }
    } else {
      const slot = current % pattern.steps.length;
      const beat = Math.floor(slot / 2) + 1;
      const bar = Math.floor(current / pattern.steps.length) + 1;
      if (slot % 2 === 0 && opts.audibleMetronome) {
        playCue(beat === 1 ? "accent" : "click");
      }
      const stroke = pattern.steps[slot];
      if (stroke && opts.audibleStrums) playCue(stroke === "U" ? "up" : "down");
      opts.onTick({ slot, beat, bar, wallTime: nextTime });
    }
    nextTime += slotMs;
    pending = setTimeout(step, Math.max(0, nextTime - Date.now()));
  };

  pending = setTimeout(step, Math.max(0, nextTime - Date.now()));
  return {
    stop: () => {
      stopped = true;
      if (pending) clearTimeout(pending);
      Object.values(players).forEach((player) => player.release());
    },
  };
}
