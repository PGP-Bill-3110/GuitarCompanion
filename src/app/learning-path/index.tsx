import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppGradientBackground from "../../components/ui/AppGradientBackground";
import { colors } from "../../theme/colors";
import { learningLessons, learningModules } from "../../data/learningPath";
import { useAuth } from "../../context/AuthContext";
import { LearningProgressById, subscribeLearningProgress } from "../../services/learningProgressService";

export default function LearningPathScreen() {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<LearningProgressById>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProgress({});
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    return subscribeLearningProgress(
      user.uid,
      (next) => { setProgress(next); setLoading(false); },
      () => { setLoading(false); setError("Không tải được tiến độ. Hãy kiểm tra Firestore Rules hoặc kết nối mạng."); },
    );
  }, [authLoading, user?.uid]);

  const completedCount = useMemo(
    () => learningLessons.filter((item) => progress[item.id]?.status === "completed").length,
    [progress]
  );
  const startedCount = learningLessons.filter((item) => progress[item.id]?.status === "in_progress").length;
  const nextLesson = learningLessons.find((item) => progress[item.id]?.status !== "completed");
  const percent = Math.round((completedCount / learningLessons.length) * 100);

  return (
    <View style={styles.screen}>
      <AppGradientBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Practice</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>GUITARCOMPANION ACADEMY</Text>
        <Text style={styles.title}>Your Learning Path</Text>
        <Text style={styles.subtitle}>Từng bước làm quen guitar, từ những nốt đầu tiên tới phần đệm hoàn chỉnh.</Text>
        <View style={styles.overview}>
          <View style={styles.statsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>BEGINNER GUITAR</Text>
              <Text style={styles.overviewTitle}>{completedCount} / {learningLessons.length} bài học</Text>
              <Text style={styles.muted}>{startedCount} bài đang học · {learningModules.length} module</Text>
            </View>
            <View style={styles.percentCircle}><Text style={styles.percentText}>{percent}%</Text></View>
          </View>
          <View style={styles.track}><View style={[styles.trackFill, { width: `${percent}%` }]} /></View>
          <Text style={styles.progressHint}>Tiến độ được lưu theo tài khoản Firebase khi bạn hoàn thành bài học.</Text>
        </View>
        {!user && !authLoading && (
          <TouchableOpacity style={styles.loginNote} onPress={() => router.push("/login" as any)}>
            <Ionicons name="person-circle-outline" size={23} color={colors.accent} />
            <Text style={[styles.muted, { flex: 1 }]}>Bạn có thể xem nội dung miễn phí. Đăng nhập để lưu tiến độ qua nhiều lần học.</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}
        {loading && <Text style={styles.muted}>Đang đồng bộ tiến độ học...</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {nextLesson && (
          <TouchableOpacity style={styles.continueCard} onPress={() => router.push(`/learning-path/${nextLesson.id}` as any)}>
            <View style={styles.continueHeading}><Ionicons name="play-circle" size={24} color={colors.accent} /><Text style={styles.continueLabel}>HỌC TIẾP</Text></View>
            <Text style={styles.continueTitle}>{nextLesson.title}</Text>
            <Text style={styles.muted}>{nextLesson.minutes} phút · {progress[nextLesson.id]?.status === "in_progress" ? "Đang học" : "Bài tiếp theo"}</Text>
            <Text style={styles.continueAction}>Mở bài học  <Ionicons name="arrow-forward" size={15} /></Text>
          </TouchableOpacity>
        )}
        {!nextLesson && <View style={styles.continueCard}><Text style={styles.continueTitle}>Chúc mừng! Bạn đã hoàn thành cả lộ trình 🎉</Text><Text style={styles.muted}>Có thể xem lại bất kỳ bài học nào để ôn tập.</Text></View>}
        {learningModules.map((module, moduleIndex) => {
          const items = learningLessons.filter((item) => item.moduleId === module.id);
          const done = items.filter((item) => progress[item.id]?.status === "completed").length;
          return (
            <View style={styles.module} key={module.id}>
              <View style={styles.moduleTop}>
                <View style={styles.moduleIcon}><Ionicons name={module.icon as any} size={23} color={colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={styles.moduleTitle}>{module.title}</Text><Text style={styles.muted}>{module.description}</Text></View>
                <Text style={styles.count}>{done}/{items.length}</Text>
              </View>
              {items.map((lesson, idx) => {
                const status = progress[lesson.id]?.status;
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[styles.lessonRow, idx !== items.length - 1 && styles.lessonDivider]}
                    onPress={() => router.push(`/learning-path/${lesson.id}` as any)}
                    accessibilityRole="button"
                    accessibilityLabel={lesson.title}
                  >
                    <View style={[styles.lessonNumber, status === "completed" && styles.doneNumber]}>
                      {status === "completed" ? <Ionicons name="checkmark" size={20} color="#FFFFFF"/> : <Text style={styles.numberText}>{moduleIndex * 3 + idx + 1}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.muted}>{lesson.minutes} phút · {status === "completed" ? "Đã hoàn thành" : status === "in_progress" ? "Đang học" : "Chưa bắt đầu"}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        <Text style={styles.footnote}>Nội dung luyện tập cơ bản do GuitarCompanion biên soạn. Kết quả quiz là tự đánh giá, không phải điểm AI.</Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gradientEnd },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 22, paddingTop: 28, paddingBottom: 90 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 22 },
  backText: { color: colors.textSoft, fontWeight: "600" },
  eyebrow: { color: "#F7CFDF", fontSize: 11, letterSpacing: 2, fontWeight: "800", marginBottom: 9 },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  subtitle: { color: colors.textSoft, marginTop: 8, marginBottom: 22, lineHeight: 21 },
  overview: { backgroundColor: colors.surface, borderRadius: 22, borderColor: colors.border, borderWidth: 1, padding: 22, marginBottom: 16 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardLabel: { color: colors.accent, fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  overviewTitle: { color: colors.text, fontSize: 23, fontWeight: "800", marginTop: 8 },
  muted: { color: colors.textSoft, fontSize: 12, lineHeight: 18, marginTop: 5 },
  percentCircle: { width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: colors.borderAccent, justifyContent: "center", alignItems: "center", backgroundColor: colors.accentSoft },
  percentText: { color: colors.text, fontWeight: "800", fontSize: 17 },
  track: { height: 9, borderRadius: 8, backgroundColor: colors.surfaceMuted, overflow: "hidden", marginTop: 19 },
  trackFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 8 },
  progressHint: { color: colors.textMuted, fontSize: 11, marginTop: 12 },
  loginNote: { flexDirection: "row", gap: 10, padding: 14, backgroundColor: colors.surfaceRaised, borderRadius: 16, borderColor: colors.border, borderWidth: 1, marginBottom: 16, alignItems: "center" },
  error: { color: colors.negative, marginBottom: 12, fontSize: 13 },
  continueCard: { backgroundColor: colors.surfaceRaised, borderRadius: 20, padding: 20, marginVertical: 15, borderWidth: 1, borderColor: colors.borderAccent },
  continueHeading: { flexDirection: "row", gap: 8, alignItems: "center" },
  continueLabel: { color: colors.accent, fontSize: 11, letterSpacing: 1, fontWeight: "800" },
  continueTitle: { color: colors.text, fontSize: 21, fontWeight: "800", marginTop: 11 },
  continueAction: { color: "#E8D5FF", marginTop: 17, fontWeight: "700" },
  module: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, marginTop: 16, overflow: "hidden" },
  moduleTop: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 20 },
  moduleIcon: { width: 43, height: 43, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  moduleTitle: { color: colors.text, fontWeight: "800", fontSize: 15 },
  count: { color: colors.accent, fontWeight: "800", fontSize: 13 },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15 },
  lessonDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  lessonNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.surfaceMuted, justifyContent: "center", alignItems: "center" },
  doneNumber: { backgroundColor: colors.action },
  numberText: { color: colors.textSoft, fontWeight: "700" },
  lessonTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  footnote: { color: colors.textMuted, textAlign: "center", fontSize: 11, lineHeight: 18, marginTop: 24 },
});
