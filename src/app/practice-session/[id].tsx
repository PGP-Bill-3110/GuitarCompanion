import { colors } from "../../theme/colors";
import AppGradientBackground from "../../components/ui/AppGradientBackground";
import {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  PracticeSession,
  deletePracticeSession,
  subscribePracticeSession,
  updatePracticeAnalysis,
  updatePracticeSession,
} from "../../services/practiceService";

import AudioRecorder
  from "../../components/practice/AudioRecorder";

import {
  AudioAnalysisResult,
  uploadPracticeAudio,
} from "../../services/audioAnalysisService";

const FOCUS_AREAS = [
  "Chords",
  "Timing",
  "Rhythm",
  "Lead",
  "Scales",
  "Speed",
  "Technique",
  "Song",
];

export default function PracticeSessionDetail() {
  const {
    id,
  } =
    useLocalSearchParams<{
      id: string;
    }>();

  const {
    user,
  } = useAuth();

  const [
    session,
    setSession,
  ] =
    useState<
      PracticeSession | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    bpmText,
    setBpmText,
  ] = useState("");

  const [
    selfRating,
    setSelfRating,
  ] =
    useState<
      number | null
    >(null);

  const [
    focusArea,
    setFocusArea,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    audioUri,
    setAudioUri,
  ] =
    useState<
      string | null
    >(null);

  const [
    audioDurationMillis,
    setAudioDurationMillis,
  ] =
    useState(0);

  const [
    analyzing,
    setAnalyzing,
  ] = useState(false);

  const [
    analysisResult,
    setAnalysisResult,
  ] =
    useState<
      AudioAnalysisResult | null
    >(null);

  const [
    analysisError,
    setAnalysisError,
  ] = useState("");
  // ====================================
  // LOAD SESSION
  // ====================================

  useEffect(() => {
    if (
      !user ||
      !id
    ) {
      return;
    }

    return subscribePracticeSession(
      user.uid,
      id,

      (value) => {
        setSession(
          value
        );

        setLoading(
          false
        );
      }
    );
  }, [
    user?.uid,
    id,
  ]);

  // ====================================
  // COPY TO FORM
  // ====================================

  useEffect(() => {
    if (!session) {
      return;
    }

    setBpmText(
      session.bpm
        ? String(
            session.bpm
          )
        : ""
    );

    setSelfRating(
      session.selfRating ??
        null
    );

    setFocusArea(
      session.focusArea ||
        ""
    );

    setNotes(
      session.notes ||
        ""
    );
  }, [session?.id]);

  // ====================================
  // SAVE
  // ====================================

  async function handleSave() {
    if (
      !user ||
      !session
    ) {
      return;
    }

    const parsedBpm =
      bpmText.trim()
        ? Number(
            bpmText
          )
        : null;

    if (
      parsedBpm !== null &&
      (
        !Number.isFinite(
          parsedBpm
        ) ||
        parsedBpm < 20 ||
        parsedBpm > 300
      )
    ) {
      setMessage(
        "BPM phải nằm trong khoảng 20–300."
      );

      return;
    }

    try {
      setSaving(true);

      setMessage("");

      await updatePracticeSession(
        user.uid,
        session.id,
        {
          bpm:
            parsedBpm,

          selfRating,

          focusArea,

          notes:
            notes.trim(),
        }
      );

      setMessage(
        "Đã cập nhật buổi luyện tập ✓"
      );
    } catch (error) {
      console.error(
        "Update session error:",
        error
      );

      setMessage(
        "Không thể cập nhật session."
      );
    } finally {
      setSaving(false);
    }
  }

