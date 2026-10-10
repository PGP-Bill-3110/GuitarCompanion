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
  PracticeSession,
  PracticeStats,
  subscribePracticeSessions,
  subscribePracticeStats,
} from "../../services/practiceService";

export default function PracticeHistoryScreen() {
  const {
    user,
  } = useAuth();

  const [
    sessions,
    setSessions,
  ] =
    useState<
      PracticeSession[]
    >([]);

  const [
    stats,
    setStats,
  ] =
    useState<PracticeStats>({
      sessionCount: 0,
      totalSeconds: 0,
      totalMinutes: 0,
      streak: 0,
    });

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribeHistory =
      subscribePracticeSessions(
        user.uid,
        setSessions
      );

    const unsubscribeStats =
      subscribePracticeStats(
        user.uid,
        setStats
      );

    return () => {
      unsubscribeHistory();
      unsubscribeStats();
    };
  }, [user?.uid]);

  return (
    <View
      style={
        styles.container
      }
    >
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
              styles.backButton
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
              Practice History
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Track your progress
            </Text>
          </View>
        </View>

        <View
          style={
            styles.stats
          }
        >
          <Stat
            value={`${stats.streak}`}
            label="Day Streak"
            icon="flame"
          />

          <Stat
            value={`${stats.totalMinutes}`}
            label="Minutes"
            icon="time"
          />

          <Stat
            value={`${stats.sessionCount}`}
            label="Sessions"
            icon="musical-notes"
          />
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Recent Practice
        </Text>

        {sessions.length ===
        0 ? (
          <View
            style={
              styles.empty
            }
          >
            <Ionicons
              name="musical-notes-outline"
              size={42}
              color="#666"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No practice yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Start practicing a chord
              or score to build your
              history.
            </Text>
          </View>
        ) : (
          sessions.map(
            (session) => (
              <SessionCard
                key={
                  session.id
                }
                session={
                  session
                }
                onPress={() =>
                  router.push(
                    `/practice-session/${session.id}` as any
                  )
                }
              />
            )
          )
        )}
      </ScrollView>
    </View>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: any;
}) {
  return (
    <View
      style={
        styles.stat
      }
    >
      <Ionicons
        name={icon}
        size={20}
        color="#A78BFA"
      />

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function SessionCard({
  session,
  onPress,
}: {
  session:
    PracticeSession;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={
        styles.sessionCard
      }
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={
          styles.sessionIcon
        }
      >
        <Ionicons
          name={
            session.sourceType ===
            "chord"
              ? "grid-outline"
              : "document-text-outline"
          }
          size={23}
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
          {formatMinutes(
            session.durationSeconds
          )}

          {session.bpm
            ? ` • ${session.bpm} BPM`
            : ""}

          {session.selfRating
            ? ` • ⭐ ${session.selfRating}/5`
            : ""}

          {" • "}

          {formatDate(
            session.createdAtMs
          )}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#666"
      />
    </TouchableOpacity>
  );
}

function formatMinutes(
  seconds: number
) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.round(
    seconds / 60
  )} min`;
}

function formatDate(
  timestamp: number
) {
  return new Date(
    timestamp
  ).toLocaleDateString();
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#0B0B0F",
    },

    content: {
      width: "100%",
      maxWidth: 800,

      alignSelf: "center",

      padding: 24,
      paddingTop: 35,
      paddingBottom: 60,
    },

    header: {
      flexDirection: "row",

      alignItems: "center",

      gap: 13,

      marginBottom: 25,
    },

    backButton: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      color: "#FFFFFF",

      fontSize: 25,

      fontWeight: "bold",
    },

    subtitle: {
      color: "#777",

      fontSize: 11,

      marginTop: 3,
    },

    stats: {
      flexDirection: "row",

      gap: 10,
    },

    stat: {
      flex: 1,

      backgroundColor:
        "#17171D",

      borderRadius: 17,

      alignItems: "center",

      paddingVertical: 17,
    },

    statValue: {
      color: "#FFFFFF",

      fontSize: 20,

      fontWeight: "bold",

      marginTop: 5,
    },

    statLabel: {
      color: "#666",

      fontSize: 9,

      marginTop: 2,
    },

    sectionTitle: {
      color: "#FFFFFF",

      fontSize: 17,

      fontWeight: "bold",

      marginTop: 27,
      marginBottom: 13,
    },

    sessionCard: {
      flexDirection: "row",

      alignItems: "center",

      gap: 12,

      backgroundColor:
        "#17171D",

      borderRadius: 16,

      padding: 14,

      marginBottom: 9,
    },

    sessionIcon: {
      width: 47,
      height: 47,

      borderRadius: 13,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    sessionTitle: {
      color: "#FFFFFF",

      fontSize: 13,

      fontWeight: "bold",
    },

    sessionMeta: {
      color: "#666",

      fontSize: 10,

      marginTop: 5,
    },

    sessionType: {
      color: "#A78BFA",

      fontSize: 9,

      textTransform:
        "uppercase",
    },

    empty: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      padding: 50,

      alignItems: "center",
    },

    emptyTitle: {
      color: "#FFFFFF",

      fontWeight: "bold",

      marginTop: 12,
    },

    emptyText: {
      color: "#666",

      fontSize: 11,

      textAlign: "center",

      marginTop: 6,

      lineHeight: 17,
    },
  });