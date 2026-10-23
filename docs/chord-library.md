# Interactive Chord Library — GuitarCompanion

## Data source and license

- Source: [tombatossals/chords-db](https://github.com/tombatossals/chords-db) by David Rubert
- Package: `@tombatossals/chords-db@0.5.1`
- License: **MIT**. Preserve original copyright and license in `src/data/chord-licenses/chords-db-MIT.txt`.
- Vendor snapshot: `src/data/guitarChords.json` (the `lib/guitar.json` dataset from the package).
- Data coverage confirmed on 23 Oct 2026: **12 guitar keys; 63 named chord suffix types; 529 chord entries; 2,069 fingerings/voicings**.
- Source records store arrays of relative frets (with `-1` for muted strings and `0` for open strings), finger numbers, `baseFret`, and barre positions.

Do not state that the data includes *every mathematically possible chord or inversion*: this is an extensive practical library, and certain rarer voicings can still be absent.

## User experience

Open `/practice/chord-library` from the Practice page. Search a chord symbol (e.g. `C`, `Am`, `F#m7`, `G7`, `Dsus4`); filter by root and quality; inspect fretboard with 6 strings, finger labels, muted and open strings; switch voicings; and press **Nghe hợp âm** for synthesized Web Audio playback. A default list of 22 beginner-focused chord names avoids overwhelming new learners.

`/practice/chord-library?chord=Em` opens directly with Em selected. The lesson-detail pages for Em/Am, C/G, D/E/A and related progression lessons contain a context link; chord-song details also link to the library.

## Platform and demo limitations

- Chord diagrams, search, voicings and filtering use Expo/React Native components and display on web or native.
- Audio preview currently uses browser Web Audio synthesis (simple guitar-like tones); audio preview is **not yet implemented for native mobile builds**, and is not a recorded guitar sample.
- Finger placements depend on the original library data; a handful of unusual shapes may be difficult for beginners. Showing the 22 beginner chords first is intentional.
- Initial Chords tab remains a **song/lyrics list**, distinct from this new interactive chord-voicing library.
- This feature works entirely with static assets and does not write to Firestore: **no Firestore Security Rules change is required**.

## Verification

- `npx tsc --noEmit`
- `git diff --check`
- Database audit: all 529 entries / 2069 fingerings have 6 fret and finger values and the 22 featured names exist.
- Edge web tests: search `F#m7`, choose a non-default voicing, direct deep-link to `Em`, click Web Audio playback, navigate from an Em/Am lesson to chord library, and check the Practice entry.
- 390px mobile-sized Edge layout: no horizontal body overflow.

## Future demo refinement

Use this Library as the foundation for an independent Rhythm Trainer. Avoid spending time expanding chord voicings or writing advanced AI chord detection for the MVP.
