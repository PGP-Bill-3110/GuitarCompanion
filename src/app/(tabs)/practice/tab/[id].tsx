import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AppGradientBackground from "../../../../components/ui/AppGradientBackground";
import PracticeSessionBar from "../../../../components/practice/PracticeSessionBar";
import { colors } from "../../../../theme/colors";
import { flattenTab, getGuitarTab, GuitarTab, GuitarString, TabBeat } from "../../../../data/guitarTabs";
import { canPlayTabAudio, playTabNote } from "../../../../services/tabAudio";

const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];
const STRINGS: GuitarString[] = [1, 2, 3, 4, 5, 6];
const MIN_BPM = 40;
const MAX_BPM = 160;

export default function GuitarTabDetail() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const tab = getGuitarTab(id ?? "");
  const notes = useMemo(() => tab ? flattenTab(tab) : [], [tab]);
  const [bpm, setBpm] = useState(tab?.bpm ?? 70);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const nextIndexRef = useRef(0);
  const durationSec = 60 / bpm;
  const webAudioAvailable = Platform.OS === "web" && canPlayTabAudio();

  useEffect(() => {
    setBpm(tab?.bpm ?? 70);
    setPlaying(false);
    setActiveIndex(0);
    nextIndexRef.current = 0;
  }, [tab?.id]);

  useEffect(() => {
    if (!playing || notes.length === 0 || !webAudioAvailable) return;
    const timer = setInterval(() => {
      const nextIndex = nextIndexRef.current + 1;
      if (nextIndex >= notes.length && !loop) {
        setPlaying(false);
        return;
      }
      const target = nextIndex >= notes.length ? 0 : nextIndex;
      nextIndexRef.current = target;
      setActiveIndex(target);
      playTabNote(notes[target], Math.min(0.7, durationSec * 0.78));
    }, 60000 / bpm);
    return () => clearInterval(timer);
  }, [playing, bpm, loop, notes, durationSec, webAudioAvailable]);

  function selectNote(index: number) {
    nextIndexRef.current = index;
    setActiveIndex(index);
    if (notes[index] && webAudioAvailable) {
      playTabNote(notes[index], Math.min(0.7, durationSec * 0.78));
    }
  }

  function togglePlayback() {
    if (!webAudioAvailable || !notes.length) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (activeIndex >= notes.length - 1 && !loop) {
      nextIndexRef.current = 0;
      setActiveIndex(0);
      playTabNote(notes[0], Math.min(0.7, durationSec * 0.78));
    } else {
      playTabNote(notes[nextIndexRef.current], Math.min(0.7, durationSec * 0.78));
    }
    setPlaying(true);
  }

  function resetPlayback() {
    setPlaying(false);
    setActiveIndex(0);
    nextIndexRef.current = 0;
  }

  if (!tab) {
    return (
      <View style={styles.screen}>
        <AppGradientBackground />
        <View style={styles.container}>
          <Text style={styles.title}>Không tìm thấy Guitar Tab</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" color="#FFFFFF" size={20}/>
            <Text style={styles.body}>Quay lại Practice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const current = notes[activeIndex];

  return (
    <View style={styles.screen}>
      <AppGradientBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={19} color="#FFFFFF" />
          <Text style={styles.muted}>Practice · Guitar Tabs</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>GUITARCOMPANION TAB LAB</Text>
        <Text style={styles.title}>{tab.title}</Text>
        <Text style={styles.subtitle}>{tab.subtitle}</Text>

        <View style={styles.metadata}>
          <View style={styles.pill}><Ionicons name="musical-notes" color={colors.accent} size={14}/><Text style={styles.pillText}>{tab.key}</Text></View>
          <View style={styles.pill}><Ionicons name="speedometer-outline" color={colors.accent} size={14}/><Text style={styles.pillText}>{bpm} BPM</Text></View>
          <View style={styles.pill}><Ionicons name="time-outline" color={colors.accent} size={14}/><Text style={styles.pillText}>{tab.timeSignature}</Text></View>
          <View style={styles.pill}><Ionicons name="school-outline" color={colors.accent} size={14}/><Text style={styles.pillText}>{tab.difficulty}</Text></View>
        </View>

        {Platform.OS === "web" && (
          <TouchableOpacity
            style={styles.alphaButton}
            onPress={() => router.push(("/practice/score-studio?demo=" + tab.id) as any)}
          >
            <Ionicons name="musical-notes-outline" color={colors.accent} size={21}/>
            <Text style={styles.alphaButtonLabel}>Xem bằng alphaTab · Khuông nhạc & playback</Text>
            <Ionicons name="arrow-forward" color={colors.accent} size={17}/>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Ionicons name="list-outline" color={colors.accent} size={21}/>
            <Text style={styles.sectionTitle}>Guitar Tablature</Text>
          </View>
          <Text style={styles.muted}>Đọc từ trái sang phải. Số = ngăn đàn, 0 = dây buông. Chọn một nốt để nghe thử.</Text>
          <View style={styles.tabShell}>
            <View style={styles.stringNames}>
              {STRING_NAMES.map((name, i) => <View key={i} style={styles.stringLabel}><Text style={styles.stringName}>{name}</Text></View>)}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tabScroll}>
              <View>
                {STRINGS.map((stringNum) => (
                  <View key={stringNum} style={styles.stringRow}>
                    {tab.bars.map((bar, barNumber) => (
                      <View key={barNumber} style={styles.measureRow}>
                        {bar.map((beat, beatIndex) => {
                          const index = barNumber * 4 + beatIndex;
                          const selected = activeIndex === index;
                          const noteOnString = beat.string === stringNum;
                          return (
                            <TouchableOpacity
                              key={index}
                              accessibilityRole="button"
                              accessibilityLabel={"Ô " + (barNumber + 1) + ", phách " + (beatIndex + 1) + ", dây " + beat.string + ", ngăn " + beat.fret}
                              onPress={() => selectNote(index)}
                              style={[styles.tabCell, selected && styles.tabCellActive]}
                            >
                              <Text style={[styles.tabCharacter, noteOnString && styles.fretText, selected && styles.fretSelected]}>
                                {noteOnString ? String(beat.fret) : "—"}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                ))}
                <View style={styles.barNumbers}>
                  {tab.bars.map((bar, i) => <Text key={i} style={styles.barNumber}>Ô {i + 1}</Text>)}
                </View>
              </View>
            </ScrollView>
          </View>
          <View style={styles.currentRow}>
            <View style={styles.highlightIcon}><Ionicons name="finger-print-outline" size={22} color={colors.accent}/></View>
            <View style={{flex: 1}}>
              <Text style={styles.currentTitle}>Nốt {activeIndex + 1}/{notes.length} · Ô {Math.floor(activeIndex / 4) + 1}</Text>
              <Text style={styles.muted}>Dây {current.string} ({STRING_NAMES[current.string - 1]}) · {current.fret === 0 ? "Dây buông" : "Ngăn " + current.fret}</Text>
            </View>
            <Text style={styles.currentBadge}>{activeIndex % 4 + 1}/4</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Ionicons name="headset-outline" color={colors.accent} size={22}/>
            <Text style={styles.sectionTitle}>Luyện theo nhịp</Text>
          </View>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Tempo</Text>
            <View style={styles.bpmGroup}>
              <TouchableOpacity accessibilityLabel="Giảm 10 BPM" style={styles.stepButton} onPress={() => setBpm(v => Math.max(MIN_BPM, v - 10))}><Ionicons name="remove" color={colors.text} size={19}/></TouchableOpacity>
              <Text style={styles.bpmValue}>{bpm} <Text style={styles.bpmUnit}>BPM</Text></Text>
              <TouchableOpacity accessibilityLabel="Tăng 10 BPM" style={styles.stepButton} onPress={() => setBpm(v => Math.min(MAX_BPM, v + 10))}><Ionicons name="add" color={colors.text} size={19}/></TouchableOpacity>
            </View>
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.playButton, !webAudioAvailable && styles.disabled]} disabled={!webAudioAvailable} onPress={togglePlayback}>
              <Ionicons name={playing ? "pause" : "play"} color="#FFFFFF" size={19}/>
              <Text style={styles.playText}>{playing ? "Pause" : "Play Example"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetPlayback}><Ionicons name="refresh-outline" color={colors.accent} size={21}/><Text style={styles.secondaryText}>Reset</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, loop && styles.selectedButton]} onPress={() => setLoop(x => !x)}>
              <Ionicons name="repeat-outline" color={colors.accent} size={19}/>
              <Text style={styles.secondaryText}>Loop {loop ? "ON" : "OFF"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footnote}>{webAudioAvailable ? "Âm thanh đang là mô phỏng nốt guitar bằng Web Audio, chưa phải tiếng đàn thu thật." : "Audio preview hiện chỉ hỗ trợ trình duyệt web. Bạn vẫn có thể đọc và tập theo tab."}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHead}><Ionicons name="bulb-outline" size={21} color={colors.accent}/><Text style={styles.sectionTitle}>Mục tiêu bài tập</Text></View>
          {tab.goals.map((goal, i) => <View style={styles.listRow} key={i}><View style={styles.listDot}/><Text style={styles.body}>{goal}</Text></View>)}
          <View style={styles.separation}/>
          <Text style={styles.tipHeading}>Mẹo luyện tập</Text>
          {tab.tips.map((tip, i) => <View key={i} style={styles.listRow}><Ionicons name="checkmark-circle-outline" color={colors.accent} size={17}/><Text style={styles.body}>{tip}</Text></View>)}
        </View>

        <PracticeSessionBar sourceType="score" sourceId={"tab:" + tab.id} analysisExerciseId={"gc-tab-" + tab.id} title={"Guitar Tab · " + tab.title} bpm={bpm}/>
        <Text style={styles.license}>Nguồn: {tab.composer} · {tab.license} · Bài tập tự biên soạn</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex:1, backgroundColor:colors.gradientEnd},
  alphaButton: {backgroundColor:colors.surfaceRaised,borderColor:colors.borderAccent,borderWidth:1,padding:14,borderRadius:14,marginTop:12,flexDirection:"row",alignItems:"center",gap:9},
  alphaButtonLabel: {flex:1,color:colors.accent,fontWeight:"800",fontSize:12},
  container: {width:"100%", maxWidth:1060, alignSelf:"center", padding:22, paddingTop:28, paddingBottom:100},
  back: {flexDirection:"row", alignItems:"center", gap:10, alignSelf:"flex-start", marginBottom:20},
  eyebrow: {fontSize:11, fontWeight:"800", letterSpacing:1.5, color:colors.accent, marginBottom:6},
  title: {color:colors.text, fontWeight:"800", fontSize:30, lineHeight:38},
  subtitle: {color:colors.textSoft, fontSize:14, marginTop:7, lineHeight:21},
  muted: {color:colors.textSoft, fontSize:12, lineHeight:19},
  body: {color:colors.textSoft, fontSize:13, lineHeight:21, flexShrink:1},
  metadata: {flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:16, marginBottom:10},
  pill: {backgroundColor:colors.surfaceMuted, borderWidth:1, borderColor:colors.border, borderRadius:11, paddingHorizontal:11, paddingVertical:7, flexDirection:"row", gap:6, alignItems:"center"},
  pillText: {color:colors.textSoft, fontSize:12, fontWeight:"700"},
  card: {backgroundColor:colors.surface, borderWidth:1, borderColor:colors.border, borderRadius:20, padding:18, marginTop:17},
  sectionHead: {flexDirection:"row", alignItems:"center", gap:10, marginBottom:14},
  sectionTitle: {color:colors.text, fontWeight:"800", fontSize:18},
  tabShell: {flexDirection:"row", backgroundColor:colors.surfaceDeep, borderRadius:14, paddingVertical:12, paddingHorizontal:6, marginTop:17, borderWidth:1, borderColor:colors.border},
  stringNames: {width:35, paddingTop:0},
  stringLabel: {height:36, justifyContent:"center", alignItems:"center"},
  stringName: {fontSize:15, fontWeight:"800", color:colors.accent, fontFamily:Platform.OS === "web" ? "monospace" : undefined},
  tabScroll: {paddingRight:12},
  stringRow: {height:36, flexDirection:"row", alignItems:"center"},
  measureRow: {flexDirection:"row", borderLeftWidth:1, borderLeftColor:colors.borderAccent, paddingHorizontal:3},
  tabCell: {width:47, height:34, alignItems:"center", justifyContent:"center", borderRadius:7},
  tabCellActive: {backgroundColor:colors.activeSoft},
  tabCharacter: {fontFamily:Platform.OS === "web" ? "monospace" : undefined, color:colors.textDim, fontSize:15},
  fretText: {color:colors.text, fontWeight:"800", fontSize:17},
  fretSelected: {color:"#F8D9FA"},
  barNumbers: {flexDirection:"row", marginTop:9},
  barNumber: {width:212, textAlign:"center", color:colors.textMuted, fontSize:11},
  currentRow: {flexDirection:"row", alignItems:"center", gap:10, marginTop:17, padding:12, borderRadius:12, backgroundColor:colors.surfaceMuted},
  highlightIcon: {backgroundColor:colors.accentSoft, borderRadius:10, padding:9},
  currentTitle: {color:colors.text, fontWeight:"800", fontSize:13},
  currentBadge: {color:colors.accent, fontWeight:"800"},
  controlRow: {flexDirection:"row", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10},
  controlLabel: {color:colors.textSoft, fontWeight:"700"},
  bpmGroup: {flexDirection:"row", alignItems:"center", gap:14},
  stepButton: {width:38, height:38, backgroundColor:colors.surfaceMuted, borderRadius:11, alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:colors.border},
  bpmValue: {color:colors.text, fontWeight:"800", fontSize:21},
  bpmUnit: {color:colors.textMuted, fontSize:11},
  buttons: {flexDirection:"row", flexWrap:"wrap", gap:9, marginTop:17},
  playButton: {backgroundColor:colors.action, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:9, paddingVertical:14, paddingHorizontal:19, borderRadius:13},
  playText: {color:"#FFFFFF", fontWeight:"800", fontSize:13},
  secondaryButton: {borderWidth:1, borderColor:colors.border, backgroundColor:colors.surfaceMuted, paddingVertical:12, paddingHorizontal:13, borderRadius:13, flexDirection:"row", gap:7, alignItems:"center"},
  selectedButton: {borderColor:colors.borderAccent},
  secondaryText: {color:colors.textSoft, fontWeight:"700", fontSize:12},
  footnote: {color:colors.textMuted, fontSize:11, lineHeight:19, marginTop:14},
  disabled: {opacity:0.45},
  listRow: {flexDirection:"row", alignItems:"flex-start", gap:11, marginTop:12},
  listDot: {width:7, height:7, backgroundColor:colors.accent, borderRadius:5, marginTop:8},
  separation: {marginTop:20, borderTopWidth:1, borderColor:colors.border, marginBottom:14},
  tipHeading: {color:colors.accent, fontWeight:"800"},
  license: {color:colors.textMuted, textAlign:"center", fontSize:11, marginTop:24},
});
