import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import NotificationBell
  from "../../components/notifications/NotificationBell";
export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Good evening 👋</Text>
          <Text style={styles.title}>Guitarist</Text>
        </View>

        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
      </View>

      <View style={styles.streakCard}>
        <View>
          <Text style={styles.label}>CURRENT STREAK</Text>

          <View style={styles.streakRow}>
            <Text style={styles.fire}>🔥</Text>
            <Text style={styles.streakNumber}>7</Text>
            <Text style={styles.days}>days</Text>
          </View>
        </View>

        <Ionicons name="flame" size={55} color="#FF8A00" />
      </View>

      <Text style={styles.sectionTitle}>Today's Practice</Text>

      <View style={styles.practiceCard}>
        <View style={styles.practiceIcon}>
          <Ionicons name="musical-notes" size={28} color="#A78BFA" />
        </View>

        <View style={styles.practiceInfo}>
          <Text style={styles.practiceTitle}>Chord Transition</Text>
          <Text style={styles.chords}>G → D → Em → C</Text>
          <Text style={styles.description}>10 min • Beginner</Text>
        </View>

        <TouchableOpacity
          style={styles.playButton}
          onPress={() => router.push("/practice")}
        >
          <Ionicons name="play" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>AI Coach</Text>

      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={28} color="#A78BFA" />

          <View style={{ marginLeft: 12 }}>
            <Text style={styles.aiTitle}>Nice progress!</Text>
            <Text style={styles.aiText}>
              Your rhythm improved 12% this week.
            </Text>
          </View>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.description}>Rhythm</Text>
          <Text style={styles.progressValue}>82%</Text>
        </View>

        <View style={styles.progressBackground}>
          <View style={styles.progressBar} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.quickActions}>
        <QuickAction icon="mic" title="Record" />
        <QuickAction icon="library" title="Songs" />
        <QuickAction icon="bar-chart" title="Progress" />
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, title }: { icon: any; title: string }) {
  return (
    <TouchableOpacity style={styles.quickButton}>
      <Ionicons name={icon} size={25} color="#A78BFA" />
      <Text style={styles.quickText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  content: { padding: 24, paddingTop: 50, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  welcome: { color: "#888" },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold" },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },

  streakCard: {
    backgroundColor: "#17171D",
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: { color: "#777", fontSize: 12 },
  streakRow: { flexDirection: "row", alignItems: "baseline", marginTop: 8 },
  fire: { fontSize: 25 },
  streakNumber: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "bold",
    marginLeft: 5,
  },
  days: { color: "#888", marginLeft: 6 },

  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 14,
  },

  practiceCard: {
    backgroundColor: "#17171D",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  practiceIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: "#251B3D",
    justifyContent: "center",
    alignItems: "center",
  },

  practiceInfo: { flex: 1, marginLeft: 14 },
  practiceTitle: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  chords: { color: "#A78BFA", marginTop: 4 },
  description: { color: "#888", marginTop: 4 },

  playButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },

  aiCard: {
    backgroundColor: "#17171D",
    borderRadius: 18,
    padding: 20,
  },

  aiHeader: { flexDirection: "row", alignItems: "center" },
  aiTitle: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  aiText: { color: "#888", marginTop: 3 },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  progressValue: { color: "#A78BFA", fontWeight: "bold" },

  progressBackground: {
    height: 8,
    backgroundColor: "#292930",
    borderRadius: 10,
    marginTop: 8,
  },

  progressBar: {
    width: "82%",
    height: 8,
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },

  quickActions: { flexDirection: "row", gap: 10 },

  quickButton: {
    flex: 1,
    backgroundColor: "#17171D",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
  },

  quickText: { color: "#fff", marginTop: 8 },
});