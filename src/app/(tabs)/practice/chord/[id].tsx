import { colors } from "../../../../theme/colors";
import AppGradientBackground from "../../../../components/ui/AppGradientBackground";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  getSongById,
  Song,
} from "../../../../data/songs";

import PracticeSessionBar
  from "../../../../components/practice/PracticeSessionBar";

// ======================================================
// MAIN SCREEN
// ======================================================

export default function ChordSongScreen() {
  const params = useLocalSearchParams();

  const rawId = params.id;

  const songId = Array.isArray(rawId)
    ? rawId[0]
    : rawId;

  const song = songId
    ? getSongById(songId)
    : undefined;

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [fontSize, setFontSize] =
    useState(17);

  const [favorite, setFavorite] =
    useState(false);

  // ====================================================
  // LOAD TXT
  // ====================================================

  useEffect(() => {
    async function loadSong() {
      if (!song) {
        setLoading(false);
        return;
      }

      if (song.type !== "chord") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Ưu tiên file TXT
        if (song.textUrl) {
          const response =
            await fetch(song.textUrl);

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const text =
            await response.text();

          setContent(text);

          return;
        }

        // Nếu không có file TXT thì dùng
        // content hardcode
        if (song.content) {
          setContent(song.content);

          return;
        }

        setError(
          "Bài hát chưa có nội dung hợp âm."
        );
      } catch (err) {
        console.error(
          "Error loading chord file:",
          err
        );

        setError(
          "Không thể tải file hợp âm."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSong();
  }, [song?.id]);

  // ====================================================
  // SONG NOT FOUND
  // ====================================================

  if (!song) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={55}
          color={colors.accent}
        />

        <Text style={styles.notFoundTitle}>
          Không tìm thấy bài hát
        </Text>

        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.back()}
        >
          <Text style={styles.returnText}>
            Quay lại
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ====================================================
  // WRONG TYPE
  // ====================================================

  if (song.type !== "chord") {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundTitle}>
          Đây không phải bài chord.
        </Text>

        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.back()}
        >
          <Text style={styles.returnText}>
            Quay lại
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppGradientBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* ============================================= */}
        {/* HEADER                                        */}
        {/* ============================================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              favorite &&
                styles.favoriteActive,
            ]}
            onPress={() =>
              setFavorite(!favorite)
            }
          >
            <Ionicons
              name={
                favorite
                  ? "heart"
                  : "heart-outline"
              }
              size={23}
              color={
                favorite
                  ? "#FFFFFF"
                  : colors.accent
              }
            />
          </TouchableOpacity>
        </View>

        {/* ============================================= */}
        {/* SONG TITLE                                    */}
        {/* ============================================= */}

        <Text style={styles.title}>
          {song.title}
        </Text>

        <Text style={styles.artist}>
          {song.artist}
        </Text>

        {song.description && (
          <Text style={styles.description}>
            {song.description}
          </Text>
        )}

        {/* ============================================= */}
        {/* SONG INFORMATION                              */}
        {/* ============================================= */}

        <View style={styles.infoRow}>
          {song.key && (
            <InfoCard
              label="KEY"
              value={song.key}
            />
          )}

          {song.bpm && (
            <InfoCard
              label="BPM"
              value={String(song.bpm)}
            />
          )}

          {song.capo !== undefined && (
            <InfoCard
              label="CAPO"
              value={String(song.capo)}
            />
          )}

          <InfoCard
            label="LEVEL"
            value={song.difficulty}
          />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Mở thư viện sơ đồ hợp âm"
          style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            borderWidth: 1, borderColor: colors.borderAccent,
            backgroundColor: colors.surfaceRaised, padding: 13,
            borderRadius: 13, marginVertical: 12,
          }}
          onPress={() => router.push("/practice/chord-library" as any)}
        >
          <Ionicons name="musical-notes-outline" size={23} color={colors.accent}/>
          <View style={{flex:1}}>
            <Text style={{color:colors.text,fontWeight:"800"}}>Tra cứu sơ đồ hợp âm</Text>
            <Text style={{color:colors.textSoft,fontSize:12,marginTop:3}}>Xem thế bấm, ngón tay và nghe từng hợp âm trong bài</Text>
          </View>
          <Ionicons name="arrow-forward" color={colors.accent} size={18}/>
        </TouchableOpacity>

        <PracticeSessionBar
          sourceType="chord"
          sourceId={song.id}
          analysisExerciseId={song.analysisExerciseId}
          title={song.title}
        />

        {/* ============================================= */}
        {/* TOOLBAR                                       */}
        {/* ============================================= */}

        <View style={styles.toolbar}>
          <View style={styles.fontControl}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                setFontSize((size) =>
                  Math.max(13, size - 1)
                )
              }
            >
              <Ionicons
                name="remove"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View
              style={styles.fontLabel}
            >
              <Ionicons
                name="text"
                size={18}
                color={colors.accent}
              />

              <Text
                style={styles.fontLabelText}
              >
                {fontSize}px
              </Text>
            </View>

            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                setFontSize((size) =>
                  Math.min(28, size + 1)
                )
              }
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================= */}
        {/* CHORD VIEWER                                  */}
        {/* ============================================= */}

        <View style={styles.chordViewer}>
          {loading ? (
            <View
              style={styles.loadingContainer}
            >
              <ActivityIndicator
                size="large"
                color={colors.accent}
              />

              <Text
                style={styles.loadingText}
              >
                Đang tải hợp âm...
              </Text>
            </View>
          ) : error ? (
            <View
              style={styles.errorContainer}
            >
              <Ionicons
                name="warning-outline"
                size={40}
                color="#F87171"
              />

              <Text
                style={styles.errorText}
              >
                {error}
              </Text>

              {song.textUrl && (
                <Text
                  style={styles.errorHint}
                >
                  Kiểm tra file:
                  {"\n"}
                  {song.textUrl}
                </Text>
              )}
            </View>
          ) : (
            <ChordContent
              content={content}
              fontSize={fontSize}
            />
          )}
        </View>

        {/* ============================================= */}
        {/* START PRACTICE                                */}
        {/* ============================================= */}

        <TouchableOpacity
          style={styles.practiceButton}
          onPress={() => {
            console.log(
              "Start practice:",
              song.id
            );
          }}
        >
          <Ionicons
            name="play"
            size={21}
            color="#FFFFFF"
          />

          <Text
            style={styles.practiceButtonText}
          >
            Start Practice
          </Text>
        </TouchableOpacity>

        <Text style={styles.practiceHint}>
          AI Coach sẽ được kết nối với chức
          năng này ở bước tiếp theo.
        </Text>
      </ScrollView>
    </View>
  );
}

