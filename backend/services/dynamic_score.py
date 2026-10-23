"""Bounded, exploratory MIDI-event scoring for alphaTab-imported MusicXML/Guitar Pro.

This is a single selected guitar track, first 60 seconds. Not engraving accuracy.
Do not use score for a full symphonic arrangement or absolute skill evaluation.
"""
from __future__ import annotations
import json
from math import isfinite
from collections import defaultdict
from fastapi import HTTPException

MAX_NOTES = 1500
MAX_SECONDS = 180
MAX_JSON_BYTES = 240_000

def parse_reference(raw: str) -> dict:
    if len(raw.encode("utf-8")) > MAX_JSON_BYTES:
        raise HTTPException(status_code=413, detail="Score reference too large")
    try:
        data = json.loads(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Invalid score reference JSON")
    if not isinstance(data, dict):
        raise HTTPException(status_code=422, detail="Score reference must be an object")
    notes = data.get("notes")
    original_tempo = data.get("bpm")
    if not isinstance(notes, list) or not 1 <= len(notes) <= MAX_NOTES:
        raise HTTPException(status_code=422, detail="Reference must include 1..1500 notes")
    if isinstance(original_tempo, bool) or not isinstance(original_tempo, (float,int)) or not isfinite(original_tempo) or not 20 <= original_tempo <= 300:
        raise HTTPException(status_code=422, detail="Invalid reference BPM")
    clip_seconds=data.get("durationSeconds", 60)
    if type(clip_seconds) not in (int,float) or not isfinite(clip_seconds) or not 0 < clip_seconds <= MAX_SECONDS:
        raise HTTPException(status_code=422, detail="Invalid section duration")
    cleaned = []
    for note in notes:
        if not isinstance(note,dict):
            raise HTTPException(status_code=422, detail="Invalid note event")
        pitch, onset, duration = note.get("midi"), note.get("startTime"), note.get("duration")
        if type(pitch) is not int or not 40 <= pitch <= 88:
            raise HTTPException(status_code=422, detail="Expected note outside guitar MIDI range")
        if any(type(value) not in (int,float) or not isfinite(value) for value in (onset,duration)):
            raise HTTPException(status_code=422, detail="Invalid reference timestamp")
        if not 0 <= onset < clip_seconds or not 0 < duration <= MAX_SECONDS:
            raise HTTPException(status_code=422, detail="Invalid note duration or time")
        cleaned.append({"midi":pitch,"startTime":float(onset),"duration":float(duration)})
    cleaned.sort(key=lambda n:(n["startTime"],n["midi"]))
    return {"notes":cleaned,"bpm":float(original_tempo),
            "durationSeconds":float(clip_seconds),"title":str(data.get("title","Score"))[:180],
            "trackName":str(data.get("trackName","Guitar"))[:80]}

def score_reference(reference:dict, detected:list[dict], practice_bpm:float|None=None) -> dict:
    original_bpm = reference["bpm"]
    if practice_bpm is not None:
        if not isfinite(practice_bpm) or practice_bpm < 20 or practice_bpm > 300:
            raise HTTPException(status_code=422, detail="BPM must be 20..300")
    bpm = practice_bpm or original_bpm
    scale = original_bpm / bpm
    expected = reference["notes"]
    # Consistent with the legacy score: anchor onset at the first played note.
    first_expected = expected[0]["startTime"]
    expected_rel = [(n["startTime"]-first_expected)*scale for n in expected]
    # Trim to chosen excerpt, discount detected events beyond the reference performance.
    duration = max(0, reference.get("durationSeconds", 60)-first_expected)*scale
    relevant=[]
    for n in detected:
        if "startTime" not in n or "midi" not in n: continue
        try:
            pitch=int(n["midi"]);start=float(n["startTime"])
        except (ValueError,TypeError):continue
        if not isfinite(start) or not 40 <= pitch <= 88:continue
        relevant.append({"midi":pitch,"startTime":start})
    relevant.sort(key=lambda n:n["startTime"])
    first_recorded=relevant[0]["startTime"] if relevant else 0.0
    relevant=[(n["midi"],n["startTime"]-first_recorded) for n in relevant
              if -0.1<=n["startTime"]-first_recorded<=duration+0.5]
    # Onset tolerance scales with the selected BPM, bounded for sensible scores.
    tolerance = max(0.17,min(0.4, (60.0/bpm)*0.55))
    # Match each detected pitch to at most one not-yet-matched expected note.
    # Greedy matching is a heuristic; repeated notes and chords remain experimental.
    by_pitch=defaultdict(list)
    for i,n in enumerate(expected):by_pitch[n["midi"]].append(i)
    used=set(); errors=[]
    for pitch,t in relevant:
        options=[i for i in by_pitch.get(pitch,[]) if i not in used and abs(expected_rel[i]-t)<=tolerance]
        if not options: continue
        i=min(options,key=lambda idx:abs(expected_rel[idx]-t))
        used.add(i)
        errors.append(abs(expected_rel[i]-t))
    correct=len(errors)
    missed=len(expected)-correct
    extra=len(relevant)-correct
    note_accuracy=round(100*correct/max(len(expected),len(relevant),1),1)
    precision=round(sum(max(0,1-e/tolerance) for e in errors)*100/len(errors),1) if errors else 0.0
    timing_score=round(precision*correct/len(expected),1)
    overall=round((note_accuracy+timing_score)/2,1)
    return {"overallScore":overall, "noteAccuracy":note_accuracy,
            "timingScore":timing_score,"correct":correct,"wrong":0,
            "missed":missed,"extra":extra,
            "meanTimingErrorMs":round(sum(errors)/len(errors)*1000,1) if errors else None,
            "early":0,"late":0,"onTime":sum(e<=0.1*60/bpm for e in errors),
            "expectedCount":len(expected),"detectedCount":len(relevant),
            "mode":"score-reference-experimental","targetBpm":bpm,
            "matchingToleranceMs":round(tolerance*1000)}
