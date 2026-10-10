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
              color="#A78BFA"
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
            color="#666"
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
                  : "#777"
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
                  : "#777"
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
            color="#777"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search songs or artists..."
            placeholderTextColor="#666"
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
              color="#555"
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
                  color="#A78BFA"
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
                color="#555"
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
    backgroundColor: "#0B0B0F",
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
    color: "#888",
    marginTop: 5,
  },

  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#17171D",
    borderRadius: 17,
    padding: 14,
    marginTop: 22,
  },

  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#251B3D",
    alignItems: "center",
    justifyContent: "center",
  },

  historyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  historyText: {
    color: "#666",
    fontSize: 10,
    marginTop: 4,
  },

  tabContainer: {
    backgroundColor: "#17171D",
    borderRadius: 16,
    flexDirection: "row",
    padding: 5,
    marginTop: 28,
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
    backgroundColor: "#7C3AED",
  },

  tabText: {
    color: "#777",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17171D",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginTop: 22,
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
    backgroundColor: "#17171D",
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  songIcon: {
    width: 55,
    height: 55,
    backgroundColor: "#251B3D",
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
    color: "#888",
    marginTop: 4,
  },

  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  badge: {
    backgroundColor: "#25252D",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },

  badgeText: {
    color: "#AAA",
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
    color: "#777",
    marginTop: 5,
  },
});