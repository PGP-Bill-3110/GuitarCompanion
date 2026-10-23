(function (global) {
  "use strict";
  const MAX_SECONDS = 180;
  const MAX_EVENTS = 1500;
  const QUARTER = 960;
  function createMidiData(score, trackIndex) {
    if (!global.alphaTab || !score?.tracks?.[trackIndex]) throw new Error("Track không hợp lệ");
    const chosen=score.tracks[trackIndex];
    if (chosen.playbackInfo?.primaryChannel===9 || /drum|percussion|trống/i.test(chosen.name||""))
      throw new Error("Không chấm track trống như guitar");
    const notes=[],tempos=[];
    const handler={
      addTimeSignature(){},addRest(){},addControlChange(){},addProgramChange(){},
      addNoteBend(){},addBend(){},finishTrack(){},addTickShift(){},
      addTempo(tick,tempo){if(Number.isFinite(tick)&&Number.isFinite(tempo)&&tempo>0)tempos.push({tick,tempo});},
      addNote(track,start,length,key){
        if(track===trackIndex&&Number.isInteger(key)&&Number.isFinite(start)&&Number.isFinite(length)&&length>0)
          notes.push({tick:start,ticks:length,midi:key});
      }
    };
    const gen=new alphaTab.midi.MidiFileGenerator(score,new alphaTab.Settings(),handler);
    gen.generate();
    const bars=gen.tickLookup.masterBars.map(m=>({bar:m.masterBar.index+1,startTick:m.start,endTick:m.end}));
    if(!bars.length)throw new Error("Không đọc được ô nhịp");
    const ordered=tempos.sort((a,b)=>a.tick-b.tick);
    const changes=[{tick:0,tempo:Number(score.tempo)>0?Number(score.tempo):120}];
    for(const change of ordered){
      if(change.tick<0)continue;
      if(changes[changes.length-1].tick===change.tick)changes[changes.length-1].tempo=change.tempo;
      else changes.push(change);
    }
    function secondsAt(tick){
      let sec=0,last=0,bpm=changes[0].tempo;
      for(let i=1;i<changes.length;i++){
        const step=changes[i];if(step.tick>tick)break;
        sec+=(step.tick-last)/QUARTER*60/bpm;last=step.tick;bpm=step.tempo;
      }
      return sec+(tick-last)/QUARTER*60/bpm;
    }
    return {notes,bars,changes,secondsAt,baseBpm:changes[0].tempo,
      trackName:chosen.name||("Track "+(trackIndex+1)),trackIndex};
  }
  function getBarCount(score){
    if(!score?.masterBars?.length)return 0;
    return score.masterBars.length;
  }
  function getSectionBounds(data,startBar,endBar){
    if(!Number.isInteger(startBar)||!Number.isInteger(endBar)||
       startBar<1||endBar<startBar)throw new Error("Khoảng ô nhịp không hợp lệ");
    // Use the first performed occurrence of the requested starting bar.
    const begin=data.bars.findIndex(b=>b.bar===startBar);
    if(begin<0)throw new Error("Ô nhịp bắt đầu không có trong đường phát");
    // Only consecutive display-order bars are supported; other repeat structures are ambiguous.
    let finish=begin;
    for(let logical=startBar+1;logical<=endBar;logical++){
      if(data.bars[finish+1]?.bar!==logical)
        throw new Error("Đoạn giao với repeat/jump phức tạp. Chọn khoảng ngắn hơn.");
      finish++;
    }
    const from=data.bars[begin].startTick,to=data.bars[finish].endTick;
    if(!(to>from))throw new Error("Thời lượng đoạn không hợp lệ");
    return {startTick:from,endTick:to,startBar,endBar};
  }
  function getPlaybackBounds(score,trackIndex,section) {
    const data=createMidiData(score,trackIndex);
    const totalBars=getBarCount(score);
    return getSectionBounds(data,section?.startBar??1,section?.endBar??Math.min(4,totalBars));
  }
  function extract(score,trackIndex,section){
    const data=createMidiData(score,trackIndex);
    const totalBars=getBarCount(score);
    const fromBar=section?.startBar??1;
    const toBar=section?.endBar??Math.min(totalBars,4);
    if(toBar>totalBars)throw new Error("Ô nhịp kết thúc vượt số ô của bản nhạc");
    const bounds=getSectionBounds(data,fromBar,toBar);
    const t0=data.secondsAt(bounds.startTick);
    const t1=data.secondsAt(bounds.endTick);
    const length=t1-t0;
    if(length>MAX_SECONDS+0.01)throw new Error("Đoạn dài quá 180 giây. Hãy chọn ít ô nhịp hơn.");
    const selected=data.notes
      .filter(n=>n.tick>=bounds.startTick&&n.tick<bounds.endTick&&n.midi>=40&&n.midi<=88)
      .map(n=>{
        const start=data.secondsAt(n.tick)-t0;
        const end=data.secondsAt(Math.min(n.tick+n.ticks,bounds.endTick))-t0;
        return {midi:n.midi,startTime:Math.max(0,Math.round(start*1000)/1000),
          duration:Math.max(0.001,Math.round((end-start)*1000)/1000)};
      })
      .sort((a,b)=>a.startTime-b.startTime||a.midi-b.midi);
    if(!selected.length)throw new Error("Không có nốt guitar hợp lệ trong đoạn đã chọn");
    if(selected.length>MAX_EVENTS)throw new Error("Đoạn có quá 1.500 nốt, hãy thu hẹp khoảng ô");
    return {...bounds,notes:selected,baseBpm:data.baseBpm,bpm:data.baseBpm,
      trackIndex,trackName:data.trackName,durationSeconds:Math.round(length*1000)/1000,
      totalNotes:data.notes.length,noteCount:selected.length,
      polyphonic:new Set(selected.map(n=>n.startTime.toFixed(2))).size<selected.length,
      changingTempo:data.changes.length>1,totalBars};
  }
  global.GuitarCompanionScoreExtractor={extract,getPlaybackBounds,getBarCount,MAX_SECONDS};
})(window);
