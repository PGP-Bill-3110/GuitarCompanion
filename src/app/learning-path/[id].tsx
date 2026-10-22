import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AppGradientBackground from "../../components/ui/AppGradientBackground";
import { colors } from "../../theme/colors";
import { getLearningLesson, learningLessons, learningModules } from "../../data/learningPath";
import { useAuth } from "../../context/AuthContext";
import { LessonProgress, completeLearningLesson, startLearningLesson, subscribeLearningProgress } from "../../services/learningProgressService";

export default function LessonDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const lesson = getLearningLesson(id || "");
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<LessonProgress | undefined>();
  const [syncing, setSyncing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const completed = progress?.status === "completed";
  const allChecked = !!lesson && checked.length === lesson.exercises.length;
  const quizCorrect = !!lesson && quizSubmitted && selected === lesson.quiz.answer;
  const index = learningLessons.findIndex((item) => item.id === id);
  const next = learningLessons[index + 1];
  const previous = learningLessons[index - 1];
  const module = learningModules.find((item) => item.id === lesson?.moduleId);
  const relatedTabId: string | undefined = ({
    "guitar-strings": "open-strings",
    "tuning-basics": "open-strings",
    "chord-c-g": "c-arpeggio",
    "count-four": "open-strings",
    "eighth-notes": "two-string-walk",
    "first-performance": "c-arpeggio",
  } as Record<string, string>)[id || ""];

  useEffect(() => {
    setChecked([]);
    setSelected(null);
    setQuizSubmitted(false);
    setError("");
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProgress(undefined);
      setSyncing(false);
      return;
    }
    setSyncing(true);
    setError("");
    return subscribeLearningProgress(
      user.uid,
      (entries) => { setProgress(entries[id || ""]); setSyncing(false); },
      () => { setSyncing(false); setError("Không thể tải tiến độ. Kiểm tra Firestore Rules."); }
    );
  }, [id, authLoading, user?.uid]);

  const isStarted = progress?.status === "in_progress" || completed;

  async function begin() {
    if (!lesson || !user || busy || completed) return;
    setBusy(true); setError("");
    try { await startLearningLesson(user.uid, lesson.id); }
    catch (e) { console.error("Start lesson:", e); setError("Không thể lưu trạng thái bắt đầu. Kiểm tra quyền Firestore."); }
    finally { setBusy(false); }
  }

  async function finish() {
    if (!lesson || !user || busy || completed || !isStarted || !allChecked || !quizCorrect) return;
    setBusy(true); setError("");
    try { await completeLearningLesson(user.uid, lesson.id); }
    catch (e) { console.error("Complete lesson:", e); setError("Không thể lưu tiến độ hoàn thành. Hãy thử lại."); }
    finally { setBusy(false); }
  }

  const quizFeedback = useMemo(() => {
    if (!lesson || !quizSubmitted) return "";
    return selected === lesson.quiz.answer ? "Đúng rồi! " + lesson.quiz.explanation : "Chưa đúng. " + lesson.quiz.explanation + " Hãy thử lại.";
  }, [lesson, quizSubmitted, selected]);

  if (!lesson) {
    return <View style={styles.screen}><AppGradientBackground /><View style={styles.content}><Text style={styles.title}>Không tìm thấy bài học</Text><TouchableOpacity style={styles.button} onPress={() => router.replace("/learning-path" as any)}><Text style={styles.buttonText}>Về Learning Path</Text></TouchableOpacity></View></View>;
  }

  return (
    <View style={styles.screen}>
      <AppGradientBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.push("/learning-path" as any)}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.muted}>Learning Path</Text>
        </TouchableOpacity>
        <View style={styles.breadcrumb}><Ionicons name="school-outline" size={15} color={colors.accent}/><Text style={styles.breadcrumbText}>{module?.title} · Bài {index + 1}/{learningLessons.length}</Text></View>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.subtitle}>{lesson.objective}</Text>
        <View style={styles.meta}>
          <View style={styles.pill}><Ionicons name="time-outline" size={14} color={colors.accent}/><Text style={styles.pillText}>{lesson.minutes} phút</Text></View>
          <View style={styles.pill}><Ionicons name="book-outline" size={14} color={colors.accent}/><Text style={styles.pillText}>{lesson.level}</Text></View>
          <View style={[styles.pill, completed && styles.successPill]}><Ionicons name={completed ? "checkmark-circle" : isStarted ? "hourglass-outline" : "ellipse-outline"} size={14} color={completed ? colors.positive : colors.accent}/><Text style={styles.pillText}>{completed ? "Đã hoàn thành" : isStarted ? "Đang học" : "Chưa bắt đầu"}</Text></View>
        </View>

        {!user && !authLoading && (
          <TouchableOpacity style={styles.guestBanner} onPress={() => router.push("/login" as any)}>
            <Ionicons name="person-circle-outline" color={colors.accent} size={21}/>
            <Text style={[styles.muted, {flex: 1}]}>Đăng nhập để lưu kết quả bài học và đồng bộ tiến độ.</Text>
            <Ionicons name="chevron-forward" color={colors.accent} size={18}/>
          </TouchableOpacity>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {syncing && user && <Text style={styles.muted}>Đang tải tiến độ...</Text>}
        {user && !syncing && !isStarted && (
          <TouchableOpacity style={styles.startButton} disabled={busy} onPress={begin}>
            <Ionicons name="play" color="#FFFFFF" size={17}/>
            <Text style={styles.buttonText}>{busy ? "Đang lưu..." : "Bắt đầu bài học"}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="book-outline" color={colors.accent} size={20}/></View><Text style={styles.sectionTitle}>Kiến thức chính</Text></View>
          {lesson.theory.map((line, i) => <View key={i} style={styles.point}><View style={styles.dot}/><Text style={styles.body}>{line}</Text></View>)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="musical-notes-outline" color={colors.accent} size={20}/></View><Text style={styles.sectionTitle}>Bài tập thực hành</Text></View>
          <Text style={styles.muted}>Đánh dấu từng thao tác sau khi bạn thực sự luyện tập.</Text>
          {lesson.exercises.map((task, i) => {
            const done = checked.includes(i);
            return (
              <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: done }} key={i} style={styles.task} onPress={() => setChecked((old) => done ? old.filter((v) => v !== i) : [...old, i])}>
                <Ionicons name={done ? "checkbox" : "square-outline"} size={23} color={done ? colors.accent : colors.textMuted}/>
                <Text style={[styles.body, { flex: 1 }]}>{task}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.smallProgress}>Đã thực hành {checked.length}/{lesson.exercises.length} thao tác</Text>
        </View>

        {relatedTabId && (
          <TouchableOpacity
            style={styles.relatedTab}
            accessibilityRole="button"
            accessibilityLabel="Mở Guitar Tab luyện tập"
            onPress={() => router.push(("/practice/tab/" + relatedTabId) as any)}
          >
            <View style={styles.relatedTabIcon}><Ionicons name="list-outline" color={colors.accent} size={24}/></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.relatedTabTitle}>Luyện với Guitar Tabs</Text>
              <Text style={styles.muted}>Mở bài tab liên quan · Điều chỉnh BPM · Nghe từng nốt</Text>
            </View>
            <Ionicons name="arrow-forward" color={colors.accent} size={19}/>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="help-circle-outline" color={colors.accent} size={21}/></View><Text style={styles.sectionTitle}>Kiểm tra kiến thức</Text></View>
          <Text style={styles.question}>{lesson.quiz.question}</Text>
          {lesson.quiz.choices.map((choice, i) => (
            <TouchableOpacity key={i} accessibilityRole="radio" accessibilityState={{ selected: selected === i }} style={[styles.choice, selected === i && styles.choiceSelected]} onPress={() => { setSelected(i); setQuizSubmitted(false); }}>
              <Ionicons name={selected === i ? "radio-button-on" : "radio-button-off"} size={20} color={selected === i ? colors.accent : colors.textMuted}/>
              <Text style={[styles.body, {flex: 1}]}>{choice}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.outlineButton, selected === null && styles.disabled]} disabled={selected === null} onPress={() => setQuizSubmitted(true)}>
            <Text style={styles.outlineText}>Kiểm tra đáp án</Text>
          </TouchableOpacity>
          {quizSubmitted && <Text style={[styles.feedback, quizCorrect && {color: colors.positive}]}>{quizFeedback}</Text>}
        </View>

        {completed ? (
          <View style={styles.completeCard}>
            <Ionicons name="checkmark-circle" color={colors.positive} size={27}/>
            <View style={{flex: 1}}><Text style={styles.completeTitle}>Bạn đã hoàn thành bài học!</Text><Text style={styles.muted}>Tiến độ đã được lưu vào Firestore.</Text></View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, (!user || !isStarted || !allChecked || !quizCorrect || busy || syncing) && styles.disabled]}
            disabled={!user || !isStarted || !allChecked || !quizCorrect || busy || syncing}
            onPress={finish}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF"/>
            <Text style={styles.buttonText}>{busy ? "Đang lưu tiến độ..." : "Hoàn thành bài học"}</Text>
          </TouchableOpacity>
        )}
        {!completed && <Text style={styles.hint}>Để hoàn thành, hãy bắt đầu bài học, thực hành đủ {lesson.exercises.length} thao tác và trả lời đúng câu hỏi.</Text>}

        <View style={styles.navigation}>
          {previous ? <TouchableOpacity style={styles.navigationButton} onPress={() => router.replace(`/learning-path/${previous.id}` as any)}><Ionicons name="arrow-back" size={18} color={colors.accent}/><Text style={styles.navigationText}>Bài trước</Text></TouchableOpacity> : <View/>}
          {next ? <TouchableOpacity style={styles.navigationButton} onPress={() => router.replace(`/learning-path/${next.id}` as any)}><Text style={styles.navigationText}>Bài tiếp</Text><Ionicons name="arrow-forward" size={18} color={colors.accent}/></TouchableOpacity> : <TouchableOpacity style={styles.navigationButton} onPress={() => router.replace("/learning-path" as any)}><Text style={styles.navigationText}>Xem lộ trình</Text><Ionicons name="arrow-forward" size={18} color={colors.accent}/></TouchableOpacity>}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gradientEnd },
  content: { width: "100%", maxWidth: 830, alignSelf: "center", padding: 22, paddingTop: 30, paddingBottom: 100 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 23 },
  breadcrumb: { flexDirection: "row", gap: 7, alignItems: "center", marginBottom: 12 },
  breadcrumbText: {color: colors.accent, fontSize: 11, fontWeight: "700"},
  title: {color: colors.text, fontSize: 29, fontWeight: "800", lineHeight: 36},
  subtitle: {color: colors.textSoft, fontSize: 14, lineHeight: 22, marginTop: 10},
  meta: {flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 19, marginBottom: 15},
  pill: {flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.surfaceMuted, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.border},
  pillText: {color: colors.textSoft, fontSize: 11, fontWeight: "600"},
  successPill: {borderColor: "rgba(74,222,128,0.35)"},
  guestBanner: {backgroundColor: colors.surfaceRaised, padding: 15, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, borderWidth: 1, borderColor: colors.border},
  section: {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 19, marginTop: 17},
  sectionHeader: {flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 13},
  sectionIcon: {width: 35, height: 35, borderRadius: 11, backgroundColor: colors.accentSoft, justifyContent: "center", alignItems: "center"},
  sectionTitle: {color: colors.text, fontSize: 18, fontWeight: "800"},
  point: {flexDirection: "row", gap: 11, marginTop: 12},
  dot: {width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 7},
  body: {color: colors.textSoft, flexShrink: 1, fontSize: 13, lineHeight: 22},
  muted: {color: colors.textMuted, fontSize: 12, lineHeight: 19},
  task: {flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colors.surfaceMuted, padding: 12, borderRadius: 11, marginTop: 11},
  smallProgress: {color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 13},
  question: {color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 23, marginBottom: 7},
  choice: {flexDirection: "row", gap: 10, alignItems: "center", borderWidth: 1, borderColor: colors.border, padding: 13, borderRadius: 11, marginTop: 10, backgroundColor: colors.surfaceDeep},
  choiceSelected: {borderColor: colors.borderAccent, backgroundColor: colors.activeSoft},
  outlineButton: {marginTop: 15, padding: 13, borderColor: colors.borderAccent, borderWidth: 1, borderRadius: 12, alignItems: "center"},
  outlineText: {color: colors.accent, fontWeight: "800"},
  feedback: {color: colors.negative, marginTop: 14, fontSize: 13, lineHeight: 21},
  button: {padding: 15, backgroundColor: colors.action, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 14, marginTop: 20},
  startButton: {padding: 15, backgroundColor: colors.action, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 14, marginTop: 17},
  buttonText: {color: "#FFFFFF", fontWeight: "800", fontSize: 13},
  disabled: {opacity: 0.45},
  completeCard: {backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: "rgba(74,222,128,0.35)", padding: 17, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18},
  completeTitle: {color: colors.text, fontWeight: "800"},
  hint: {color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: 10, textAlign: "center"},
  relatedTab: {flexDirection:"row", alignItems:"center", gap:12, backgroundColor:colors.surfaceRaised, borderRadius:17, borderWidth:1, borderColor:colors.borderAccent, padding:16, marginTop:17},
  relatedTabIcon: {backgroundColor:colors.accentSoft, padding:10, borderRadius:12},
  relatedTabTitle: {color:colors.text, fontSize:15, fontWeight:"800"},
  navigation: {flexDirection: "row", justifyContent: "space-between", marginTop: 27, gap: 15},
  navigationButton: {flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, borderRadius: 13},
  navigationText: {color: colors.accent, fontSize: 12, fontWeight: "800"},
  error: {color: colors.negative, fontSize: 13, marginTop: 12},
});
