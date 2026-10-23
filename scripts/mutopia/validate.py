from xml.etree import ElementTree as ET
from collections import Counter,defaultdict
from pathlib import Path
import mido
ROOT=Path(__file__).resolve().parents[2]/"public"/"mutopia"
PITCH={"C":0,"D":2,"E":4,"F":5,"G":7,"A":9,"B":11}
def source(no):
    midi=mido.MidiFile(ROOT/f"carcassi-op60-{no}.mid")
    data=[];active=defaultdict(list)
    for track in midi.tracks:
        tick=0
        for m in track:
            tick+=m.time
            if m.type=="note_on" and m.velocity>0:active[(m.channel,m.note)].append(tick)
            elif m.type=="note_off" or (m.type=="note_on" and m.velocity==0):
                arr=active[(m.channel,m.note)]
                if arr:
                    start=arr.pop(0)
                    if tick>start:data.append((start,tick,m.note))
    return Counter(data),midi
def converted(no,midi):
    root=ET.parse(ROOT/f"carcassi-op60-{no}.musicxml").getroot()
    sig=next(x for t in midi.tracks for x in t if x.type=="time_signature")
    bar=int(midi.ticks_per_beat*sig.numerator*4/sig.denominator)
    notes=[];active={}
    for mi,measure in enumerate(root.findall(".//part/measure")):
        cursor=0;last=0
        for el in measure:
            if el.tag=="backup": cursor-=int(el.findtext("duration"));continue
            if el.tag!="note":continue
            dur=int(el.findtext("duration"))
            if el.find("chord") is None:start=cursor;cursor+=dur;last=start
            else:start=last
            pitch=el.find("pitch")
            if pitch is None:continue
            start+=mi*bar;end=start+dur
            note=(int(pitch.findtext("octave"))+1)*12+PITCH[pitch.findtext("step")]+int(pitch.findtext("alter","0"))
            ties={x.get("type") for x in el.findall("tie")}
            if "stop" in ties:
                key=(note,start)
                if key not in active:
                    raise AssertionError(f"Lost tie note {key} in Etude {no}")
                row=active.pop(key);row[1]=end
                if "start" in ties:active[(note,end)]=row
            else:
                row=[start,end,note];notes.append(row)
                if "start" in ties:active[(note,end)]=row
    if active:raise AssertionError("Open ties remain")
    return Counter(tuple(row) for row in notes)
for no in ("01","03","08"):
    a,midi=source(no); b=converted(no,midi)
    missing=sum((a-b).values());extra=sum((b-a).values())
    print(no,"SOURCE",sum(a.values()),"XML",sum(b.values()),"PITCH_START_END_EXACT",a==b,"MISSING",missing,"EXTRA",extra)
    assert a==b
print("ALL_THREE_MIDI_MUSICXML_FULL_NOTE_INTERVALS_VERIFIED")
