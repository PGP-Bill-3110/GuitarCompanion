import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
            color="#A78BFA"
          />

          <Text style={styles.badgeText}>
            Score
          </Text>
        </View>
      </View>

      <PracticeSessionBar
        sourceType="score"
        sourceId={song.id}
        title={song.title}
        bpm={song.bpm}
      />

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
        color="#A78BFA"
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

      backgroundColor: "#0B0B0F",
    },

    header: {
      minHeight: 78,

      paddingHorizontal: 18,
      paddingVertical: 11,

      flexDirection: "row",

      alignItems: "center",

      backgroundColor: "#0B0B0F",
    },

    backButton: {
      width: 45,
      height: 45,

      borderRadius: 14,

      backgroundColor: "#17171D",

      alignItems: "center",
      justifyContent: "center",
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
      color: "#888",

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

      backgroundColor: "#17171D",
    },

    badgeText: {
      color: "#A78BFA",

      fontSize: 12,

      fontWeight: "600",
    },

    viewer: {
      flex: 1,

      overflow: "hidden",
    },

    errorScreen: {
      flex: 1,

      backgroundColor: "#0B0B0F",

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

      backgroundColor: "#7C3AED",
    },

    errorButtonText: {
      color: "#FFFFFF",

      fontWeight: "bold",
    },
  });