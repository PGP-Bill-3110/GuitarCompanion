import chordsData from "./guitarChords.json";

export interface GuitarChordPosition {
  frets: number[];
  fingers: number[];
  baseFret?: number;
  barres?: number[];
  capo?: boolean;
  midi?: number[];
}
export interface GuitarChord {
  key: string;
  suffix: string;
  positions: GuitarChordPosition[];
}
type ChordsData = {
  keys: string[];
  suffixes: string[];
  chords: Record<string, GuitarChord[]>;
  tunings: Record<string, string[]>;
};
const data = chordsData as ChordsData;

export const guitarChordRoots = data.keys;
export const guitarChordSuffixes = data.suffixes;

export const featuredChordNames = [
  "C", "G", "D", "A", "E", "F", "Am", "Em", "Dm", "Bm",
  "G7", "C7", "D7", "E7", "A7", "Cmaj7", "Am7", "Em7",
  "Dsus4", "Asus2", "Cadd9", "Fmaj7",
];

export function formatChordName(chord: GuitarChord) {
  if (chord.suffix === "major") return chord.key;
  if (chord.suffix === "minor") return chord.key + "m";
  return chord.key + chord.suffix;
}

export const allGuitarChords: GuitarChord[] = Object.values(data.chords)
  .flat()
  .filter((item) => Array.isArray(item.positions) && item.positions.length > 0);

const byName = new Map<string, GuitarChord>();
for (const chord of allGuitarChords) {
  byName.set(formatChordName(chord).toLowerCase(), chord);
}
const enharmonicAliases: Record<string, string> = {
  "db": "c#", "d#": "eb", "gb": "f#", "g#": "ab", "a#": "bb",
};
export function getGuitarChord(name: string | null | undefined) {
  if (!name) return undefined;
  const normalized = name.trim().replace(/\s+/g, "").toLowerCase();
  const match = normalized.match(/^([a-g](?:#|b)?)(.*)$/);
  if (!match) return undefined;
  const root = enharmonicAliases[match[1]] || match[1];
  const suffix = match[2] === "maj" ? "" : match[2] === "min" ? "m" : match[2];
  return byName.get(root + suffix);
}
export const beginnerChordNames = featuredChordNames
  .filter((name) => getGuitarChord(name));
export function orderedPositions(chord: GuitarChord) {
  return [...chord.positions].sort((a, b) => {
    const rank = (p: GuitarChordPosition) => {
      const base = Math.max(1, p.baseFret || 1);
      const muted = p.frets.filter((f) => f < 0).length;
      const open = p.frets.filter((f) => f === 0).length;
      const barres = p.barres?.length || 0;
      const max = Math.max(0, ...p.frets);
      return (base - 1) * 15 + muted * 1.2 + barres * 3 + max - open * 1.3;
    };
    return rank(a) - rank(b);
  });
}

export const chordPositionCount = allGuitarChords.reduce(
  (total, chord) => total + chord.positions.length, 0
);
export const chordLibrarySource = {
  name: "tombatossals/chords-db",
  license: "MIT",
  author: "David Rubert",
  repo: "https://github.com/tombatossals/chords-db",
} as const;
