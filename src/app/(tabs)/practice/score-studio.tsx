import React, { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AppGradientBackground from "../../../components/ui/AppGradientBackground";
import PracticeSessionBar from "../../../components/practice/PracticeSessionBar";
import { colors } from "../../../theme/colors";
import { guitarTabs } from "../../../data/guitarTabs";

interface ScoreSelection {
  sourceId: string | null;
  title: string;
  bpm: number | null;
  exerciseId: string | null;
  referenceKey: string | null;
  referenceCount: number;
  referenceError: string | null;
  startBar: number | null;
  endBar: number | null;
  trackIndex: number | null;
  sectionDuration: number | null;
}

const MUTOPIA = ["01", "03", "08"];

export default function ScoreStudioScreen() {
  const params = useLocalSearchParams<{ demo?: string; mutopia?: string; local?: string; barStart?: string; barEnd?: string; track?: string }>();
  const demo = Array.isArray(params.demo) ? params.demo[0] : params.demo;
  const chosenDemo = guitarTabs.some((item) => item.id === demo) ? demo : "open-strings";
  const mutopia = Array.isArray(params.mutopia) ? params.mutopia[0] : params.mutopia;
  const chosenMutopia = MUTOPIA.includes(mutopia || "") ? mutopia : null;
  const local = Array.isArray(params.local) ? params.local[0] : params.local;
  const chosenLocal = typeof local === "string" && local.length < 180 ? local : null;
  const restoreBarStart = Number(Array.isArray(params.barStart) ? params.barStart[0] : params.barStart);
  const restoreBarEnd = Number(Array.isArray(params.barEnd) ? params.barEnd[0] : params.barEnd);
  const restoreTrack = Number(Array.isArray(params.track) ? params.track[0] : params.track);
  const restoreSection = Number.isInteger(restoreBarStart) && restoreBarStart > 0
    && Number.isInteger(restoreBarEnd) && restoreBarEnd >= restoreBarStart && restoreBarEnd <= 2000;
  const src = "/alphatab/studio.html?demo=" + encodeURIComponent(chosenDemo || "open-strings")
    + (chosenMutopia ? "&mutopia=" + encodeURIComponent(chosenMutopia) : "")
    + (chosenLocal ? "&local=" + encodeURIComponent(chosenLocal) : "")
    + (restoreSection ? "&barStart=" + restoreBarStart + "&barEnd=" + restoreBarEnd : "")
    + (restoreSection && Number.isInteger(restoreTrack) && restoreTrack >= 0 && restoreTrack < 200
        ? "&track=" + restoreTrack : "");

  const iframeRef = useRef<any>(null);
  const [selection, setSelection] = useState<ScoreSelection | null>(null);
  const [practiceActive, setPracticeActive] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    iframeRef.current?.contentWindow?.postMessage({ source: "gc-practice", type: "lock-controls", locked: practiceActive }, window.location.origin);
  }, [practiceActive]);

  useEffect(() => {
    setSelection(null);
  }, [src]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const receiveScore = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const payload = event.data;
      if (!payload || payload.source !== "gc-alphatab") return;
      if (payload.type === "tempo-changed") {
        setSelection(previous => {
          if (!previous || previous.sourceId !== payload.sourceId) return previous;
          return typeof payload.bpm === "number" && Number.isFinite(payload.bpm)
            && payload.bpm >= 20 && payload.bpm <= 300 ? { ...previous, bpm: payload.bpm } : previous;
        });
        return;
      }
      if (payload.type !== "score-ready" || typeof payload.title !== "string") return;
      setSelection({
        sourceId: typeof payload.sourceId === "string" ? payload.sourceId.slice(0, 180) : null,
        title: payload.title.trim().slice(0, 180) || "Untitled score",
        bpm: typeof payload.bpm === "number" && Number.isFinite(payload.bpm) && payload.bpm >= 20 && payload.bpm <= 300 ? payload.bpm : null,
        exerciseId: typeof payload.exerciseId === "string" && payload.exerciseId.startsWith("gc-tab-") ? payload.exerciseId : null,
        referenceKey: typeof payload.referenceKey === "string" && payload.referenceKey.length < 250 ? payload.referenceKey : null,
        referenceCount: typeof payload.referenceCount === "number" ? payload.referenceCount : 0,
        referenceError: typeof payload.referenceError === "string" ? payload.referenceError : null,
        startBar: typeof payload.startBar === "number" ? payload.startBar : null,
        endBar: typeof payload.endBar === "number" ? payload.endBar : null,
        trackIndex: typeof payload.trackIndex === "number" ? payload.trackIndex : null,
        sectionDuration: typeof payload.sectionDuration === "number" ? payload.sectionDuration : null
      });
    };
    window.addEventListener("message", receiveScore);
    return () => window.removeEventListener("message", receiveScore);
  }, []);

  const scoreSupported = Boolean(selection?.exerciseId || selection?.referenceKey);
  return (
    <View style={styles.root}>
      <AppGradientBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Trở về Practice</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>GUITARCOMPANION MUSIC STUDIO</Text>
        <Text style={styles.heading}>alphaTab · MusicXML & Guitar Pro</Text>
        <Text style={styles.subheading}>Xem và luyện với bản nhạc, ghi lại thời gian thực hành, sau đó mở Review để ghi âm và nhận phân tích AI. File cá nhân lưu trong IndexedDB của trình duyệt.</Text>
        {Platform.OS === "web" ? (
          <View style={styles.viewer}>
            {React.createElement("iframe" as any, {
              ref: iframeRef,
              title: "alphaTab Music Studio",
              src,
              allow: "autoplay",
              style: { width: "100%", height: "810px", border: "0", display: "block" },
            })}
          </View>
        ) : (
          <View style={styles.viewer}>
            <Text style={styles.subheading}>alphaTab Studio hiện chỉ hoạt động trên web. Hãy mở GuitarCompanion bằng trình duyệt máy tính để sử dụng.</Text>
          </View>
        )}
        <View style={styles.practicePanel}>
          <View style={styles.panelHeader}>
            <Ionicons name="pulse-outline" color={colors.accent} size={23} />
            <View style={{flex:1}}>
              <Text style={styles.panelTitle}>Practice History & AI Feedback</Text>
              <Text style={styles.panelHint}>{selection ? "Bản nhạc hiện tại: " + selection.title + (selection.bpm ? " · " + selection.bpm + " BPM" : "") : "Đang chờ alphaTab tải bản nhạc..."}</Text>
            </View>
          </View>
          {selection ? (
            <>
              <View style={[styles.modeBox, scoreSupported ? styles.scorableBox : null]}>
                <Ionicons name={scoreSupported ? "sparkles-outline" : "information-circle-outline"} size={21} color={colors.accent}/>
                <Text style={styles.modeText}>
                  {scoreSupported
                    ? selection?.exerciseId
                      ? "Bài tập 16 nốt có tham chiếu AI. Tập đúng BPM và bắt đầu từ đầu."
                      : "AI thử nghiệm: " + selection?.referenceCount + " nốt, ô " + selection?.startBar + "–" + selection?.endBar +
                        " (" + selection?.sectionDuration?.toFixed(1) + " giây) thuộc track đã chọn. Hợp âm và nhiều bè có thể sai số. Chọn Tempo trước khi Start Practice."
                    : "Chưa tạo được tham chiếu: " + (selection?.referenceError || "Không có nốt guitar hợp lệ.") + ". Bạn vẫn có thể phân tích nhận diện nốt, chưa chấm theo sheet."}
                </Text>
              </View>
              <PracticeSessionBar
                sourceType="score"
                sourceId={selection.sourceId || undefined}
                analysisExerciseId={selection.exerciseId || (selection.referenceKey ? "dynamic:" + selection.referenceKey : undefined)}
                title={"alphaTab · " + selection.title + (selection.startBar && selection.endBar ? " · Ô " + selection.startBar + "–" + selection.endBar : "") + (selection.trackIndex != null ? " · Track " + (selection.trackIndex + 1) : "")}
                bpm={selection.bpm || undefined}
                startBar={selection.startBar || undefined}
                endBar={selection.endBar || undefined}
                trackIndex={selection.trackIndex ?? undefined}
                onPracticeStateChange={setPracticeActive}
              />
              <Text style={styles.nextHint}>Cách sử dụng: chọn Tempo trước khi bắt đầu → Start Practice → tập với bản nhạc → Finish & Save → Review this session → ghi âm và Analyze Recording. Khi ghi âm, nên tắt nhạc mẫu alphaTab để tránh âm thanh nền làm sai kết quả AI.</Text>
            </>
          ) : (
            <Text style={styles.panelHint}>Khi chọn một bản nhạc trong alphaTab, nút Start Practice sẽ xuất hiện tại đây.</Text>
          )}
        </View>
        <Text style={styles.note}>Nguồn: alphaTab (MPL-2.0), Bravura (SIL OFL), SONiVOX SoundFont. AI Basic Pitch có giới hạn với hợp âm nhiều nốt, tiếng ồn và kỹ thuật guitar phức tạp. Không xem điểm số là xác nhận tuyệt đối về trình độ.</Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {flex:1,backgroundColor:colors.gradientEnd},
  content: {padding:20,paddingTop:28,paddingBottom:95,width:"100%",maxWidth:1300,alignSelf:"center"},
  back: {flexDirection:"row",alignItems:"center",gap:8,marginBottom:22},
  backText: {color:colors.textSoft,fontWeight:"600"},
  kicker: {color:colors.accent,letterSpacing:2,fontSize:11,fontWeight:"800"},
  heading: {color:colors.text,fontWeight:"800",fontSize:27,marginTop:8},
  subheading: {color:colors.textSoft,fontSize:14,marginTop:10,lineHeight:22},
  viewer: {backgroundColor:colors.surface,borderWidth:1,borderColor:colors.borderAccent,borderRadius:19,marginTop:23,padding:12},
  practicePanel: {marginTop:20,backgroundColor:colors.surfaceRaised,borderWidth:1,borderColor:colors.borderAccent,borderRadius:19,padding:17},
  panelHeader: {flexDirection:"row",alignItems:"center",gap:12},
  panelTitle: {color:colors.text,fontWeight:"800",fontSize:18},
  panelHint: {color:colors.textSoft,fontSize:12,marginTop:5,lineHeight:19},
  modeBox: {flexDirection:"row",alignItems:"flex-start",gap:12,backgroundColor:colors.surfaceDeep,borderColor:colors.border,borderWidth:1,padding:12,borderRadius:12,marginTop:14},
  scorableBox: {borderColor:colors.borderAccent,backgroundColor:colors.accentSoft},
  modeText: {color:colors.textSoft,fontSize:12,lineHeight:20,flex:1},
  nextHint: {color:colors.textMuted,fontSize:12,lineHeight:20,marginTop:6},
  note: {color:colors.textMuted,fontSize:11,lineHeight:19,marginTop:17}
});