// ======================================================
// INFO CARD
// ======================================================

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

// ======================================================
// CHORD CONTENT
// ======================================================
//
// Ví dụ:
//
// Em như cơn [G]gió thu [C]bay
//
// được chia thành:
//
// Em như cơn
//
// G
// gió thu
//
// C
// bay
//
// Nhờ vậy chord được đặt phía trên phần lyric tương ứng.
// ======================================================

function ChordContent({
  content,
  fontSize,
}: {
  content: string;
  fontSize: number;
}) {
  const normalizedContent =
    content.replace(/\r\n/g, "\n");

  const lines =
    normalizedContent.split("\n");

  return (
    <View>
      {lines.map(
        (line, lineIndex) => {
          // -----------------------------
          // EMPTY LINE
          // -----------------------------

          if (!line.trim()) {
            return (
              <View
                key={lineIndex}
                style={styles.emptyLine}
              />
            );
          }

          // -----------------------------
          // SECTION TITLE
          // -----------------------------

          if (isSectionTitle(line)) {
            return (
              <Text
                key={lineIndex}
                style={styles.sectionTitle}
              >
                {line.trim()}
              </Text>
            );
          }

          // -----------------------------
          // PAGE MARKER
          // -----------------------------

          if (
            line
              .trim()
              .toLowerCase()
              .startsWith("trang ")
          ) {
            return (
              <Text
                key={lineIndex}
                style={styles.pageMarker}
              >
                {line.trim()}
              </Text>
            );
          }

          // -----------------------------
          // NORMAL CHORD LINE
          // -----------------------------

          const segments =
            parseChordLine(line);

          return (
            <View
              key={lineIndex}
              style={styles.musicLine}
            >
              {segments.map(
                (
                  segment,
                  segmentIndex
                ) => (
                  <View
                    key={
                      segmentIndex
                    }
                    style={
                      styles.musicSegment
                    }
                  >
                    <Text
                      style={[
                        styles.chordText,
                        {
                          fontSize:
                            fontSize - 1,
                        },
                      ]}
                    >
                      {segment.chord ||
                        " "}
                    </Text>

                    <Text
                      style={[
                        styles.lyricText,
                        {
                          fontSize,
                          lineHeight:
                            fontSize * 1.6,
                        },
                      ]}
                    >
                      {segment.text ||
                        " "}
                    </Text>
                  </View>
                )
              )}
            </View>
          );
        }
      )}
    </View>
  );
}

// ======================================================
// PARSER
// ======================================================

interface ChordSegment {
  chord?: string;
  text: string;
}

function parseChordLine(
  line: string
): ChordSegment[] {
  const result: ChordSegment[] = [];

  const chordRegex =
    /\[([^\]]+)\]/g;

  let lastIndex = 0;

  let currentChord:
    | string
    | undefined;

  let match:
    | RegExpExecArray
    | null;

  while (
    (match =
      chordRegex.exec(line)) !==
    null
  ) {
    const textBefore =
      line.substring(
        lastIndex,
        match.index
      );

    if (
      textBefore.length > 0 ||
      currentChord
    ) {
      result.push({
        chord: currentChord,
        text: textBefore,
      });
    }

    currentChord = match[1];

    lastIndex =
      match.index +
      match[0].length;
  }

  const remainingText =
    line.substring(lastIndex);

  if (
    remainingText.length > 0 ||
    currentChord
  ) {
    result.push({
      chord: currentChord,
      text: remainingText,
    });
  }

  // Không có chord nào
  if (result.length === 0) {
    result.push({
      text: line,
    });
  }

  return result;
}

