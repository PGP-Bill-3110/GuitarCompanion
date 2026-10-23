import { colors } from "../../../theme/colors";
import AppGradientBackground from "../../../components/ui/AppGradientBackground";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { songs } from "../../../data/songs";
import { guitarTabs } from "../../../data/guitarTabs";

type PracticeTab = "chords" | "tabs" | "scores";

export default function PracticeScreen() {
  const [activeTab, setActiveTab] =
    useState<PracticeTab>("chords");

  const [search, setSearch] = useState("");

  const filteredSongs = songs.filter((song) => {
    const matchesType =
      activeTab === "chords"
        ? song.type === "chord"
        : activeTab === "scores" && song.type === "score";

    const keyword = search.toLowerCase();

    const matchesSearch =
      song.title.toLowerCase().includes(keyword) ||
      song.artist.toLowerCase().includes(keyword);

    return matchesType && matchesSearch;
  });

  const filteredTabs = guitarTabs.filter((tab) => {
    const keyword = search.trim().toLowerCase();
    return (tab.title + " " + tab.subtitle + " " + tab.key).toLowerCase().includes(keyword);
  });

  return (
    <View style={styles.container}>
      <AppGradientBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Practice</Text>

            <Text style={styles.subtitle}>
              Learn songs and improve your guitar skills.
            </Text>
          </View>
        </View>

        {/* LEARNING PATH */}
        <TouchableOpacity
          style={styles.learningCard}
          onPress={() => router.push("/learning-path" as any)}
          accessibilityRole="button"
          accessibilityLabel="Mở lộ trình học guitar"
        >
          <View style={styles.learningIcon}>
            <Ionicons name="school-outline" size={26} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.learningEyebrow}>START LEARNING</Text>
            <Text style={styles.learningTitle}>Beginner Learning Path</Text>
            <Text style={styles.learningHint}>12 bài học · 4 module · Có lưu tiến độ</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color={colors.accent} />
        </TouchableOpacity>

        {/* PRACTICE HISTORY */}

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() =>
            router.push(
              "/practice-history" as any
            )
          }
        >
          <View style={styles.historyIcon}>
            <Ionicons
              name="stats-chart"
              size={22}
              color={colors.accent}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.historyTitle}>
              Practice History
            </Text>

            <Text style={styles.historyText}>
              View streak, time and recent sessions
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {/* TABS */}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "chords" &&
                styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("chords")}
          >
            <Ionicons
              name="musical-notes"
              size={19}
              color={
                activeTab === "chords"
                  ? "#FFFFFF"
                  : colors.textMuted
              }
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "chords" &&
                  styles.activeTabText,
              ]}
            >
              Chords
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "tabs" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("tabs")}
          >
            <Ionicons
              name="list-outline"
              size={19}
              color={activeTab === "tabs" ? "#FFFFFF" : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "tabs" && styles.activeTabText]}>
              Guitar Tabs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "scores" &&
                styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("scores")}
          >
            <Ionicons
              name="document-text"
              size={19}
              color={
                activeTab === "scores"
                  ? "#FFFFFF"
                  : colors.textMuted
              }
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "scores" &&
                  styles.activeTabText,
              ]}
            >
              Sheet Music
            </Text>
          </TouchableOpacity>
        </View>

        {/* ALPHATAB IMPORT */}
        {(activeTab === "tabs" || activeTab === "scores") && (
          <TouchableOpacity
            style={styles.studioBanner}
            accessibilityRole="button"
            accessibilityLabel="Mở alphaTab Studio để nhập MusicXML hoặc Guitar Pro"
            onPress={() => router.push("/practice/score-studio" as any)}
          >
            <View style={styles.studioIcon}>
              <Ionicons name="cloud-upload-outline" size={26} color={colors.accent}/>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studioTitle}>alphaTab · Import MusicXML / Guitar Pro</Text>
              <Text style={styles.studioDesc}>Mở file .musicxml, .mxl, .gp, .gpx, .gp3–5 ngay trong trình duyệt</Text>
            </View>
            <Ionicons name="arrow-forward-circle" color={colors.accent} size={25}/>
          </TouchableOpacity>
        )}

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textMuted}
          />

          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === "tabs" ? "Search guitar exercises..." : "Search songs or artists..."}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* TITLE */}

        <Text style={styles.sectionTitle}>
          {activeTab === "chords"
            ? "Chord Songs"
            : activeTab === "tabs" ? "Guitar Tab Exercises" : "Sheet Music"}
        </Text>

        {/* LIST */}

        {activeTab === "tabs" ? (
          <View>
            <View style={styles.tabIntro}>
              <Ionicons name="information-circle-outline" size={20} color={colors.accent}/>
              <Text style={styles.tabIntroText}>Bộ 4 bài luyện guitar tab do GuitarCompanion biên soạn. Chọn bài để xem sáu dây, nghe nốt mẫu và luyện cùng BPM.</Text>
            </View>
            {filteredTabs.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted}/>
                <Text style={styles.emptyTitle}>Không tìm thấy guitar tab</Text>
                <Text style={styles.emptyText}>Thử từ khóa khác.</Text>
              </View>
            ) : filteredTabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                accessibilityRole="button"
                accessibilityLabel={"Mở guitar tab " + tab.title}
                style={styles.songCard}
                onPress={() => router.push(("/practice/tab/" + tab.id) as any)}
              >
                <View style={styles.songIcon}>
                  <Ionicons name="list-outline" color={colors.accent} size={26}/>
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{tab.title}</Text>
                  <Text style={styles.artist}>{tab.subtitle}</Text>
                  <View style={styles.metadata}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{tab.difficulty}</Text></View>
                    <View style={styles.badge}><Text style={styles.badgeText}>{tab.bpm} BPM</Text></View>
                    <View style={styles.badge}><Text style={styles.badgeText}>4 ô nhịp</Text></View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.textDim}/>
              </TouchableOpacity>
            ))}
          </View>
        ) : filteredSongs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="musical-notes-outline"
              size={45}
              color={colors.textDim}
            />

            <Text style={styles.emptyTitle}>
              No songs found
            </Text>

            <Text style={styles.emptyText}>
              Try another search keyword.
            </Text>
          </View>
        ) : (
          filteredSongs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={styles.songCard}
              onPress={() => {
                if (song.type === "chord") {
                  router.push(
                    `/practice/chord/${song.id}` as any
                  );
                } else {
                  router.push(
                    `/practice/score/${song.id}` as any
                  );
                }
              }}
            >
              <View style={styles.songIcon}>
                <Ionicons
                  name={
                    song.type === "chord"
                      ? "musical-notes"
                      : "document-text"
                  }
                  size={28}
                  color={colors.accent}
                />
              </View>

              <View style={styles.songInfo}>
                <Text style={styles.songTitle}>
                  {song.title}
                </Text>

                <Text style={styles.artist}>
                  {song.artist}
                </Text>

                <View style={styles.metadata}>
                  {song.key && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        Key {song.key}
                      </Text>
                    </View>
                  )}

                  {song.bpm && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {song.bpm} BPM
                      </Text>
                    </View>
                  )}

                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {song.difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.textDim}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#355C7D",
  },

  content: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
  },

  subtitle: {
    color: colors.textSoft,
    marginTop: 5,
  },

  learningCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  learningIcon: {
    width: 51,
    height: 51,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  learningEyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  learningTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 5,
  },
  learningHint: {
    color: colors.textSoft,
    fontSize: 11,
    marginTop: 5,
  },

  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 17,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },

  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  historyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  historyText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  studioBanner: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderAccent,
    borderWidth: 1,
    padding: 16,
    borderRadius: 18,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  studioIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  studioTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  studioDesc: { color: colors.textSoft, marginTop: 5, fontSize: 11, lineHeight: 18 },

  tabIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  tabIntroText: {
    flex: 1,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 19,
  },

  tabContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: "row",
    padding: 5,
    marginTop: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  activeTabButton: {
    backgroundColor: colors.activeSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },

  tabText: {
    color: colors.textMuted,
    fontWeight: "600",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 15,
    marginLeft: 10,
    outlineStyle: "none",
  } as any,

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 28,
    marginBottom: 15,
  },

  songCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  songIcon: {
    width: 55,
    height: 55,
    backgroundColor: colors.accentSoft,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  songInfo: {
    flex: 1,
    marginLeft: 15,
  },

  songTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  artist: {
    color: colors.textSoft,
    marginTop: 4,
  },

  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  badge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  badgeText: {
    color: colors.textSoft,
    fontSize: 11,
  },

  empty: {
    alignItems: "center",
    marginTop: 70,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 15,
  },

  emptyText: {
    color: colors.textMuted,
    marginTop: 5,
  },
});