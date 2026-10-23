# alphaTab → Practice History → AI Feedback

**Current implementation:** See [Section Practice](./section-practice.md) for the current bar-range workflow, control settings, storage and limitations.

The previous initial implementation compared the first 60 seconds of a track. It has been superseded by **user-selected contiguous measures** (default bars 1–4), up to **180 seconds and 1,500 note events** per AI-scored section.

MusicXML, Guitar Pro and alphaTex are rendered by alphaTab. The MIDI generator creates a separate IndexedDB reference for each source ID, track and measure range, keyed as `sourceId|track=N|bars=A-B`.

The selected source, track index, start/end bars and practice BPM are saved in the existing Firestore `practiceSessions` document. Opening a saved session's score returns to the same section. After recording in **Review this session**, Basic Pitch notes are compared with the selected reference by pitch and relative onset.

Scores for chords and polyphonic playing remain experimental. Long sections beyond 180 seconds can still play and loop but do not receive an AI score until shortened. Audio recording is in Review, not yet recorded simultaneously with the alphaTab player.

Firestore Security Rules: **no change required** for the existing owner-scoped `practiceSessions` collection.
