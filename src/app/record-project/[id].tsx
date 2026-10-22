import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useAuth } from "../../context/AuthContext";
import AppGradientBackground from "../../components/ui/AppGradientBackground";
import { colors } from "../../theme/colors";
import {
  RecordProject, subscribeRecordProject, renameRecordProject, deleteRecordProject,
} from "../../services/recordService";

export default function RecordProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<RecordProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!user?.uid || !id) { setLoading(false); return; }
    return subscribeRecordProject(user.uid, id, next => {
      setProject(next);
      setLoading(false);
    });
  }, [user?.uid, id]);

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
  }, [project?.id, project?.title]);

  const unavailable = useMemo(() => {
    const url = project?.audioUri || "";
    return !/^https?:\/\//i.test(url);
  }, [project?.audioUri]);

  useEffect(() => {
    if (!project || unavailable) return;
    try { player.replace(project.audioUri); }
    catch (error) { console.error("Audio load failed", error); setMessage("Không thể mở file audio."); }
  }, [project?.audioUri, unavailable]);

  async function playOrPause() {
    if (unavailable) return;
    try {
      if (status.playing) { player.pause(); return; }
      if (status.duration > 0 && status.currentTime >= status.duration - 0.1) await player.seekTo(0);
      player.play();
    } catch (error) {
      console.error("Playback failed", error);
      setMessage("Không thể phát audio. Hãy kiểm tra FastAPI local.");
    }
  }

  async function saveTitle() {
    if (!user?.uid || !id || !title.trim() || busy) return;
    setBusy(true); setMessage("");
    try {
      await renameRecordProject(user.uid, id, title.trim());
      setMessage("Đã cập nhật tên bản ghi ✓");
    } catch (error) {
      console.error(error); setMessage("Không thể đổi tên bản ghi.");
    } finally { setBusy(false); }
  }

  async function removeProject() {
    if (!user?.uid || !id || busy) return;
    setBusy(true);
    try {
      player.pause();
      await deleteRecordProject(user.uid, id);
      router.replace("/create" as any);
    } catch (error) {
      console.error(error); setMessage("Không thể xóa bản ghi."); setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <AppGradientBackground />
      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backText}>Create / Recent Projects</Text>
        </TouchableOpacity>
        {loading ? <Text style={styles.muted}>Đang tải bản ghi...</Text> : !project ? (
          <Text style={styles.heading}>Không tìm thấy bản ghi.</Text>
        ) : <>
          <Text style={styles.heading}>Record Project</Text>
          <Text style={styles.muted}>{new Date(project.createdAtMs).toLocaleString("vi-VN")} · {formatDuration(project.durationSeconds)}</Text>
          <View style={styles.card}>
            <View style={styles.heroRow}>
              <View style={styles.icon}><Ionicons name="musical-notes" size={27} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectName}>{project.title}</Text>
                <Text style={styles.muted}>Recording · {project.status}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.button, unavailable && styles.disabled]} disabled={unavailable} onPress={playOrPause}>
              <Ionicons name={status.playing ? "pause" : "play"} size={19} color={colors.text} />
              <Text style={styles.buttonText}>{status.playing ? "Pause" : "Play Recording"}</Text>
            </TouchableOpacity>
            <Text style={styles.muted}>{formatDuration(status.currentTime)} / {formatDuration(status.duration || project.durationSeconds)}</Text>
            {unavailable && <Text style={styles.warning}>
              Bản thu cũ chỉ có blob/local URI, không thể khôi phục sau khi reload. Hãy thu lại một bản mới để lưu qua FastAPI.
            </Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Project name</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Recording name" placeholderTextColor={colors.textMuted} />
            <TouchableOpacity style={[styles.button, busy && styles.disabled]} disabled={busy || !title.trim()} onPress={saveTitle}>
              <Ionicons name="save-outline" color={colors.text} size={18} />
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Manage project</Text>
            {confirmDelete ? <>
              <Text style={styles.warning}>Xóa thông tin project khỏi Firestore? File audio local sẽ chưa tự động được dọn.</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.danger, { flex: 1 }]} onPress={removeProject} disabled={busy}>
                  <Text style={styles.buttonText}>Confirm Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondary, { flex: 1 }]} onPress={() => setConfirmDelete(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </> : <TouchableOpacity style={styles.secondary} onPress={() => setConfirmDelete(true)}>
              <Text style={styles.dangerText}>Delete Project</Text>
            </TouchableOpacity>}
          </View>
          {!!message && <Text style={styles.notice}>{message}</Text>}
        </>}
      </ScrollView>
    </View>
  );
}

function formatDuration(value: number) {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gradientEnd },
  body: { width: "100%", maxWidth: 800, alignSelf: "center", padding: 24, paddingTop: 36, paddingBottom: 70, gap: 16 },
  back: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 8 },
  backText: { color: colors.textSoft, fontWeight: "600" },
  heading: { color: colors.text, fontSize: 28, fontWeight: "700", marginTop: 10 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  card: { padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 14 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: { backgroundColor: colors.accentSoft, padding: 16, borderRadius: 15 },
  projectName: { color: colors.text, fontSize: 19, fontWeight: "700", marginBottom: 6 },
  label: { color: colors.text, fontWeight: "700", fontSize: 16 },
  input: { backgroundColor: colors.surfaceDeep, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  button: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: colors.action, borderRadius: 12, padding: 14 },
  buttonText: { color: colors.text, fontWeight: "700" },
  secondary: { padding: 13, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
  danger: { padding: 13, backgroundColor: "#85455B", alignItems: "center", justifyContent: "center", borderRadius: 12 },
  dangerText: { color: "#F5AABB", fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  disabled: { opacity: .45 },
  warning: { color: "#F7C1C8", lineHeight: 20 },
  notice: { color: colors.textSoft, textAlign: "center" },
});