// ======================================================
// SECTION DETECTOR
// ======================================================

function isSectionTitle(
  line: string
) {
  const text = line
    .trim()
    .toLowerCase();

  return (
    text.startsWith("chorus") ||
    text.startsWith("verse") ||
    text.startsWith("ver ") ||
    text.startsWith("bridge") ||
    text.startsWith("intro") ||
    text.startsWith("outro") ||
    text.startsWith("pre-chorus") ||
    text === "đk:" ||
    text === "dk:"
  );
}

// ======================================================
// STYLE
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#355C7D",
  },

  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,

    width: "100%",
    maxWidth: 1100,

    alignSelf: "center",
  },

  center: {
    flex: 1,

    backgroundColor: "#355C7D",

    alignItems: "center",
    justifyContent: "center",

    padding: 30,
  },

  header: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",
  },

  iconButton: {
    width: 46,
    height: 46,

    borderRadius: 14,

    backgroundColor: colors.surface,

    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  favoriteActive: {
    backgroundColor: colors.action,
  },

  title: {
    color: "#FFFFFF",

    fontSize: 32,

    fontWeight: "bold",

    marginTop: 25,
  },

  artist: {
    color: colors.textSoft,

    fontSize: 16,

    marginTop: 7,
  },

  description: {
    color: colors.textMuted,

    marginTop: 6,
  },

  // =====================================
  // INFO
  // =====================================

  infoRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 10,

    marginTop: 25,
  },

  infoCard: {
    backgroundColor: colors.surface,

    borderRadius: 13,

    paddingHorizontal: 17,

    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoLabel: {
    color: colors.textMuted,

    fontSize: 10,

    fontWeight: "600",
  },

  infoValue: {
    color: "#FFFFFF",

    fontWeight: "bold",

    marginTop: 4,
  },

  // =====================================
  // TOOLBAR
  // =====================================

  toolbar: {
    flexDirection: "row",

    marginTop: 20,
  },

  fontControl: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.surface,

    borderRadius: 13,

    overflow: "hidden",
  },

  smallButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",
  },

  fontLabel: {
    height: 42,

    flexDirection: "row",

    alignItems: "center",

    gap: 7,

    paddingHorizontal: 12,

    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },

  fontLabelText: {
    color: colors.textSoft,

    fontSize: 13,
  },

  // =====================================
  // VIEWER
  // =====================================

  chordViewer: {
    backgroundColor: "#111116",

    borderRadius: 20,

    paddingHorizontal: 24,
    paddingVertical: 28,

    marginTop: 22,

    minHeight: 300,
  },

  loadingContainer: {
    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 80,
  },

  loadingText: {
    color: colors.textSoft,

    marginTop: 15,
  },

  errorContainer: {
    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 60,
  },

  errorText: {
    color: "#F87171",

    marginTop: 12,

    fontWeight: "600",
  },

  errorHint: {
    color: colors.textMuted,

    marginTop: 10,

    textAlign: "center",
  },

  // =====================================
  // MUSIC CONTENT
  // =====================================

  musicLine: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "flex-end",

    marginBottom: 7,
  },

  musicSegment: {
    flexDirection: "column",

    alignItems: "flex-start",

    marginRight: 2,
  },

  chordText: {
    color: colors.accent,

    fontWeight: "bold",

    minHeight: 22,
  },

  lyricText: {
    color: colors.text,
  },

  emptyLine: {
    height: 22,
  },

  sectionTitle: {
    color: colors.accent,

    fontSize: 18,

    fontWeight: "bold",

    marginTop: 20,
    marginBottom: 12,

    textTransform: "uppercase",
  },

  pageMarker: {
    color: colors.textDim,

    fontSize: 12,

    marginVertical: 10,
  },

  // =====================================
  // PRACTICE
  // =====================================

  practiceButton: {
    backgroundColor: colors.action,

    borderRadius: 17,

    paddingVertical: 17,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 10,

    marginTop: 25,
  },

  practiceButtonText: {
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "bold",
  },

  practiceHint: {
    color: colors.textMuted,

    fontSize: 12,

    textAlign: "center",

    marginTop: 10,
  },

  // =====================================
  // NOT FOUND
  // =====================================

  notFoundTitle: {
    color: "#FFFFFF",

    fontSize: 20,

    fontWeight: "bold",

    marginTop: 15,
  },

  returnButton: {
    backgroundColor: colors.action,

    paddingHorizontal: 25,

    paddingVertical: 13,

    borderRadius: 13,

    marginTop: 20,
  },

  returnText: {
    color: "#FFFFFF",

    fontWeight: "bold",
  },
});