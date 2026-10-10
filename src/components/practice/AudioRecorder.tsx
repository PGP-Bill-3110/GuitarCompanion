import {
  useEffect,
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
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

interface RecordingResult {
  uri: string;
  durationMillis: number;
}

interface Props {
  onRecordingReady?: (
    result: RecordingResult
  ) => void;
}

export default function AudioRecorder({
  onRecordingReady,
}: Props) {
  // =====================================
  // RECORDER
  // =====================================

  const recorder =
    useAudioRecorder(
      RecordingPresets.HIGH_QUALITY
    );

  const recorderState =
    useAudioRecorderState(
      recorder,
      200
    );

  // =====================================
  // PLAYER
  // =====================================

  const player =
    useAudioPlayer(null);

  const playerStatus =
    useAudioPlayerStatus(
      player
    );

  // =====================================
  // STATE
  // =====================================

  const [
    permissionGranted,
    setPermissionGranted,
  ] = useState(false);

  const [
    recordingUri,
    setRecordingUri,
  ] =
    useState<
      string | null
    >(null);

  const [
    recordedDuration,
    setRecordedDuration,
  ] = useState(0);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    working,
    setWorking,
  ] = useState(false);

  // =====================================
  // INITIALIZE AUDIO
  // =====================================

  useEffect(() => {
    async function initializeAudio() {
      try {
        const permission =
          await AudioModule
            .requestRecordingPermissionsAsync();

        setPermissionGranted(
          permission.granted
        );

        if (
          !permission.granted
        ) {
          setMessage(
            "Microphone permission is required."
          );

          return;
        }

        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (error) {
        console.error(
          "Audio initialization error:",
          error
        );

        setMessage(
          "Không thể khởi tạo microphone."
        );
      }
    }

    initializeAudio();
  }, []);

  // =====================================
  // START RECORDING
  // =====================================

  async function startRecording() {
    if (working) {
      return;
    }

    try {
      setWorking(true);
      setMessage("");

      // Nếu user trước đó từ chối
      // permission thì thử request lại.
      if (!permissionGranted) {
        const permission =
          await AudioModule
            .requestRecordingPermissionsAsync();

        if (
          !permission.granted
        ) {
          setMessage(
            "Bạn cần cho phép truy cập microphone."
          );

          return;
        }

        setPermissionGranted(
          true
        );
      }

      // Dừng playback cũ.
      if (
        playerStatus.playing
      ) {
        player.pause();
      }

      // Recording mode.
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      // Xóa recording trước khỏi UI.
      setRecordingUri(
        null
      );

      setRecordedDuration(
        0
      );

      await recorder
        .prepareToRecordAsync();

      recorder.record();
    } catch (error) {
      console.error(
        "Start recording error:",
        error
      );

      setMessage(
        "Không thể bắt đầu thu âm."
      );
    } finally {
      setWorking(false);
    }
  }

  // =====================================
  // STOP RECORDING
  // =====================================

  async function stopRecording() {
    if (
      !recorderState.isRecording ||
      working
    ) {
      return;
    }

    try {
      setWorking(true);

      // Capture duration trước khi stop.
      const duration =
        recorderState.durationMillis;

      await recorder.stop();

      const uri =
        recorder.uri;

      if (!uri) {
        throw new Error(
          "Recording URI missing"
        );
      }

      setRecordingUri(
        uri
      );

      setRecordedDuration(
        duration
      );

      // Chuẩn bị player.
      player.replace(
        uri
      );

      // Chuyển khỏi recording mode
      // để playback bình thường.
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });

      setMessage(
        "Recording ready ✓"
      );

      onRecordingReady?.({
        uri,
        durationMillis:
          duration,
      });

      console.log(
        "Recorded audio URI:",
        uri
      );

      console.log(
        "Duration:",
        duration
      );
    } catch (error) {
      console.error(
        "Stop recording error:",
        error
      );

      setMessage(
        "Không thể hoàn tất bản thu."
      );
    } finally {
      setWorking(false);
    }
  }

  // =====================================
  // PLAY / PAUSE
  // =====================================

  async function togglePlayback() {
    if (!recordingUri) {
      return;
    }

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });

      if (
        playerStatus.playing
      ) {
        player.pause();

        return;
      }

      // Nếu đã phát hết thì quay lại đầu.
      if (
        playerStatus.duration >
          0 &&
        playerStatus.currentTime >=
          playerStatus.duration -
            0.1
      ) {
        await player.seekTo(
          0
        );
      }

      player.play();
    } catch (error) {
      console.error(
        "Playback error:",
        error
      );

      setMessage(
        "Không thể phát bản thu."
      );
    }
  }

  // =====================================
  // DISCARD
  // =====================================

  function discardRecording() {
    if (
      playerStatus.playing
    ) {
      player.pause();
    }

    setRecordingUri(
      null
    );

    setRecordedDuration(
      0
    );

    setMessage("");
  }

  // =====================================
  // UI
  // =====================================

  return (
    <View
      style={
        styles.container
      }
    >
      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.icon
          }
        >
          <Ionicons
            name="mic"
            size={24}
            color="#A78BFA"
          />
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.title
            }
          >
            Guitar Recording
          </Text>

          <Text
            style={
              styles.description
            }
          >
            Record a short guitar
            performance for analysis.
          </Text>
        </View>
      </View>

      {/* ============================= */}
      {/* RECORDING */}
      {/* ============================= */}

      {recorderState.isRecording && (
        <View
          style={
            styles.recordingBox
          }
        >
          <View
            style={
              styles.recordingStatus
            }
          >
            <View
              style={
                styles.recordingDot
              }
            />

            <Text
              style={
                styles.recordingText
              }
            >
              Recording guitar...
            </Text>
          </View>

          <Text
            style={
              styles.timer
            }
          >
            {formatDuration(
              recorderState.durationMillis
            )}
          </Text>

          <Text
            style={
              styles.recordingHint
            }
          >
            Play clearly and keep the
            guitar close to the
            microphone.
          </Text>
        </View>
      )}

      {/* ============================= */}
      {/* READY */}
      {/* ============================= */}

      {recordingUri &&
        !recorderState.isRecording && (
          <View
            style={
              styles.readyBox
            }
          >
            <View
              style={
                styles.readyHeader
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={21}
                color="#4ADE80"
              />

              <View>
                <Text
                  style={
                    styles.readyTitle
                  }
                >
                  Recording ready
                </Text>

                <Text
                  style={
                    styles.readyDuration
                  }
                >
                  {formatDuration(
                    recordedDuration
                  )}
                </Text>
              </View>
            </View>

            {/* PLAYBACK */}

            <TouchableOpacity
              style={
                styles.playButton
              }
              onPress={
                togglePlayback
              }
            >
              <Ionicons
                name={
                  playerStatus.playing
                    ? "pause"
                    : "play"
                }
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.playButtonText
                }
              >
                {playerStatus.playing
                  ? "Pause"
                  : "Play Recording"}
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.playbackTime
              }
            >
              <Text
                style={
                  styles.playbackTimeText
                }
              >
                {formatSeconds(
                  playerStatus.currentTime
                )}
              </Text>

              <Text
                style={
                  styles.playbackTimeText
                }
              >
                {formatDuration(
                  recordedDuration
                )}
              </Text>
            </View>
          </View>
        )}

      {/* ============================= */}
      {/* ACTION */}
      {/* ============================= */}

      {!recorderState.isRecording ? (
        <TouchableOpacity
          style={[
            styles.recordButton,

            working &&
              styles.disabled,
          ]}
          disabled={
            working
          }
          onPress={
            startRecording
          }
        >
          <View
            style={
              styles.recordCircle
            }
          />

          <Text
            style={
              styles.recordButtonText
            }
          >
            {recordingUri
              ? "Record Again"
              : "Start Recording"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.stopButton,

            working &&
              styles.disabled,
          ]}
          disabled={
            working
          }
          onPress={
            stopRecording
          }
        >
          <Ionicons
            name="stop"
            size={18}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.recordButtonText
            }
          >
            Stop Recording
          </Text>
        </TouchableOpacity>
      )}

      {/* DISCARD */}

      {recordingUri &&
        !recorderState.isRecording && (
          <TouchableOpacity
            style={
              styles.discardButton
            }
            onPress={
              discardRecording
            }
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#F87171"
            />

            <Text
              style={
                styles.discardText
              }
            >
              Discard recording
            </Text>
          </TouchableOpacity>
        )}

      {/* MESSAGE */}

      {message !== "" && (
        <Text
          style={[
            styles.message,

            message.includes(
              "✓"
            ) &&
              styles.successMessage,
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

// ========================================
// HELPERS
// ========================================

function formatDuration(
  milliseconds: number
) {
  const totalSeconds =
    Math.floor(
      milliseconds / 1000
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return `${minutes
    .toString()
    .padStart(
      2,
      "0"
    )}:${seconds
    .toString()
    .padStart(
      2,
      "0"
    )}`;
}

function formatSeconds(
  seconds: number
) {
  const safeSeconds =
    Number.isFinite(
      seconds
    )
      ? seconds
      : 0;

  const total =
    Math.floor(
      safeSeconds
    );

  const minutes =
    Math.floor(
      total / 60
    );

  const remaining =
    total % 60;

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

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({
    container: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        "#312747",

      padding: 16,
    },

    header: {
      flexDirection: "row",

      alignItems: "center",

      gap: 12,
    },

    icon: {
      width: 48,
      height: 48,

      borderRadius: 14,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      color: "#FFFFFF",

      fontSize: 14,

      fontWeight: "bold",
    },

    description: {
      color: "#777",

      fontSize: 10,

      lineHeight: 15,

      marginTop: 3,
    },

    recordingBox: {
      backgroundColor:
        "#251517",

      borderWidth: 1,

      borderColor:
        "#4C2227",

      borderRadius: 15,

      marginTop: 15,

      padding: 16,

      alignItems: "center",
    },

    recordingStatus: {
      flexDirection: "row",

      alignItems: "center",

      gap: 7,
    },

    recordingDot: {
      width: 9,
      height: 9,

      borderRadius: 5,

      backgroundColor:
        "#EF4444",
    },

    recordingText: {
      color: "#FCA5A5",

      fontSize: 11,

      fontWeight: "600",
    },

    timer: {
      color: "#FFFFFF",

      fontSize: 30,

      fontWeight: "bold",

      marginTop: 10,
    },

    recordingHint: {
      color: "#777",

      fontSize: 9,

      textAlign: "center",

      marginTop: 7,
    },

    readyBox: {
      backgroundColor:
        "#101A13",

      borderWidth: 1,

      borderColor:
        "#24482D",

      borderRadius: 15,

      padding: 14,

      marginTop: 15,
    },

    readyHeader: {
      flexDirection: "row",

      alignItems: "center",

      gap: 9,
    },

    readyTitle: {
      color: "#FFFFFF",

      fontSize: 12,

      fontWeight: "bold",
    },

    readyDuration: {
      color: "#4ADE80",

      fontSize: 10,

      marginTop: 2,
    },

    playButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        "#24242C",

      borderRadius: 11,

      paddingVertical: 10,

      marginTop: 12,
    },

    playButtonText: {
      color: "#FFFFFF",

      fontSize: 10,

      fontWeight: "600",
    },

    playbackTime: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      marginTop: 8,
    },

    playbackTimeText: {
      color: "#666",

      fontSize: 9,
    },

    recordButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      backgroundColor:
        "#7C3AED",

      borderRadius: 13,

      paddingVertical: 12,

      marginTop: 15,
    },

    recordCircle: {
      width: 13,
      height: 13,

      borderRadius: 7,

      backgroundColor:
        "#FFFFFF",
    },

    stopButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      backgroundColor:
        "#DC2626",

      borderRadius: 13,

      paddingVertical: 12,

      marginTop: 15,
    },

    recordButtonText: {
      color: "#FFFFFF",

      fontSize: 11,

      fontWeight: "bold",
    },

    discardButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 6,

      paddingVertical: 9,

      marginTop: 5,
    },

    discardText: {
      color: "#F87171",

      fontSize: 9,
    },

    message: {
      color: "#FCA5A5",

      fontSize: 10,

      textAlign: "center",

      marginTop: 7,
    },

    successMessage: {
      color: "#4ADE80",
    },

    disabled: {
      opacity: 0.5,
    },
  });