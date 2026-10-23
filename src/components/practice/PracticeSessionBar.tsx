import { colors } from "../../theme/colors";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  createPracticeSession,
  PracticeSourceType,
} from "../../services/practiceService";

interface Props {
  sourceType:
    PracticeSourceType;

  sourceId?: string;

  analysisExerciseId?: string;

  title: string;

  bpm?: number;
  startBar?: number;
  endBar?: number;
  trackIndex?: number;
  onPracticeStateChange?: (active: boolean) => void;
}

export default function PracticeSessionBar({
  sourceType,
  sourceId,
  analysisExerciseId,
  title,
  bpm,
  startBar,
  endBar,
  trackIndex,
  onPracticeStateChange,
}: Props) {
  const {
    user,
  } = useAuth();

  const [
    startedAt,
    setStartedAt,
  ] =
    useState<
      number | null
    >(null);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    lastSessionId,
    setLastSessionId,
  ] =
    useState<
      string | null
    >(null);

  // Freeze score metadata at session start, so switching scores cannot
  // accidentally save a session under the wrong title/reference.
  const activeMetadata = useRef({
    sourceType, sourceId, analysisExerciseId, title, bpm, startBar, endBar, trackIndex,
  });

  const practicing =
    startedAt !== null;

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const interval =
      setInterval(() => {
        setElapsedSeconds(
          Math.floor(
            (
              Date.now() -
              startedAt
            ) / 1000
          )
        );
      }, 1000);

    return () =>
      clearInterval(
        interval
      );
  }, [startedAt]);

  function startPractice() {
    if (!user) {
      router.push(
        "/login" as any
      );

      return;
    }

    activeMetadata.current = {
      sourceType, sourceId, analysisExerciseId, title, bpm, startBar, endBar, trackIndex,
    };
    setElapsedSeconds(0);

    setStartedAt(
      Date.now()
    );
    onPracticeStateChange?.(true);

    setLastSessionId(null);
    setMessage("");
  }

  async function finishPractice() {
    if (
      !user ||
      !startedAt ||
      saving
    ) {
      return;
    }

    const seconds =
      Math.max(
        1,
        Math.round(
          (
            Date.now() -
            startedAt
          ) / 1000
        )
      );

    try {
      setSaving(true);

      const sessionId =
        await createPracticeSession(
          user.uid,
          {
            sourceType: activeMetadata.current.sourceType,

            sourceId: activeMetadata.current.sourceId,

            exerciseId: activeMetadata.current.analysisExerciseId,

            title: activeMetadata.current.title,

            durationSeconds:
              seconds,

            bpm: activeMetadata.current.bpm,
            startBar: activeMetadata.current.startBar,
            endBar: activeMetadata.current.endBar,
            trackIndex: activeMetadata.current.trackIndex,
          }
        );

      setLastSessionId(
        sessionId
      );

      setStartedAt(null);
      onPracticeStateChange?.(false);

      setElapsedSeconds(
        0
      );

      setMessage(
        "Practice session saved ✓"
      );
    } catch (error) {
      console.error(
        "Save practice session error:",
        error
      );

      setMessage(
        "Không thể lưu buổi luyện tập."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.info
        }
      >
        <View
          style={[
            styles.dot,

            practicing &&
              styles.activeDot,
          ]}
        />

        <View>
          <Text
            style={
              styles.title
            }
          >
            {practicing
              ? "Practice in progress"
              : "Practice Session"}
          </Text>

          <Text
            style={
              styles.timer
            }
          >
            {formatDuration(
              elapsedSeconds
            )}
          </Text>
        </View>
      </View>

      {!practicing ? (
        <TouchableOpacity
          style={
            styles.startButton
          }
          onPress={
            startPractice
          }
        >
          <Ionicons
            name="play"
            size={17}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.buttonText
            }
          >
            Start Practice
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={
            styles.finishButton
          }
          disabled={saving}
          onPress={
            finishPractice
          }
        >
          <Ionicons
            name="checkmark"
            size={18}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.buttonText
            }
          >
            {saving
              ? "Saving..."
              : "Finish & Save"}
          </Text>
        </TouchableOpacity>
      )}

      {message !== "" && (
        <Text
          style={
            styles.message
          }
        >
          {message}
        </Text>
      )}

      {lastSessionId && (
        <TouchableOpacity
          style={
            styles.reviewButton
          }
          onPress={() =>
            router.push(
              `/practice-session/${lastSessionId}` as any
            )
          }
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={colors.accent}
          />

          <Text
            style={
              styles.reviewText
            }
          >
            Review this session
          </Text>

          <Ionicons
            name="chevron-forward"
            size={15}
            color={colors.accent}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

function formatDuration(
  seconds: number
) {
  const minutes =
    Math.floor(
      seconds / 60
    );

  const remaining =
    seconds % 60;

  return `${minutes
    .toString()
    .padStart(
      2,
      "0"
    )}:${remaining
    .toString()
    .padStart(
      2,
      "0"
    )}`;
}

const styles =
  StyleSheet.create({
    container: {
      backgroundColor:
        colors.surface,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        colors.border,

      padding: 16,

      marginVertical: 16,
    },

    info: {
      flexDirection: "row",

      alignItems: "center",

      gap: 10,
    },

    dot: {
      width: 10,
      height: 10,

      borderRadius: 5,

      backgroundColor:
        colors.textDim,
    },

    activeDot: {
      backgroundColor:
        "#4ADE80",
    },

    title: {
      color: "#FFFFFF",

      fontSize: 13,

      fontWeight: "600",
    },

    timer: {
      color: colors.accent,

      fontSize: 22,

      fontWeight: "bold",

      marginTop: 2,
    },

    startButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        colors.action,

      borderRadius: 12,

      paddingVertical: 11,

      marginTop: 13,
    },

    finishButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        "#16A34A",

      borderRadius: 12,

      paddingVertical: 11,

      marginTop: 13,
    },

    buttonText: {
      color: "#FFFFFF",

      fontSize: 12,

      fontWeight: "bold",
    },

    message: {
      color: "#4ADE80",

      fontSize: 10,

      textAlign: "center",

      marginTop: 9,
    },

    reviewButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,

      backgroundColor:
        colors.accentSoft,

      borderRadius: 11,

      paddingVertical: 10,

      marginTop: 9,
    },

    reviewText: {
      color: colors.accent,

      fontSize: 10,

      fontWeight: "600",
    },
  });