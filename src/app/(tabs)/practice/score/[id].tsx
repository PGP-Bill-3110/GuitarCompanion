import { colors } from "../../../../theme/colors";
import AppGradientBackground from "../../../../components/ui/AppGradientBackground";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  getSongById,
} from "../../../../data/songs";

import PdfViewer from "../../../../components/PdfViewer.web";

import PracticeSessionBar
  from "../../../../components/practice/PracticeSessionBar";

export default function ScoreScreen() {
  const params =
    useLocalSearchParams();

  const rawId = params.id;

  const songId = Array.isArray(rawId)
    ? rawId[0]
    : rawId;

  const song = songId
    ? getSongById(songId)
    : undefined;

  // SONG NOT FOUND

  if (!song) {
    return (
      <ErrorScreen
        text="Không tìm thấy score."
      />
    );
  }

  // WRONG TYPE

  if (song.type !== "score") {
    return (
      <ErrorScreen
        text="Đây không phải PDF score."
      />
    );
  }

  // NO PDF

  if (!song.pdfUrl) {
    return (
      <ErrorScreen
        text="Score chưa có file PDF."
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppGradientBackground />
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.songInfo}>
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {song.title}
          </Text>

          <Text
            style={styles.artist}
            numberOfLines={1}
          >
            {song.artist}
          </Text>
        </View>

        <View style={styles.badge}>
          <Ionicons
            name="document-text"
            size={17}
            color={colors.accent}
          />

          <Text style={styles.badgeText}>
            Score
          </Text>
        </View>
      </View>

      <PracticeSessionBar
        sourceType="score"
        sourceId={song.id}
        analysisExerciseId={song.analysisExerciseId}
        title={song.title}
        bpm={song.bpm}
      />

      {/* INTERACTIVE MUTOPIA PRACTICE EDITION */}
      {Platform.OS === "web" && song.musicXmlUrl && (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.interactiveButton}
          onPress={() => router.push(
            ("/practice/score-studio?mutopia=" +
              (song.musicXmlUrl?.match(/carcassi-op60-(\d{2})\.musicxml$/)?.[1] || "")) as any
          )}
        >
          <Ionicons name="musical-notes-outline" size={19} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.interactiveTitle}>Luyện tập tương tác với alphaTab</Text>
            <Text style={styles.interactiveDesc}>MusicXML từ MIDI Mutopia · phát nhạc · thay tốc độ</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.accent} />
        </TouchableOpacity>
      )}

      {/* VIEWER */}

      <View style={styles.viewer}>
        <PdfViewer
          file={song.pdfUrl}
        />
      </View>
    </View>
  );
}

function ErrorScreen({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.errorScreen}>
      <Ionicons
        name="warning-outline"
        size={55}
        color={colors.accent}
      />

      <Text style={styles.errorTitle}>
        {text}
      </Text>

      <TouchableOpacity
        style={styles.errorButton}
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={
            styles.errorButtonText
          }
        >
          Quay lại
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor: "#355C7D",
    },

    header: {
      minHeight: 78,

      paddingHorizontal: 18,
      paddingVertical: 11,

      flexDirection: "row",

      alignItems: "center",

      backgroundColor: "#355C7D",
    },

    backButton: {
      width: 45,
      height: 45,

      borderRadius: 14,

      backgroundColor: colors.surface,

      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    songInfo: {
      flex: 1,

      marginHorizontal: 14,
    },

    title: {
      color: "#FFFFFF",

      fontSize: 20,

      fontWeight: "bold",
    },

    artist: {
      color: colors.textSoft,

      fontSize: 13,

      marginTop: 3,
    },

    badge: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,

      paddingHorizontal: 11,
      paddingVertical: 8,

      borderRadius: 11,

      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    badgeText: {
      color: colors.accent,

      fontSize: 12,

      fontWeight: "600",
    },

    interactiveButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderAccent,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 18,
      marginBottom: 8,
    },
    interactiveTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
    interactiveDesc: { color: colors.textSoft, fontSize: 11, marginTop: 3 },
    viewer: {
      flex: 1,

      overflow: "hidden",
    },

    errorScreen: {
      flex: 1,

      backgroundColor: "#355C7D",

      alignItems: "center",
      justifyContent: "center",

      padding: 25,
    },

    errorTitle: {
      color: "#FFFFFF",

      fontSize: 20,

      fontWeight: "bold",

      marginTop: 15,

      textAlign: "center",
    },

    errorButton: {
      marginTop: 20,

      paddingHorizontal: 25,
      paddingVertical: 13,

      borderRadius: 13,

      backgroundColor: colors.action,
    },

    errorButtonText: {
      color: "#FFFFFF",

      fontWeight: "bold",
    },
  });