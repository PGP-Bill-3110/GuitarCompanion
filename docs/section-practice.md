# Section Practice – GuitarCompanion

## Implementation (23/10/2026)

Practice → Guitar Tabs / Sheet Music → alphaTab Studio now offers a selected **start and end measure** for one selected instrument track. The default selection is bars 1–4.

- AlphaTab MIDI generation provides the performed timeline of measures as MIDI ticks. The player uses `playbackRange={startTick,endTick}`, `isLooping`, `countInVolume`, and `metronomeVolume`.
- Changing the start/end measures and pressing **Áp dụng đoạn** regenerates the note reference for **only that range**, relative to the start of the selection. The reference is saved in IndexedDB under `sourceId|track=N|bars=A-B`; other sections remain stored.
- References are limited to **180 seconds** at original tempo and **1,500 notes**, to avoid unbounded AI requests. A longer valid range remains playable with Loop, but its AI score is disabled until the range is reduced.
- Scores with a complex repeat/jump traversal that does not follow sequential measure numbers are rejected for the chosen range, rather than incorrectly claiming to compare a mismatched performance.
- Starting a Practice Session freezes the currently selected range, track and BPM and disables score-editing controls until the session is saved.
- Practice History stores `startBar`, `endBar`, `trackIndex`, `sourceId`, `exerciseId` and `bpm` in the **existing** Firestore `users/{uid}/practiceSessions` documents. The session detail can reopen the saved track and section via alphaTab's URL.
- Review → Record → Analyze loads the corresponding IndexedDB reference and sends `audio`, `scoreJson` including `durationSeconds`, and practice `bpm` to FastAPI. The backend matches detected notes by MIDI pitch and relative onset, scaled for the selected practice tempo.

## Important limitations

- The Audio Recorder is on **Review this session**, after saving the timed Practice Session. It is not yet a synchronized live recorder integrated with the alphaTab transport. Basic Pitch comparison aligns the first detected note and first expected note, rather than performing beat-accurate synchronization with the alphaTab player.
- Count-in and metronome apply to alphaTab playback. Mute alphaTab audio while recording the acoustic guitar to prevent bleed into the microphone.
- The score is **experimental**, especially with polyphonic chords, repeated notes, harmonics, and loud accompaniment.
- Only **one track per practice session** is graded, with notes in MIDI range 40–88. Percussion is excluded.
- A complex repeat/jump can block reference creation for a selected range. Select another contiguous section.
- IndexedDB score files and references are **browser/origin-specific**; localhost:8081 and localhost:8082 are separate.
- A selected section longer than 180 seconds remains playable but is not AI-scorable.
- The current evaluation does not paint per-note correctness overlays directly onto alphaTab; Visual AI Feedback is a later enhancement.
- No Firestore Security Rules change is necessary: the existing owner-scoped practiceSessions collection remains in use.

## Manual validation

1. Open `http://localhost:8082/practice` → Sheet Music → Carcassi Etude 1 → alphaTab.
2. Verify track selection and choose bars 5–8, then Apply. Play/Pause, Loop, Count-in and Metronome work within the selected range.
3. Set tempo to 75% and start Practice. Changing track, bars or tempo should be disabled until Finish & Save.
4. Open Review this session and confirm its title, bar range and BPM; use **Mở lại bản nhạc trong alphaTab** to return to the same section.
5. Record a performance of exactly that section, without the alphaTab backing audio, and Analyze Recording.
6. Confirm note/timing metrics appear in Practice History. Tests with real guitar recordings and Firestore still require a signed-in user.

## Engineering checks

- `npx tsc --noEmit`
- `python -m py_compile backend/services/dynamic_score.py`
- `git diff --check`
- Browser E2E: `test_section_practice.cjs`, `test_section_expo.cjs`, `test_gp_section.cjs` and `test_section_lock.cjs`, located in the auxiliary local test directory `C:\GuitarCompanion_conversion_tools`.
- Backend section-reference synthetic tests are located in the same directory.