async function handleAnalyzeRecording() {
  if (
    !audioUri ||
    !user ||
    !session ||
    analyzing
  ) {
    return;
  }

  try {
    setAnalyzing(true);

    setAnalysisError("");

    setAnalysisResult(null);


    // =====================================
    // 1. SEND RECORDING TO AI BACKEND
    // =====================================

    const result =
      await uploadPracticeAudio(
        audioUri,
        session.exerciseId ||
          undefined
      );


    console.log(
      "Audio analysis result:",
      result
    );


    // =====================================
    // 2. SHOW RESULT IN UI
    // =====================================

    setAnalysisResult(
      result
    );


    // =====================================
    // 3. SAVE SCORES TO FIRESTORE
    // =====================================

    if (result.analysis) {
      await updatePracticeAnalysis(
        user.uid,
        session.id,
        {
          overallScore:
            result.analysis
              .overallScore,

          noteAccuracy:
            result.analysis
              .noteAccuracy,

          timingScore:
            result.analysis
              .timingScore,

          audioId:
            result.audioId,

          feedback:
            result.feedback ??
            [],
        }
      );


      console.log(
        "Practice analysis saved to Firestore:",
        {
          sessionId:
            session.id,

          overallScore:
            result.analysis
              .overallScore,

          noteAccuracy:
            result.analysis
              .noteAccuracy,

          timingScore:
            result.analysis
              .timingScore,
        }
      );
    }

  } catch (error) {

    console.error(
      "Audio analyze upload error:",
      error
    );

    setAnalysisError(
      error instanceof Error
        ? error.message
        : "Không thể phân tích audio."
    );

  } finally {

    setAnalyzing(
      false
    );
  }
}

  // ====================================
  // DELETE
  // ====================================

  function handleDelete() {
    if (
      !user ||
      !session
    ) {
      return;
    }

    Alert.alert(
      "Delete practice session",
      "Bạn có chắc muốn xóa buổi luyện tập này?",

      [
        {
          text:
            "Cancel",

          style:
            "cancel",
        },

        {
          text:
            "Delete",

          style:
            "destructive",

          onPress:
            async () => {
              try {
                await deletePracticeSession(
                  user.uid,
                  session.id
                );

                router.back();
              } catch (error) {
                console.error(
                  "Delete session error:",
                  error
                );
              }
            },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.loadingText
          }
        >
          Loading session...
        </Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Ionicons
          name="alert-circle-outline"
          size={40}
          color={colors.textMuted}
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          Session not found
        </Text>
      </View>
    );
  }

const displayedAnalysis =
  analysisResult?.analysis
    ? {
        overallScore:
          analysisResult
            .analysis
            .overallScore,

        noteAccuracy:
          analysisResult
            .analysis
            .noteAccuracy,

        timingScore:
          analysisResult
            .analysis
            .timingScore,
      }

    : !analysisResult && session.overallScore != null
      ? {
          overallScore:
            session.overallScore,

          noteAccuracy:
            session.noteAccuracy ??
            0,

          timingScore:
            session.timingScore ??
            0,
        }

      : null;

  const displayedFeedback =
    analysisResult
      ? analysisResult.feedback ?? []
      : session.analysisFeedback ?? [];

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
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

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
              Practice Session
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Review your practice
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.deleteButton
            }
            onPress={
              handleDelete
            }
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color="#F87171"
            />
          </TouchableOpacity>
        </View>

        {/* SESSION HERO */}

        <View
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.heroIcon
            }
          >
            <Ionicons
              name={
                session.sourceType ===
                "chord"
                  ? "grid-outline"
                  : "document-text-outline"
              }
              size={28}
              color={colors.accent}
            />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.sessionTitle
              }
            >
              {session.title}
            </Text>

            <Text
              style={
                styles.sessionMeta
              }
            >
              {formatDate(
                session.createdAtMs
              )}
            </Text>
          </View>

          <View
            style={
              styles.durationBadge
            }
          >
            <Text
              style={
                styles.durationValue
              }
            >
              {formatDuration(
                session.durationSeconds
              )}
            </Text>

            <Text
              style={
                styles.durationLabel
              }
            >
              practice
            </Text>
          </View>
        </View>

        {/* CURRENT METRICS */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Session Metrics
        </Text>

        <View
          style={
            styles.metrics
          }
        >
          <MetricCard
            icon="time-outline"
            value={
              formatDuration(
                session.durationSeconds
              )
            }
            label="Duration"
          />

          <MetricCard
            icon="speedometer-outline"
            value={
              session.bpm
                ? `${session.bpm}`
                : "—"
            }
            label="BPM"
          />

          <MetricCard
            icon="star-outline"
            value={
              session.selfRating
                ? `${session.selfRating}/5`
                : "—"
            }
            label="Rating"
          />
        </View>

        {/* BPM */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Tempo
        </Text>

        <View
          style={
            styles.bpmInputRow
          }
        >
          <Ionicons
            name="speedometer-outline"
            size={21}
            color={colors.accent}
          />

          <TextInput
            value={
              bpmText
            }
            onChangeText={
              setBpmText
            }
            placeholder="e.g. 90"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={
              styles.bpmInput
            }
          />

          <Text
            style={
              styles.bpmLabel
            }
          >
            BPM
          </Text>
        </View>

        {/* SELF RATING */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          How did it feel?
        </Text>

        <Text
          style={
            styles.hint
          }
        >
          Tự đánh giá buổi luyện tập từ 1 đến 5.
        </Text>

        <View
          style={
            styles.ratingRow
          }
        >
          {[1, 2, 3, 4, 5].map(
            (rating) => (
              <TouchableOpacity
                key={
                  rating
                }
                style={[
                  styles.ratingButton,

                  selfRating ===
                    rating &&
                    styles.ratingButtonActive,
                ]}
                onPress={() =>
                  setSelfRating(
                    selfRating ===
                      rating
                      ? null
                      : rating
                  )
                }
              >
                <Ionicons
                  name={
                    selfRating !==
                      null &&
                    rating <=
                      selfRating
                      ? "star"
                      : "star-outline"
                  }
                  size={23}
                  color={
                    selfRating !==
                      null &&
                    rating <=
                      selfRating
                      ? "#FBBF24"
                      : colors.textMuted
                  }
                />
              </TouchableOpacity>
            )
          )}
        </View>

        {/* FOCUS */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Focus Area
        </Text>

        <View
          style={
            styles.chips
          }
        >
          {FOCUS_AREAS.map(
            (item) => {
              const selected =
                focusArea ===
                item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,

                    selected &&
                      styles.chipActive,
                  ]}
                  onPress={() =>
                    setFocusArea(
                      selected
                        ? ""
                        : item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,

                      selected &&
                        styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* NOTES */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Practice Notes
        </Text>

        <TextInput
          value={notes}
          onChangeText={
            setNotes
          }
          placeholder="Ví dụ: Chuyển G → D còn chậm, cần luyện thêm..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          style={
            styles.notesInput
          }
        />

        <Text
          style={
            styles.noteCounter
          }
        >
          {notes.length}/500
        </Text>

        {/* GUITAR RECORDING */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Guitar Recording
        </Text>

        <AudioRecorder
          onRecordingReady={(
            result
          ) => {
            setAudioUri(
              result.uri
            );

            setAudioDurationMillis(
              result.durationMillis
            );

            setAnalysisResult(null);
            setAnalysisError("");

            console.log(
              "Practice audio:",
              result
            );
          }}
        />

        {audioUri && (
          <TouchableOpacity
            style={[
              styles.analyzeButton,

              analyzing &&
                styles.disabled,
            ]}
            disabled={analyzing}
            onPress={
              handleAnalyzeRecording
            }
          >
            <Ionicons
              name="sparkles"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.analyzeButtonText
              }
            >
              {analyzing
                ? "Uploading..."
                : "Analyze Recording"}
            </Text>
          </TouchableOpacity>
        )}

        {analysisError !== "" && (
          <View
            style={
              styles.analysisError
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#F87171"
            />

            <Text
              style={
                styles.analysisErrorText
              }
            >
              {analysisError}
            </Text>
          </View>
        )}

        {(analysisResult || displayedAnalysis) && (
          <View
            style={
              styles.analysisSuccess
            }
          >
            <View
              style={
                styles.analysisSuccessHeader
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={23}
                color="#4ADE80"
              />

              <View>
                <Text
                  style={
                    styles.analysisSuccessTitle
                  }
                >
                  {analysisResult
                    ? "Audio analyzed"
                    : "Saved AI analysis"}
                </Text>

                <Text
                  style={
                    styles.analysisSuccessSubtitle
                  }
                >
                  {analysisResult?.analysis === null
                    ? "Bài này chưa hỗ trợ AI scoring. Audio đã được phân tích tự do, không có điểm đánh giá."
                    : analysisResult
                      ? "Đã phân tích audio và tạo điểm đánh giá."
                      : "Kết quả AI đã lưu của buổi luyện tập."}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.uploadInfo
              }
            >
              {analysisResult && (
                <UploadInfoRow
                  label="File"
                  value={
                    analysisResult.filename
                  }
                />
              )}

              {analysisResult && (
                <UploadInfoRow
                  label="Duration"
                  value={formatAudioDuration(
                    audioDurationMillis
                  )}
                />
              )}

              {displayedAnalysis && (
                <>
                  <UploadInfoRow
                    label="Overall Score"
                    value={`${displayedAnalysis.overallScore}%`}
                  />

                  <UploadInfoRow
                    label="Note Accuracy"
                    value={`${displayedAnalysis.noteAccuracy}%`}
                  />

                  <UploadInfoRow
                    label="Timing Score"
                    value={`${displayedAnalysis.timingScore}%`}
                  />
                </>
              )}

              {displayedFeedback.length > 0 && (
                <View
                  style={{
                    marginTop: 12,
                    gap: 6,
                  }}
                >
                  {displayedFeedback.map(
                    (
                      feedback,
                      index
                    ) => (
                      <Text
                        key={index}
                        style={{
                          color: colors.textSoft,
                          fontSize: 10,
                          lineHeight: 16,
                        }}
                      >
                        • {feedback}
                      </Text>
                    )
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* MESSAGE */}

        {message !== "" && (
          <Text
            style={
              styles.message
            }
          >
            {message}
          </Text>
        )}

        {/* SAVE */}

        <TouchableOpacity
          style={[
            styles.saveButton,

            saving &&
              styles.disabled,
          ]}
          disabled={saving}
          onPress={
            handleSave
          }
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.saveText
            }
          >
            {saving
              ? "Saving..."
              : "Save Session Review"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function UploadInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.uploadInfoRow
      }
    >
      <Text
        style={
          styles.uploadInfoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.uploadInfoValue
        }
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function formatAudioDuration(
  milliseconds: number
) {
  const seconds =
    Math.floor(
      milliseconds / 1000
    );

  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    seconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.metricCard
      }
    >
      <Ionicons
        name={icon}
        size={20}
        color={colors.accent}
      />

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>
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

  if (minutes === 0) {
    return `${remaining}s`;
  }

  return `${minutes}m ${remaining}s`;
}

function formatDate(
  timestamp: number
) {
  return new Date(
    timestamp
  ).toLocaleString();
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#355C7D",
    },

    center: {
      flex: 1,
      backgroundColor: "#355C7D",
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      color: colors.textMuted,
    },

    emptyTitle: {
      color: "#FFFFFF",
      fontWeight: "bold",
      marginTop: 10,
    },

    content: {
      width: "100%",
      maxWidth: 800,

      alignSelf: "center",

      padding: 24,
      paddingTop: 35,
      paddingBottom: 70,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      marginBottom: 25,
    },

    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    deleteButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        "#2B1719",
      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      color: "#FFFFFF",
      fontSize: 25,
      fontWeight: "bold",
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 3,
    },

    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor:
        colors.surface,
      borderRadius: 19,
      padding: 17,
    },

    heroIcon: {
      width: 54,
      height: 54,
      borderRadius: 15,
      backgroundColor:
        colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },

    sessionTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },

    sessionMeta: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },

    durationBadge: {
      alignItems: "center",
      backgroundColor:
        colors.surfaceDeep,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: colors.border,
    },

    durationValue: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "bold",
    },

    durationLabel: {
      color: colors.textMuted,
      fontSize: 8,
      marginTop: 2,
    },

    sectionTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 26,
      marginBottom: 11,
    },

    metrics: {
      flexDirection: "row",
      gap: 9,
    },

    metricCard: {
      flex: 1,
      backgroundColor:
        colors.surface,
      borderRadius: 15,
      alignItems: "center",
      paddingVertical: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },

    metricValue: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 15,
      marginTop: 5,
    },

    metricLabel: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 2,
    },

    bpmInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor:
        colors.surface,
      borderRadius: 14,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },

    bpmInput: {
      flex: 1,
      color: "#FFFFFF",
      paddingVertical: 13,
      fontSize: 14,
      outlineStyle:
        "none" as any,
    },

    bpmLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },

    hint: {
      color: colors.textMuted,
      fontSize: 10,
      marginBottom: 10,
    },

    ratingRow: {
      flexDirection: "row",
      gap: 8,
    },

    ratingButton: {
      flex: 1,
      height: 49,
      borderRadius: 13,
      backgroundColor:
        colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor:
        colors.border,
    },

    ratingButtonActive: {
      borderColor:
        "#725B25",
      backgroundColor:
        "#282315",
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    chip: {
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },

    chipActive: {
      backgroundColor:
        colors.action,
      borderColor:
        colors.accent,
    },

    chipText: {
      color: colors.textSoft,
      fontSize: 11,
      fontWeight: "600",
    },

    chipTextActive: {
      color: "#FFFFFF",
    },

    notesInput: {
      minHeight: 120,
      backgroundColor:
        colors.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 14,
      color: "#FFFFFF",
      fontSize: 12,
      textAlignVertical:
        "top",
    },

    noteCounter: {
      color: colors.textDim,
      fontSize: 9,
      textAlign: "right",
      marginTop: 5,
    },

    analyzeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.action,
      borderRadius: 14,
      paddingVertical: 13,
      marginTop: 12,
    },

    analyzeButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },

    analysisSuccess: {
      backgroundColor: "#101A13",
      borderWidth: 1,
      borderColor: "#24482D",
      borderRadius: 16,
      padding: 15,
      marginTop: 13,
    },

    analysisSuccessHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    analysisSuccessTitle: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "bold",
    },

    analysisSuccessSubtitle: {
      color: "#6B8E73",
      fontSize: 9,
      marginTop: 2,
    },

    uploadInfo: {
      marginTop: 14,
      gap: 8,
    },

    uploadInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 20,
    },

    uploadInfoLabel: {
      color: colors.textMuted,
      fontSize: 10,
    },

    uploadInfoValue: {
      color: colors.textSoft,
      fontSize: 10,
      flex: 1,
      textAlign: "right",
    },

    analysisError: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: "#2B1719",
      borderWidth: 1,
      borderColor: "#512429",
      borderRadius: 13,
      padding: 12,
      marginTop: 12,
    },

    analysisErrorText: {
      color: "#FCA5A5",
      fontSize: 10,
      flex: 1,
    },

    aiCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor:
        colors.surface,
      borderRadius: 17,
      padding: 16,
      borderWidth: 1,
      borderColor:
        colors.borderAccent,
    },

    aiIcon: {
      width: 49,
      height: 49,
      borderRadius: 14,
      backgroundColor:
        colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },

    aiTitle: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "bold",
    },

    aiDescription: {
      color: colors.textMuted,
      fontSize: 10,
      lineHeight: 16,
      marginTop: 4,
    },

    message: {
      color: "#4ADE80",
      textAlign: "center",
      fontSize: 11,
      marginTop: 18,
    },

    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor:
        colors.action,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 22,
    },

    saveText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 12,
    },

    disabled: {
      opacity: 0.5,
    },
  });

