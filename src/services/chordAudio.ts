import type { GuitarChordPosition } from "../data/chordLibrary";

// Audio synthesis is currently web-only. Chord diagrams remain available on native.
export function canPlayChordAudio() { return false; }
export function playGuitarChord(_position: GuitarChordPosition) { return false; }
