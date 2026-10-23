import { uploadRecordingAudio } from "../../services/recordMediaService";
import { colors } from "../../theme/colors";
import AppGradientBackground from "../../components/ui/AppGradientBackground";
import {
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
  createRecordProject,
} from "../../services/recordService";

import AudioRecorder
  from "../../components/practice/AudioRecorder";

export default function RecordScreen() {
  const {
    user,
  } = useAuth();

  const [
    title,
    setTitle,
  ] = useState(
    "New Recording"
  );

  const [
    audioUri,
    setAudioUri,
  ] =
    useState<
      string | null
    >(null);

  const [
    durationMillis,
    setDurationMillis,
  ] =
    useState(0);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  async function handleSave() {
    if (
      !user ||
      !audioUri ||
      saving ||
      saved
    ) {
      return;
    }

    if (
      !title.trim()
    ) {
      setMessage(
        "Hãy đặt tên cho bản ghi."
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const uploadedAudioUrl = await uploadRecordingAudio(audioUri);

      await createRecordProject(
        user.uid,
        {
          title:
            title.trim(),

          durationSeconds:
            durationMillis /
            1000,

          audioUri: uploadedAudioUrl,
        }
      );

      setSaved(true);

      setMessage(
        "Đã lưu recording thành công ✓"
      );
    } catch (error) {
      console.error(
        "Save record project error:",
        error
      );

      setMessage(
        "Không thể lưu recording."
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
      <AppGradientBackground />
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.iconButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View>
            <Text
              style={
                styles.title
              }
            >
              Record
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Capture your guitar ideas
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Project Name
        </Text>

        <TextInput
          value={title}
          onChangeText={
            setTitle
          }
          placeholder="Recording title"
          placeholderTextColor={colors.textMuted}
          style={
            styles.titleInput
          }
        />

        <Text
          style={
            styles.sectionTitle
          }
        >
          Recording
        </Text>

        <AudioRecorder
          onRecordingCleared={() => {
            setAudioUri(null);
            setDurationMillis(0);
            setSaved(false);
            setMessage("");
          }}
          onRecordingReady={(
            result
          ) => {
            setAudioUri(
              result.uri
            );

            setDurationMillis(
              result.durationMillis
            );

            setSaved(false);

            setMessage("");
          }}
        />

        {message !== "" && (
          <Text
            style={
              styles.message
            }
          >
            {message}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,

            (
              !audioUri ||
              saving ||
              saved
            ) &&
              styles.disabled,
          ]}
          disabled={
            !audioUri ||
            saving ||
            saved
          }
          onPress={
            handleSave
          }
        >
          <Ionicons
            name={
              saved
                ? "checkmark-circle-outline"
                : "save-outline"
            }
            size={19}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.saveText
            }
          >
            {saving
              ? "Saving..."
              : saved
                ? "Saved"
                : "Save Project"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor: "#355C7D",
    },

    content: {
      width: "100%",

      maxWidth: 800,

      alignSelf:
        "center",

      padding: 24,

      paddingTop: 35,

      paddingBottom: 70,
    },

    header: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 13,

      marginBottom: 25,
    },

    iconButton: {
      width: 44,

      height: 44,

      borderRadius: 14,

      backgroundColor:
        colors.surface,

      alignItems:
        "center",

      justifyContent:
        "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    title: {
      color: "#FFFFFF",

      fontSize: 25,

      fontWeight:
        "bold",
    },

    subtitle: {
      color: colors.textMuted,

      fontSize: 11,

      marginTop: 3,
    },

    sectionTitle: {
      color: "#FFFFFF",

      fontSize: 16,

      fontWeight:
        "bold",

      marginTop: 20,

      marginBottom: 10,
    },

    titleInput: {
      backgroundColor:
        colors.surface,

      borderRadius: 14,

      padding: 14,

      color: "#FFFFFF",

      borderWidth: 1,

      borderColor:
        colors.border,
    },

    saveButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 8,

      backgroundColor:
        colors.action,

      borderRadius: 14,

      paddingVertical: 14,

      marginTop: 22,
    },

    saveText: {
      color: "#FFFFFF",

      fontWeight:
        "bold",

      fontSize: 12,
    },

    message: {
      color: "#F87171",

      textAlign:
        "center",

      marginTop: 14,
    },

    disabled: {
      opacity: 0.45,
    },
  });