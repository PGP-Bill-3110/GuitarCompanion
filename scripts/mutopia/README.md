# Mutopia Carcassi: Interactive MusicXML practice editions

Original source: Mutopia Project, Matteo Carcassi's Op. 60 études 1, 3 and 8. Refer to the individual source/attribution details in `public/mutopia/README.md`. Mutopia marks these three editions as Public Domain.

## What has been converted

The original LilyPond editions ship with MIDI rendered by LilyPond. Direct LilyPond → MusicXML processing with python-ly was attempted, but that converter added notes or shifted rhythm for these complex scores. Those unreliable outputs have **not** been published.

Instead, the checked workflow uses the Mutopia-distributed **MIDI** to generate MusicXML that conserves each MIDI note's pitch, onset, and duration, including notes sustained across bars. MusicXML can be loaded into alphaTab.

The outputs are:
- `public/mutopia/carcassi-op60-01.musicxml` — 339 MIDI notes, 43 measures, 4/4
- `public/mutopia/carcassi-op60-03.musicxml` — 276 MIDI notes, 24 measures, 4/4
- `public/mutopia/carcassi-op60-08.musicxml` — 183 MIDI notes, 24 measures, 2/4

Validation with `scripts/mutopia/validate.py` confirms the **exact same pitches, note-on timestamps and note-off timestamps** as the original MIDI, including ties crossing measure boundaries. Each piece also successfully rendered through alphaTab in Microsoft Edge and inside Expo Web.

## Limitations

This is a **MIDI-derived practice transcription**, not an engraving-equivalent MusicXML conversion of the LilyPond source. MIDI lacks several notation details such as precise fingering, voice grouping, stems/beams, slurs, performance directions, and editorial symbols. The converter assigns voices mechanically to preserve sustained notes and timing. Always consult the associated PDF for authentic notation, fingers, and phrasing.

Some divisions use triplet timing. Playback and timing are matched to the source MIDI, but visual engraving of the interactive edition is not claimed identical to the PDF. It is appropriate for note-following practice, not as a master engraving source.

## Reproduce

Install once in a separate Python environment:

```powershell
python -m pip install mido
```

Then from `C:\GuitarCompanion`:

```powershell
python scripts\mutopia\convert.py
python scripts\mutopia\validate.py
```

Do not publish newly converted pieces without checking their source license and running the validation. Regeneration will overwrite the generated three MusicXML files.

## Personal library (IndexedDB)

In Practice → Guitar Tabs / Sheet Music → alphaTab Studio, use "Nhập file" to import a MusicXML, MXL, Guitar Pro, or alphaTex score (up to 15 MB). After alphaTab parses it successfully, the file is saved locally to IndexedDB. Use **Mở** and **Xóa** in "Thư viện của tôi" to access it again later.

Storage is isolated by **browser profile and origin** (including host and port): `http://localhost:8081` and `http://localhost:8082` do not share IndexedDB. No personal files are sent to Firebase or FastAPI. Private browsing, clearing browser data, or changing devices can remove access to this local library.

No Firestore Security Rules change is required for IndexedDB or static Mutopia media.
