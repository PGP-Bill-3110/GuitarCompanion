"""Build note-and-time faithful practice MusicXML from Mutopia's LilyPond-generated MIDI.
Keeps onset, duration, pitch; groups simultaneous equal-length notes as chords.
Guitar editorial fingering/beam/ornaments from LilyPond do NOT survive MIDI.
Run validation against original MIDI before publishing.
"""
from pathlib import Path
from collections import defaultdict
from xml.etree.ElementTree import Element,SubElement,ElementTree,indent
from math import ceil
import mido

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/"public"/"mutopia"
OUT=SOURCE
PITCHES=("C","C","D","D","E","F","F","G","G","A","A","B")
ALTER=(0,1,0,1,0,0,1,0,1,0,1,0)
TYPE_LOOKUP={
    1536:("whole",False,False),1152:("half",True,False),768:("half",False,False),
    576:("quarter",True,False),384:("quarter",False,False),288:("eighth",True,False),
    256:("quarter",False,True),192:("eighth",False,False),
    144:("16th",True,False),128:("eighth",False,True),
    96:("16th",False,False),64:("16th",False,True),
    48:("32nd",False,False),32:("32nd",False,True),
}
def child(node,tag,text=None,**attrs):
    elem=SubElement(node,tag,attrs)
    if text is not None:elem.text=str(text)
    return elem
def event_data(midi):
    items=[]; open_notes=defaultdict(list)
    for track in midi.tracks:
        tick=0
        for msg in track:
            tick+=msg.time
            if msg.type=="note_on" and msg.velocity>0:open_notes[(msg.channel,msg.note)].append(tick)
            elif msg.type=="note_off" or (msg.type=="note_on" and msg.velocity==0):
                stack=open_notes[(msg.channel,msg.note)]
                if stack:
                    start=stack.pop(0)
                    if tick>start:items.append((start,tick,msg.note))
    if any(open_notes.values()):raise ValueError("Dangling notes")
    return sorted(items)
def partition(events):
    # Equal onset/end notes occupy one chord; otherwise each distinct tone allocated a voice.
    groups=defaultdict(list)
    for start,end,p in events:groups[(start,end)].append(p)
    events=sorted([(a,b,sorted(ps)) for (a,b),ps in groups.items()],key=lambda x:(x[0],-x[1]))
    voices=[]; ends=[]
    for start,end,notes in events:
        idx=next((i for i,e in enumerate(ends) if e<=start),None)
        if idx is None:idx=len(voices); voices.append([]); ends.append(0)
        voices[idx].append((start,end,notes)); ends[idx]=end
    return voices
def rhythm(node,ticks):
    child(node,"duration",ticks)
    # Accurate numeric duration governs playback. Type and time-mod improve notation.
    description=TYPE_LOOKUP.get(ticks)
    if description:
        t,dotted,triplet=description
        child(node,"type",t)
        if dotted:child(node,"dot")
        if triplet:
            tm=child(node,"time-modification")
            child(tm,"actual-notes",3)
            child(tm,"normal-notes",2)
    # Durations of other tick lengths are retained without an approximate incorrect note type.
def make(no):
    midi=mido.MidiFile(SOURCE/f"carcassi-op60-{no}.mid")
    if midi.ticks_per_beat!=384:raise ValueError("Unexpected time base")
    signature=next((x for t in midi.tracks for x in t if x.type=="time_signature"),None)
    numer,denom=(signature.numerator,signature.denominator) if signature else (4,4)
    measure_ticks=round(384*numer*4/denom)
    original=event_data(midi)
    voices=partition(original)
    ending=max(x[1] for x in original)
    measures=ceil(ending/measure_ticks)
    score=Element("score-partwise",version="4.0")
    wrk=child(score,"work");child(wrk,"work-title",f"Etude {int(no)}, Op. 60")
    child(score,"movement-title",f"Etude {int(no)}, Op. 60 (MIDI-based interactive practice edition)")
    ident=child(score,"identification");child(ident,"creator","Matteo Carcassi",type="composer")
    child(ident,"rights","Public Domain (Mutopia Project MIDI source). Educational MIDI-derived transcription; check original PDF for fingering/engraving.")
    plist=child(score,"part-list");sp=child(plist,"score-part",id="P1")
    child(sp,"part-name","Classical Guitar")
    inst=child(sp,"score-instrument",id="I1");child(inst,"instrument-name","Acoustic Guitar")
    midi_inst=child(sp,"midi-instrument",id="I1");child(midi_inst,"midi-channel",1);child(midi_inst,"midi-program",25)
    part=child(score,"part",id="P1")
    for measure_index in range(measures):
        start=measure_index*measure_ticks
        end=(measure_index+1)*measure_ticks
        measure=child(part,"measure",number=str(measure_index+1))
        if measure_index==0:
            attrs=child(measure,"attributes")
            child(attrs,"divisions",384)
            key=child(attrs,"key");child(key,"fifths",0)
            tm=child(attrs,"time");child(tm,"beats",numer);child(tm,"beat-type",denom)
            clef=child(attrs,"clef");child(clef,"sign","G");child(clef,"line",2);child(clef,"clef-octave-change",-1)
        for vi,voice in enumerate(voices,1):
            if vi>1:
                backup=child(measure,"backup");child(backup,"duration",measure_ticks)
            cursor=start
            for original_start,original_end,pitches in voice:
                a=max(start,original_start); b=min(end,original_end)
                if b<=a:continue
                if a>cursor:
                    rest=child(measure,"note");child(rest,"rest");rhythm(rest,a-cursor);child(rest,"voice",vi)
                for ni,p in enumerate(pitches):
                    note=child(measure,"note")
                    if ni:child(note,"chord")
                    pitch=child(note,"pitch");child(pitch,"step",PITCHES[p%12])
                    if ALTER[p%12]:child(pitch,"alter",1)
                    child(pitch,"octave",p//12-1)
                    rhythm(note,b-a);child(note,"voice",vi)
                    # Note can be split at a barline. Add playback ties to avoid reattack.
                    if original_start<start:child(note,"tie",type="stop")
                    if original_end>end:child(note,"tie",type="start")
                    if original_start<start or original_end>end:
                        notations=child(note,"notations")
                        if original_start<start:child(notations,"tied",type="stop")
                        if original_end>end:child(notations,"tied",type="start")
                cursor=b
            if cursor<end:
                rest=child(measure,"note");child(rest,"rest");rhythm(rest,end-cursor);child(rest,"voice",vi)
    indent(score)
    target=OUT/f"carcassi-op60-{no}.musicxml"
    ElementTree(score).write(target,encoding="utf-8",xml_declaration=True)
    print(no,"EVENTS",len(original),"VOICES",len(voices),"MEASURES",measures,"FILE",target.stat().st_size,flush=True)
for num in ("01","03","08"):make(num)
