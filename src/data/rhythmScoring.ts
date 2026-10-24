/** Simple manual-tap timing feedback for the four-bar Rhythm Trainer demo.
 * Uses scheduled beat timestamps, not render times. It does not analyze guitar audio.
 */
export interface RhythmTapSummary {
  taps: number;
  hits: number;
  missed: number;
  extras: number;
  totalBeats: number;
  score: number | null;
  averageErrorMs: number | null;
  byBar: number[];
  lastTapOffsetMs: number | null;
  lastTapMatched: boolean;
}

export function evaluateRhythmTaps(
  tapTimes: number[],
  firstBeatAt: number,
  bpm: number,
  meter: number,
  bars: number,
): RhythmTapSummary {
  const totalBeats = meter * bars;
  const beatMs = 60000 / bpm;
  const toleranceMs = Math.min(160, beatMs * 0.25);
  const closest = new Map<number, { error: number; offset: number; tapIndex: number }>();
  let lastTapOffsetMs: number | null = null;

  tapTimes.forEach((tapTime, tapIndex) => {
    const beatIndex = Math.round((tapTime - firstBeatAt) / beatMs);
    if (beatIndex < 0 || beatIndex >= totalBeats) return;
    const offset = tapTime - (firstBeatAt + beatIndex * beatMs);
    if (tapIndex === tapTimes.length - 1) lastTapOffsetMs = Math.round(offset);
    const error = Math.abs(offset);
    if (error > toleranceMs) return;

    const previous = closest.get(beatIndex);
    if (!previous || error < previous.error) {
      closest.set(beatIndex, { error, offset, tapIndex });
    }
  });

  const byBar = Array.from({ length: bars }, () => 0);
  let sumError = 0;
  let lastTapMatched = false;
  closest.forEach((match, beatIndex) => {
    byBar[Math.floor(beatIndex / meter)]++;
    sumError += match.error;
    if (match.tapIndex === tapTimes.length - 1) lastTapMatched = true;
  });

  const hits = closest.size;
  return {
    taps: tapTimes.length,
    hits,
    missed: totalBeats - hits,
    extras: tapTimes.length - hits,
    totalBeats,
    // Extra taps also lower accuracy; button-spamming cannot yield 100%.
    score: tapTimes.length ? Math.round((hits / (totalBeats + tapTimes.length - hits)) * 100) : null,
    averageErrorMs: hits ? Math.round(sumError / hits) : null,
    byBar,
    lastTapOffsetMs,
    lastTapMatched,
  };
}
