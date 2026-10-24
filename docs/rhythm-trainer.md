# GuitarCompanion – Rhythm Trainer (demo P0)

This independent training page is available at `/practice/rhythm-trainer` and linked from the main Practice page as well as related Learning Path lessons.

## Demo features

- Metronome for **2/4, 3/4 and 4/4**.
- Tempo **40–180 BPM** (±5, plus presets 60/80/100/120).
- **7 curated patterns** in `src/data/rhythmPatterns.ts`; each uses 8th-note slots where D=downstroke, U=upstroke and null=rest.
- Optional **one-bar count-in**, click metronome with accented first beat, and synthesized strumming cues.
- Visual beat count and strum arrow guidance.
- Four-bar exercise with Start/Stop and completion message.
- Manual **Tap theo phách** feedback based on scheduled beat timestamps. On Web, **T** is an additional keyboard shortcut.
- **Four-bar summary:** beats matched out of all expected beats, missed beats, extra/out-of-window taps, average absolute timing offset on matched beats and a per-bar breakdown. A round with no taps is shown as *not scored*, not 0%.
- **Retry** at the same tempo or prepare a +5 BPM follow-up. This is an approximate input-timing score, *not* an AI or guitar-audio evaluation.
- Deep links from Learning Path: `?pattern=four-down&lesson=count-four` (and related lesson IDs).
- Signed-in users opening from a linked lesson can explicitly **Lưu kết quả vào bài học**. The lesson then displays the best TAP score and the number of saved rounds. It does not auto-complete the lesson's checklist or quiz.

## Platform support and limitations

- **Expo Web:** click/metronome/strum cue audio uses a scheduled Web Audio oscillator (`src/services/rhythmEngine.web.ts`). Start playback with a user click to satisfy browser autoplay restrictions.
- **Android/iOS:** `src/services/rhythmEngine.ts` plays short local PCM/WAV assets using the installed `expo-audio` SDK 57 package, with accented first beat and optional down/up cues. Clips are generated with `node scripts/generate-rhythm-audio.mjs`. No microphone, background playback permission, or AI is required.
- Mobile timer-triggered playback is **best effort**, not sample-accurate; verify latency and sound on physical devices.
- Tick UI and Tap evaluation are subject to browser rendering/input delays; they are not calibrated latency measurements. Timing window = min(160 ms, one quarter of a beat), and each beat can match at most one tap.
- Result percentage = matched beats / (all expected beats + extra/out-of-window taps). Both missed beats and excess taps lower the score; repeated tapping cannot inflate it.
- These exercises have no microphone analysis or AI scoring. A guest can complete a round without signing in. Firestore is only written when an authenticated user explicitly saves a scored TAP round linked from Learning Path.
- Storage reuses `users/{uid}/learningProgress/{lessonId}` with `rhythmLastScore`, `rhythmBestScore`, `rhythmAttempts`, `rhythmLastBpm`, `rhythmLastPatternId`, `rhythmLastAtMs`. Existing `completed` status is preserved; otherwise the lesson becomes `in_progress`.
- Existing Learning Progress Rules must allow these fields. Stricter field-whitelisting rules may need an update in Firebase Console; no rule deployment was performed.
- The app's earlier guitar scores, chords, record and practice-history features remain unchanged.
- Before public release, the full app should still be checked on physical mobile devices, with real audio and keyboard focus tests.

## QA completed on MSI

- `npx tsc --noEmit` and `git diff --check`.
- `node --experimental-strip-types scripts/test-rhythm-scoring.mjs`: five scoring cases pass (no taps, perfect, misses, double tap, off-beat).
- Scoped ESLint for all Rhythm Trainer source files passes. Full-project `npx expo lint` is blocked by existing errors in unrelated screens.
- `npx expo export --platform web --output-dir .expo/rhythm-web-final` builds successfully with the platform-specific PDF viewer still on Web.
- `npx expo export --platform android --output-dir .expo/rhythm-android-qa-fixed` builds Hermes bytecode and packages all four WAV cues. To unblock Android, the Score route's explicit `PdfViewer.web` import was changed to platform-neutral `PdfViewer` and a TypeScript fallback module was added.
- `npx expo export --platform ios --output-dir .expo/rhythm-ios-qa` also builds Hermes bytecode and includes the WAV cues. These are bundler checks, not installed/played tests.
- `npx tsc --noEmit`, scoped ESLint for new code, and five rhythm-scoring tests pass. Existing unrelated Lesson Detail hooks lint errors remain.
- Native playback latency and authenticated Firestore saves have **not** been verified on a real phone/account in this automation session.
- Edge E2E: select 3/4, choose 3/4 strumming, return to 4/4, pick pop pattern, change BPM, run and finish a 4-bar exercise, use TAP, and navigate from the Learning Path lesson.
- Edge responsive test: 390px viewport with no horizontal overflow and 2/4 selection works.
- Edge audio smoke test: Web Audio oscillators are scheduled after starting the metronome.

## Demo walkthrough

1. Open `http://localhost:8082/practice` → **Rhythm Trainer**.
2. Set 4/4, choose `Pop strumming D–DU–UDU` at 60 BPM.
3. Enable metronome and optionally strumming sounds.
4. Press **Bắt đầu luyện 4 ô nhịp**; follow the arrows. Press **TAP theo phách** (or keyboard **T** on Web) once per beat.
5. After four bars, inspect hit rate, misses, extra taps, average error and each bar; select **Tập lại** or **Tăng 5 BPM**. Try a round with no TAP to see the unscored state.
6. Open the linked course lesson `/learning-path/strumming-pattern`, launch its Rhythm Trainer, tap through four bars, and click **Lưu kết quả vào bài học** while signed in.
7. Return to Lesson Detail: see best TAP score and number of rounds, while the checkbox + quiz completion criteria remain unchanged.
8. On Android/iOS, enable clicks and D/U cues and test against a physical device's speaker/headphones.

Files: `src/app/(tabs)/practice/rhythm-trainer.tsx`, `src/app/learning-path/[id].tsx`, `src/services/learningProgressService.ts`, `src/data/rhythmPatterns.ts`, `src/data/rhythmScoring.ts`, `src/services/rhythmEngine.web.ts`, `src/services/rhythmEngine.ts`, `scripts/generate-rhythm-audio.mjs`, `assets/rhythm/*.wav`.
