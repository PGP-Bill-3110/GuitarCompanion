import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AppGradientBackground from "../../../components/ui/AppGradientBackground";
import { colors } from "../../../theme/colors";
import { guitarTabs } from "../../../data/guitarTabs";

export default function ScoreStudioScreen() {
  const params = useLocalSearchParams<{ demo?: string; mutopia?: string }>();
  const selected = Array.isArray(params.demo) ? params.demo[0] : params.demo;
  const allowedDemo = guitarTabs.some((item) => item.id === selected) ? selected : "open-strings";
  const mutopia = Array.isArray(params.mutopia) ? params.mutopia[0] : params.mutopia;
  const allowedMutopia = ["01", "03", "08"].includes(mutopia || "") ? mutopia : null;
  const src = "/alphatab/studio.html?demo=" + encodeURIComponent(allowedDemo)
    + (allowedMutopia ? "&mutopia=" + allowedMutopia : "");
  return (
    <View style={styles.root}>
      <AppGradientBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF"/>
          <Text style={styles.backText}>Trở về Practice</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>GUITARCOMPANION MUSIC STUDIO</Text>
        <Text style={styles.heading}>alphaTab · MusicXML & Guitar Pro</Text>
        <Text style={styles.subheading}>Nhập MusicXML/Guitar Pro, xem khuông nhạc/tab, phát bằng SoundFont và thay đổi tốc độ. File nhập hợp lệ được lưu trong IndexedDB của trình duyệt này để mở lại sau khi tải lại trang.</Text>
        {Platform.OS === "web" ? (
          <View style={styles.viewer}>
            {React.createElement("iframe" as any, {
              title: "alphaTab Music Studio",
              src,
              allow: "autoplay",
              style: { width: "100%", height: "810px", border: "0", display: "block" },
            })}
          </View>
        ) : (
          <View style={styles.viewer}>
            <Text style={styles.subheading}>MusicXML/Guitar Pro Studio hiện được hỗ trợ trên phiên bản web. Bạn hãy mở GuitarCompanion bằng trình duyệt máy tính.</Text>
          </View>
        )}
        <Text style={styles.note}>Nguồn mở: alphaTab (MPL-2.0), Bravura (SIL OFL), SoundFont SONiVOX (Apache-2.0). Mỗi file nhạc được nhập phải có quyền sử dụng phù hợp; GuitarCompanion không tự chia sẻ file bạn chọn.</Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gradientEnd },
  content: { padding: 20, paddingTop: 28, paddingBottom: 90, width: "100%", maxWidth: 1300, alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 },
  backText: { color: colors.textSoft, fontWeight: "600" },
  kicker: { color: colors.accent, letterSpacing: 2, fontSize: 11, fontWeight: "800" },
  heading: { color: colors.text, fontWeight: "800", fontSize: 27, marginTop: 8 },
  subheading: { color: colors.textSoft, fontSize: 14, marginTop: 10, lineHeight: 22 },
  viewer: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderAccent, borderRadius: 19, marginTop: 23, padding: 12 },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 14 },
});
