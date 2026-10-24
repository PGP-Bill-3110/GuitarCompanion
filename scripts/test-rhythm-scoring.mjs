import assert from "node:assert/strict";
import { evaluateRhythmTaps } from "../src/data/rhythmScoring.ts";

const firstBeat = 1000;
const bpm = 60;
const meter = 4;
const bars = 4;
const score = taps => evaluateRhythmTaps(taps, firstBeat, bpm, meter, bars);

const empty = score([]);
assert.equal(empty.score, null);
assert.equal(empty.missed, 16);

const perfect = score(Array.from({ length: 16 }, (_, i) => firstBeat + i * 1000));
assert.equal(perfect.score, 100);
assert.equal(perfect.hits, 16);
assert.deepEqual(perfect.byBar, [4, 4, 4, 4]);
assert.equal(perfect.averageErrorMs, 0);

const sparse = score([1000, 2000, 3000, 4000]);
assert.equal(sparse.score, 25);
assert.equal(sparse.missed, 12);

const duplicate = score([1000, 1030, 2100]);
assert.equal(duplicate.hits, 2);
assert.equal(duplicate.extras, 1);
assert.equal(duplicate.score, 12);
assert.equal(duplicate.averageErrorMs, 50);

const offBeat = score([1200]);
assert.equal(offBeat.hits, 0);
assert.equal(offBeat.extras, 1);
assert.equal(offBeat.score, 0);

console.log("Rhythm scoring: 5 scenarios passed.");
