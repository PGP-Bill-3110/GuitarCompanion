import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AppGradientBackground from "../../../components/ui/AppGradientBackground";
import { colors } from "../../../theme/colors";
import { beginnerRhythmLessons, patternsForMeter, rhythmPatterns, type RhythmMeter } from "../../../data/rhythmPatterns";
import { getLearningLesson } from "../../../data/learningPath";
import { useAuth } from "../../../context/AuthContext";
import { saveRhythmPractice } from "../../../services/learningProgressService";
import { evaluateRhythmTaps, type RhythmTapSummary } from "../../../data/rhythmScoring";
import { rhythmAudioSupported, startRhythmEngine, type RhythmEngineHandle } from "../../../services/rhythmEngine";

const METERS: RhythmMeter[] = [2, 3, 4];
const TARGET_BARS = 4;

export default function RhythmTrainer() {
  const params = useLocalSearchParams<{ pattern?: string; lesson?: string }>();
  const requested = Array.isArray(params.pattern) ? params.pattern[0] : params.pattern;
  const requestedLesson = Array.isArray(params.lesson) ? params.lesson[0] : params.lesson;
  const linkedLesson = requestedLesson && beginnerRhythmLessons[requestedLesson]
    ? getLearningLesson(requestedLesson) : undefined;
  const { user } = useAuth();
  const initial = rhythmPatterns.find(p => p.id === requested) || rhythmPatterns.find(p => p.id === "four-down")!;

  const [patternId, setPatternId] = useState(initial.id);
  const [meter, setMeter] = useState<RhythmMeter>(initial.meter);
  const [bpm, setBpm] = useState(60);
  const [countIn, setCountIn] = useState(true);
  const [clicks, setClicks] = useState(true);
  const [strums, setStrums] = useState(false);
  const [running, setRunning] = useState(false);
  const [slot, setSlot] = useState(-1);
  const [bar, setBar] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [taps, setTaps] = useState(0);
  const [goodTaps, setGoodTaps] = useState(0);
  const [tapFeedback, setTapFeedback] = useState("");
  const [result, setResult] = useState<RhythmTapSummary | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const engine = useRef<RhythmEngineHandle | null>(null);
  const firstBeatAt = useRef<number | null>(null);
  const tapTimes = useRef<number[]>([]);
  const saveInFlight = useRef(false);

  const pattern = rhythmPatterns.find(p=>p.id===patternId) || initial;
  const choices = useMemo(()=>patternsForMeter(meter),[meter]);
  const audioAvailable = rhythmAudioSupported();

  function stop() {
    engine.current?.stop();
    engine.current = null;
    setRunning(false);
    setCountdown(0);
    firstBeatAt.current = null;
  }

  useEffect(() => () => {engine.current?.stop();engine.current=null;},[]);

  function reset() {
    stop();
    setSlot(-1);
    setBar(0);
    setCompleted(false);
    setTaps(0);
    setGoodTaps(0);
    tapTimes.current = [];
    setResult(null);
    setSaved(false);
    setSaveError("");
    setTapFeedback("");
    setMessage("");
  }
  function changeMeter(next: RhythmMeter) {
    if (next===meter) return;
    reset();
    setMeter(next);
    setPatternId(patternsForMeter(next)[0].id);
  }
  function changePattern(next:string) {
    reset();
    setPatternId(next);
  }
  function changeTempo(next: number) {
    reset();
    setBpm(Math.max(40,Math.min(180,Math.round(next))));
  }
  function start() {
    if (running) {stop();return;}
    setCompleted(false);
    setSlot(-1);
    setBar(0);
    setCountdown(countIn?meter:0);
    setTaps(0);
    setGoodTaps(0);
    setTapFeedback("");
    setMessage("");
    tapTimes.current=[];
    firstBeatAt.current=null;
    setResult(null);
    setSaved(false);
    setSaveError("");
    try {
      engine.current=startRhythmEngine({
        bpm, pattern, countIn,
        audibleMetronome: clicks,
        audibleStrums: strums,
        onCountIn: remaining=>setCountdown(remaining),
        onTick: tick=>{
          setCountdown(0);
          setSlot(tick.slot);
          setBar(tick.bar);
          if(tick.bar===1 && tick.slot===0) firstBeatAt.current=tick.wallTime;
          if(tick.bar >= TARGET_BARS && tick.slot===pattern.steps.length-1){
            engine.current?.stop();
            engine.current=null;
            setRunning(false);
            setCompleted(true);
            const summary=evaluateRhythmTaps(tapTimes.current,firstBeatAt.current??tick.wallTime,bpm,meter,TARGET_BARS);
            setResult(summary);
            setMessage(summary.score===null
              ?"Bạn đã nghe đủ 4 ô nhịp. Hãy thử TAP ở lượt tiếp theo để nhận phản hồi."
              :summary.score>=85
                ?"Giữ phách tốt! Hãy thử tăng BPM thêm 5 để thử thách bản thân."
                :"Hãy luyện lại ở tốc độ chậm và gõ đều theo tiếng click.");
          }
        }
      });
      setRunning(true);
    } catch(err) {
      setRunning(false);
      setMessage("Không thể khởi động âm thanh/nhịp: "+String(err instanceof Error?err.message:err));
    }
  }
  async function saveResult() {
    if (!user || !linkedLesson || !result || result.score===null || saveInFlight.current || saved) return;
    saveInFlight.current = true;
    setSaving(true);
    setSaveError("");
    try {
      await saveRhythmPractice(user.uid, linkedLesson.id, {
        score: result.score, bpm, patternId,
      });
      setSaved(true);
    } catch (error) {
      console.error("Save Rhythm Trainer progress:", error);
      setSaveError("Không thể lưu vào Learning Path. Hãy kiểm tra kết nối và Firestore Rules.");
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  const tap = useCallback(() => {
    if(!running || countdown>0 || firstBeatAt.current===null)return;
    // Read the clock only in a user's TAP/keyboard event, never during render.
    // eslint-disable-next-line react-hooks/purity
    tapTimes.current.push(Date.now());
    const summary=evaluateRhythmTaps(tapTimes.current,firstBeatAt.current,bpm,meter,TARGET_BARS);
    setTaps(summary.taps);
    setGoodTaps(summary.hits);
    if(summary.lastTapMatched) {
      const offset=summary.lastTapOffsetMs??0;
      setTapFeedback(Math.abs(offset)<=35
        ?"Rất sát phách!"
        :offset<0?"Đúng phách, hơi sớm.":"Đúng phách, hơi muộn.");
    } else {
      setTapFeedback("Chưa trúng phách hoặc vừa gõ lặp. Hãy nghe click rồi thử tiếp.");
    }
  },[running,countdown,bpm,meter]);

  useEffect(() => {
    if (Platform.OS!=="web") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code!=="KeyT" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target=event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      tap();
    };
    window.addEventListener("keydown",onKeyDown);
    return () => window.removeEventListener("keydown",onKeyDown);
  },[tap]);

  return(
    <View style={styles.root}>
      <AppGradientBackground/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity accessibilityRole="button" style={styles.back} onPress={()=>router.back()}>
          <Ionicons name="arrow-back" size={19} color={colors.text}/>
          <Text style={styles.soft}>Trở về Practice</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>GUITARCOMPANION ACADEMY</Text>
        <Text style={styles.heading}>Rhythm Trainer</Text>
        <Text style={styles.description}>Luyện đếm phách, quạt chả xuống/lên và giữ nhịp với metronome. Mỗi lượt thực hành gồm 4 ô nhịp.</Text>

        <View style={styles.columns}>
          <View style={styles.card}>
            <View style={styles.cardHead}><Ionicons name="options-outline" size={22} color={colors.accent}/><Text style={styles.cardTitle}>Thiết lập bài tập</Text></View>
            <Text style={styles.label}>NHỊP</Text>
            <View style={styles.optionRow}>
              {METERS.map(m=><TouchableOpacity accessibilityRole="button"
                key={m} onPress={()=>changeMeter(m)}
                style={[styles.meterButton,meter===m&&styles.activeMeter]}>
                <Text style={[styles.meterLabel,meter===m&&styles.activeText]}>{m}/4</Text>
              </TouchableOpacity>)}
            </View>
            <Text style={styles.label}>MẪU GẢY</Text>
            <View style={styles.patternList}>
              {choices.map(p=><TouchableOpacity key={p.id} onPress={()=>changePattern(p.id)}
                accessibilityRole="button"
                style={[styles.patternCard,p.id===patternId&&styles.activePattern]}>
                <View style={{flex:1}}>
                  <Text style={styles.patternTitle}>{p.name}</Text>
                  <Text style={styles.patternSubtitle}>{p.description}</Text>
                </View>
                <Ionicons name={p.id===patternId?"checkmark-circle":"ellipse-outline"}
                  size={23} color={p.id===patternId?colors.accent:colors.textMuted}/>
              </TouchableOpacity>)}
            </View>
            <Text style={styles.label}>TEMPO</Text>
            <View style={styles.tempoRow}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Giảm 5 BPM" style={styles.tempoButton} onPress={()=>changeTempo(bpm-5)}>
                <Ionicons name="remove" color={colors.text} size={24}/>
              </TouchableOpacity>
              <View style={styles.tempoDisplay}><Text style={styles.bpmNumber}>{bpm}</Text><Text style={styles.bpmUnit}>BPM</Text></View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Tăng 5 BPM" style={styles.tempoButton} onPress={()=>changeTempo(bpm+5)}>
                <Ionicons name="add" color={colors.text} size={24}/>
              </TouchableOpacity>
            </View>
            <View style={styles.presets}>
              {[60,80,100,120].map(value=><TouchableOpacity key={value} style={[styles.preset,bpm===value&&styles.presetActive]} onPress={()=>changeTempo(value)}>
                <Text style={[styles.presetText,bpm===value&&styles.activeText]}>{value}</Text>
              </TouchableOpacity>)}
            </View>
            <Text style={styles.label}>ÂM THANH</Text>
            {[
              {title:"Đếm vào 1 ô nhịp",on:countIn,set:setCountIn},
              {title:"Click metronome",on:clicks,set:setClicks},
              {title:"Nghe mẫu D / U",on:strums,set:setStrums}
            ].map(option=><TouchableOpacity key={option.title} style={styles.toggleRow}
              onPress={()=>{reset();option.set(!option.on);}}>
              <Text style={styles.toggleLabel}>{option.title}</Text>
              <Ionicons name={option.on?"checkbox":"square-outline"} size={22}
                color={option.on?colors.accent:colors.textMuted}/>
            </TouchableOpacity>)}
            {!audioAvailable&&<Text style={styles.notice}>Âm thanh chưa khả dụng trên thiết bị này. Bạn vẫn có thể theo dõi nhịp bằng hình ảnh.</Text>}
            {Platform.OS!=="web"&&audioAvailable&&<Text style={styles.notice}>Mobile dùng WAV cục bộ; nhịp nghe có thể trễ nhẹ tùy thiết bị.</Text>}
          </View>
          <View style={styles.trainerCard}>
            <View style={styles.cardHead}><Ionicons name="timer-outline" size={22} color={colors.accent}/><Text style={styles.cardTitle}>Luyện theo nhịp</Text></View>
            <View style={styles.summaryRow}>
              <View style={{flex:1}}>
                <Text style={styles.exerciseName}>{pattern.name}</Text>
                <Text style={styles.soft}>{meter}/4 · {bpm} BPM · {TARGET_BARS} ô nhịp</Text>
              </View>
              <View style={styles.exerciseBadge}><Text style={styles.exerciseBadgeText}>{pattern.difficulty}</Text></View>
            </View>
            <Text style={styles.hint}>{pattern.hint}</Text>
            <View style={styles.visualPanel}>
              <View style={styles.beatRow}>
                {Array.from({length:meter},(_,i)=>{
                  const active=running&&countdown===0&&Math.floor(slot/2)===i;
                  return <View key={i} style={[styles.beatDot,active&&styles.activeDot,i===0&&styles.strongDot]}>
                    <Text style={[styles.beatNumber,active&&styles.activeText]}>{i+1}</Text>
                  </View>;
                })}
              </View>
              <Text style={styles.visualCaption}>{countdown>0?"Đếm vào: "+countdown:running?"Ô "+Math.min(bar,TARGET_BARS)+" / "+TARGET_BARS:completed?"Hoàn thành!":"Nhấn Bắt đầu để nghe nhịp"}</Text>
              <View style={styles.strumRow}>
                {pattern.steps.map((direction,i)=>{
                  const active=running&&countdown===0&&slot===i;
                  return <View key={i} style={[styles.strumStep,active&&styles.strumActive]}>
                    <Text style={styles.subdivision}>{i%2===0?String(i/2+1):"&"}</Text>
                    <Ionicons
                      name={direction==="D"?"arrow-down":direction==="U"?"arrow-up":"remove"}
                      size={22}
                      color={direction?active?"#FFFFFF":colors.accent:colors.textDim}/>
                    <Text style={[styles.strumLetter,active&&styles.activeText]}>{direction||"–"}</Text>
                  </View>;
                })}
              </View>
              <Text style={styles.legend}>D = gảy xuống · U = gảy lên · – = không gảy</Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={start} accessibilityRole="button">
              <Ionicons name={running?"stop-circle":"play-circle"} size={25} color="#FFFFFF"/>
              <Text style={styles.startLabel}>{running?"Dừng":"Bắt đầu luyện 4 ô nhịp"}</Text>
            </TouchableOpacity>
            <View style={styles.tapArea}>
              <Text style={styles.cardTitle}>Thử giữ phách</Text>
              <Text style={styles.soft}>Nhấn TAP ở mỗi phách theo tiếng click (trên web cũng có thể bấm phím T). Phản hồi là ước lượng thời gian, không phải điểm AI.</Text>
              <TouchableOpacity style={[styles.tapButton,!running&&styles.tapDisabled]}
                disabled={!running||countdown>0} accessibilityRole="button"
                onPress={tap}>
                <Ionicons name="hand-left-outline" color={colors.text} size={22}/>
                <Text style={styles.tapTitle}>TAP theo phách</Text>
              </TouchableOpacity>
              <View style={styles.tapSummary}>
                <Text style={styles.soft}>Lượt gõ: <Text style={styles.bold}>{taps}</Text></Text>
                <Text style={styles.soft}>Trúng phách: <Text style={styles.bold}>{goodTaps}</Text></Text>
              </View>
              {!!tapFeedback&&<Text style={styles.feedback}>{tapFeedback}</Text>}
            </View>
            {completed&&result&&<View style={styles.resultPanel}>
              <View style={styles.resultHeading}>
                <View style={{flex:1}}>
                  <Text style={styles.resultTitle}>Kết quả 4 ô nhịp</Text>
                  <Text style={styles.soft}>Độ chính xác TAP (có tính phách bỏ lỡ và gõ thừa)</Text>
                </View>
                <Text style={styles.resultScore}>{result.score===null?"—":result.score+"%"}</Text>
              </View>
              {result.score===null
                ?<Text style={styles.soft}>Bạn đã nghe và theo dõi đủ 4 ô nhịp. Lượt này chưa có lần TAP nào, vì vậy không chấm điểm.</Text>
                :<>
                  <View style={styles.tapSummary}>
                    <Text style={styles.soft}>Trúng: <Text style={styles.bold}>{result.hits}/{result.totalBeats} phách</Text></Text>
                    <Text style={styles.soft}>Bỏ lỡ: <Text style={styles.bold}>{result.missed}</Text></Text>
                    <Text style={styles.soft}>Gõ thừa/lệch: <Text style={styles.bold}>{result.extras}</Text></Text>
                  </View>
                  <Text style={styles.soft}>Sai lệch TB trên các phách trúng: {result.averageErrorMs??"—"} ms (ước lượng)</Text>
                  <View style={styles.barReportRow}>
                    {result.byBar.map((hits,index)=><View style={styles.barReport} key={index}>
                      <Text style={styles.barReportLabel}>Ô {index+1}</Text>
                      <Text style={styles.barReportValue}>{hits}/{meter}</Text>
                    </View>)}
                  </View>
                </>}
              <View style={styles.resultActions}>
                <TouchableOpacity accessibilityRole="button" style={styles.retryButton} onPress={start}>
                  <Ionicons name="refresh" size={17} color={colors.text}/>
                  <Text style={styles.retryText}>Tập lại</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" disabled={bpm>=180}
                  style={[styles.retryButton,bpm>=180&&styles.tapDisabled]} onPress={()=>changeTempo(bpm+5)}>
                  <Ionicons name="speedometer-outline" size={17} color={colors.text}/>
                  <Text style={styles.retryText}>Tăng 5 BPM</Text>
                </TouchableOpacity>
              </View>
              {linkedLesson ? <View style={styles.lessonSaveCard}>
                <Text style={styles.lessonSaveTitle}>Learning Path · {linkedLesson.title}</Text>
                {result.score===null
                  ? <Text style={styles.soft}>Hãy luyện lại và TAP theo phách để có kết quả lưu.</Text>
                  : user
                    ? <TouchableOpacity accessibilityRole="button" style={[styles.saveButton,(saved||saving)&&styles.tapDisabled]}
                        disabled={saved||saving} onPress={saveResult}>
                        <Ionicons name={saved?"checkmark-circle":"cloud-upload-outline"} size={19} color="#FFFFFF"/>
                        <Text style={styles.saveButtonText}>{saved?"Đã lưu vào bài học":saving?"Đang lưu...":"Lưu kết quả vào bài học"}</Text>
                      </TouchableOpacity>
                    : <Text style={styles.soft}>Bạn chưa đăng nhập. Hãy đăng nhập trước lượt luyện tiếp theo để lưu thành tích vào tài khoản.</Text>}
                {!!saveError&&<Text style={styles.errorText}>{saveError}</Text>}
              </View>
                : <Text style={styles.soft}>Mẹo: Mở Rhythm Trainer từ một bài trong Learning Path để có thể lưu kết quả vào bài đó.</Text>}
            </View>}
            {!!message&&<Text style={styles.notice}>{message}</Text>}
            <TouchableOpacity style={styles.lessonLink} onPress={()=>router.push((linkedLesson?"/learning-path/"+linkedLesson.id:"/learning-path") as any)}>
              <Ionicons name="school-outline" color={colors.accent} size={19}/>
              <Text style={styles.lessonLinkText}>Xem bài học Rhythm & Strumming</Text>
              <Ionicons name="arrow-forward" color={colors.accent} size={17}/>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.footer}>Kết quả TAP chỉ đo thời điểm thao tác, chịu ảnh hưởng của độ trễ thiết bị. Không đánh giá tiếng guitar, kỹ thuật gảy hay dùng AI. Nếu mở từ Learning Path và đã đăng nhập, bạn có thể lưu kết quả thủ công; việc này không tự hoàn thành bài học.</Text>
      </ScrollView>
    </View>
  );
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.gradientEnd},
  content:{paddingHorizontal:20,paddingTop:27,paddingBottom:100,alignSelf:"center",maxWidth:1150,width:"100%"},
  back:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:8,marginBottom:20},
  eyebrow:{color:colors.accent,fontSize:11,fontWeight:"800",letterSpacing:1.6},
  heading:{color:colors.text,fontSize:30,fontWeight:"900",marginTop:7},
  description:{color:colors.textSoft,lineHeight:21,fontSize:13,maxWidth:750,marginTop:8,marginBottom:22},
  columns:{flexDirection:"row",flexWrap:"wrap",gap:18,alignItems:"flex-start"},
  card:{flexGrow:1,flexBasis:340,minWidth:0,backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:20,padding:18},
  trainerCard:{flexGrow:1,flexBasis:400,minWidth:0,backgroundColor:colors.surface,borderColor:colors.borderAccent,borderWidth:1,borderRadius:20,padding:20},
  cardHead:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:18},
  cardTitle:{color:colors.text,fontSize:17,fontWeight:"800"},
  label:{color:colors.textMuted,fontSize:11,fontWeight:"800",letterSpacing:1,marginTop:17,marginBottom:9},
  optionRow:{flexDirection:"row",gap:8},
  meterButton:{flex:1,alignItems:"center",paddingVertical:12,backgroundColor:colors.surfaceMuted,borderWidth:1,borderColor:colors.border,borderRadius:12},
  activeMeter:{backgroundColor:colors.action,borderColor:colors.accent},
  meterLabel:{color:colors.textSoft,fontSize:16,fontWeight:"800"},
  activeText:{color:"#FFFFFF"},
  patternList:{gap:8},
  patternCard:{flexDirection:"row",gap:10,alignItems:"center",padding:12,borderWidth:1,borderColor:colors.border,borderRadius:12,backgroundColor:colors.surfaceMuted},
  activePattern:{borderColor:colors.accent,backgroundColor:colors.accentSoft},
  patternTitle:{color:colors.text,fontSize:13,fontWeight:"800"},
  patternSubtitle:{color:colors.textSoft,fontSize:11,lineHeight:17,marginTop:4},
  tempoRow:{flexDirection:"row",justifyContent:"center",alignItems:"center",gap:16,marginTop:2},
  tempoButton:{width:44,height:44,alignItems:"center",justifyContent:"center",backgroundColor:colors.surfaceMuted,borderColor:colors.border,borderWidth:1,borderRadius:11},
  tempoDisplay:{minWidth:92,alignItems:"center"},
  bpmNumber:{color:colors.text,fontSize:35,fontWeight:"900"},
  bpmUnit:{color:colors.textMuted,fontSize:11,fontWeight:"700"},
  presets:{flexDirection:"row",gap:8,marginTop:12},
  preset:{flex:1,alignItems:"center",borderRadius:9,paddingVertical:8,backgroundColor:colors.surfaceMuted,borderWidth:1,borderColor:colors.border},
  presetActive:{backgroundColor:colors.action,borderColor:colors.accent},
  presetText:{color:colors.textSoft,fontWeight:"700",fontSize:12},
  toggleRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:10,borderBottomWidth:1,borderBottomColor:colors.border},
  toggleLabel:{color:colors.textSoft,fontSize:13},
  summaryRow:{flexDirection:"row",alignItems:"center",gap:10},
  exerciseName:{fontSize:22,color:colors.text,fontWeight:"900"},
  soft:{color:colors.textSoft,fontSize:12,lineHeight:19,marginTop:3},
  exerciseBadge:{backgroundColor:colors.accentSoft,borderRadius:9,paddingHorizontal:12,paddingVertical:7},
  exerciseBadgeText:{color:colors.accent,fontWeight:"800",fontSize:12},
  hint:{marginTop:14,color:colors.textSoft,fontSize:12,lineHeight:19},
  visualPanel:{backgroundColor:colors.surfaceDeep,borderColor:colors.borderAccent,borderWidth:1,borderRadius:16,paddingHorizontal:10,paddingVertical:18,marginTop:20},
  beatRow:{flexDirection:"row",gap:10,justifyContent:"center"},
  beatDot:{backgroundColor:colors.surfaceMuted,borderWidth:1,borderColor:colors.border,width:48,height:48,borderRadius:25,alignItems:"center",justifyContent:"center"},
  activeDot:{backgroundColor:colors.action,borderColor:colors.accent},
  strongDot:{borderWidth:2},
  beatNumber:{color:colors.text,fontWeight:"800",fontSize:17},
  visualCaption:{color:colors.textSoft,fontSize:12,textAlign:"center",marginTop:14},
  strumRow:{flexDirection:"row",gap:3,justifyContent:"center",marginTop:23},
  strumStep:{flex:1,maxWidth:55,alignItems:"center",justifyContent:"center",paddingVertical:9,borderColor:colors.border,borderWidth:1,borderRadius:10,backgroundColor:colors.surfaceMuted,gap:4},
  strumActive:{backgroundColor:colors.action,borderColor:colors.accent},
  subdivision:{color:colors.textMuted,fontSize:10,fontWeight:"700"},
  strumLetter:{color:colors.textSoft,fontSize:12,fontWeight:"800"},
  legend:{color:colors.textMuted,fontSize:11,textAlign:"center",marginTop:18},
  startButton:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10,backgroundColor:colors.action,padding:15,borderRadius:13,marginTop:18},
  startLabel:{fontWeight:"800",color:"#FFFFFF",fontSize:15},
  tapArea:{backgroundColor:colors.surfaceRaised,borderRadius:14,borderWidth:1,borderColor:colors.border,marginTop:19,padding:14,gap:7},
  tapButton:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,backgroundColor:colors.gradientEnd,padding:16,borderRadius:12,marginTop:8},
  tapDisabled:{opacity:0.4},
  tapTitle:{color:colors.text,fontWeight:"900",fontSize:15},
  tapSummary:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:8,marginTop:6},
  bold:{fontWeight:"800",color:colors.text},
  feedback:{color:colors.accent,fontWeight:"700",fontSize:12},
  resultPanel:{marginTop:15,padding:16,backgroundColor:colors.surfaceRaised,borderColor:colors.positive,borderWidth:1,borderRadius:14,gap:12},
  resultHeading:{flexDirection:"row",alignItems:"center",gap:10},
  resultTitle:{color:colors.text,fontSize:18,fontWeight:"900"},
  resultScore:{fontSize:30,fontWeight:"900",color:colors.positive},
  barReportRow:{flexDirection:"row",gap:7,marginTop:3},
  barReport:{flex:1,backgroundColor:colors.surfaceDeep,paddingVertical:11,paddingHorizontal:5,borderRadius:10,alignItems:"center",gap:5},
  barReportLabel:{fontSize:11,color:colors.textMuted},
  barReportValue:{fontSize:16,fontWeight:"900",color:colors.text},
  resultActions:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:3},
  retryButton:{flexGrow:1,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:7,padding:12,borderRadius:10,backgroundColor:colors.action},
  retryText:{color:colors.text,fontWeight:"800",fontSize:12},
  lessonSaveCard:{marginTop:8,paddingTop:13,borderTopColor:colors.border,borderTopWidth:1,gap:8},
  lessonSaveTitle:{color:colors.text,fontSize:13,fontWeight:"800"},
  saveButton:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,padding:13,backgroundColor:colors.action,borderRadius:11},
  saveButtonText:{color:"#FFFFFF",fontSize:12,fontWeight:"800"},
  errorText:{color:colors.negative,fontSize:12,lineHeight:19},
  notice:{color:colors.textSoft,fontSize:12,marginTop:12},
  lessonLink:{flexDirection:"row",alignItems:"center",gap:9,marginTop:14,padding:12,borderWidth:1,borderColor:colors.border,borderRadius:12},
  lessonLinkText:{flex:1,color:colors.accent,fontWeight:"800",fontSize:12},
  footer:{color:colors.textMuted,fontSize:11,lineHeight:18,marginTop:20}
});
