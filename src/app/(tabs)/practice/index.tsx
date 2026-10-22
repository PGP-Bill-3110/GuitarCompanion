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

type PracticeTab = "chords" | "scores";

export default function PracticeScreen() {
  const [activeTab, setActiveTab] =
    useState<PracticeTab>("chords");

  const [search, setSearch] = useState("");

  const filteredSongs = songs.filter((song) => {
    const matchesType =
      activeTab === "chords"
        ? song.type === "chord"
        : song.type === "score";

    const keyword = search.toLowerCase();

    const matchesSearch =
      song.title.toLowerCase().includes(keyword) ||
      song.artist.toLowerCase().includes(keyword);

    return matchesType && matchesSearch;
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
              Sheet / Tabs
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textMuted}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search songs or artists..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* TITLE */}

        <Text style={styles.sectionTitle}>
          {activeTab === "chords"
            ? "Chord Songs"
            : "Sheet Music & Tablature"}
        </Text>

        {/* LIST */}

        {filteredSongs.length === 0 ? (
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