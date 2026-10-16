import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  RecordProject,
  subscribeRecordProjects,
} from "../../services/recordService";
const tools = [
  {
    icon: "mic",
    title: "Record",
    desc: "Record your guitar performance",
  },
  {
    icon: "videocam",
    title: "Cover",
    desc: "Create and share a cover",
  },
  {
    icon: "options",
    title: "Preset",
    desc: "Design your guitar tone",
  },
  {
    icon: "people",
    title: "Jam",
    desc: "Jam with other musicians",
  },
];

export default function CreateScreen() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [projects, setProjects] =
    useState<RecordProject[]>([]);

  useEffect(() => {
    if (!uid) {
      setProjects([]);
      return;
    }

    return subscribeRecordProjects(
      uid,
      setProjects
    );
  }, [uid]);

  function handleToolPress(title: string) {
    switch (title) {
      case "Preset":
        router.push("/preset" as any);
        break;

      case "Record":
        router.push(
          "/record" as any
        );
        break;

      case "Cover":
        console.log("Cover - coming soon");
        break;

      case "Jam":
        console.log("Jam - coming soon");
        break;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Create
      </Text>

      <Text style={styles.subtitle}>
        Turn your playing into something awesome.
      </Text>

      <View style={styles.grid}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.title}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              handleToolPress(tool.title)
            }
          >
            <View style={styles.icon}>
              <Ionicons
                name={tool.icon as any}
                size={30}
                color="#A78BFA"
              />
            </View>

            <Text style={styles.cardTitle}>
              {tool.title}
            </Text>

            <Text style={styles.description}>
              {tool.desc}
            </Text>

            <View style={styles.openRow}>
              <Text style={styles.openText}>
                Open
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#A78BFA"
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>
        Recent Projects
      </Text>

      {projects.length === 0 ? (
        <View style={styles.project}>
          <Ionicons
            name="mic-outline"
            size={28}
            color="#666"
          />

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.projectTitle}>
              No recordings yet
            </Text>

            <Text style={styles.description}>
              Record your first guitar idea.
            </Text>
          </View>
        </View>
      ) : (
        projects.slice(0, 5).map((project) => (
          <View
            key={project.id}
            style={[
              styles.project,
              { marginBottom: 10 },
            ]}
          >
            <Ionicons
              name="musical-note"
              size={30}
              color="#A78BFA"
            />

            <View style={{ marginLeft: 15 }}>
              <Text style={styles.projectTitle}>
                {project.title}
              </Text>

              <Text style={styles.description}>
                Draft •{" "}
                {formatDuration(
                  project.durationSeconds
                )}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    padding: 24,
    paddingTop: 50,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#888",
    marginTop: 5,
    marginBottom: 30,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#17171D",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },

  icon: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: "#251B3D",
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 18,
  },

  description: {
    color: "#777",
    marginTop: 6,
    lineHeight: 18,
  },

  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 18,
  },

  openText: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "600",
  },

  section: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
  },

  project: {
    backgroundColor: "#17171D",
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  projectTitle: {
    color: "#fff",
    fontWeight: "bold",
  },
});

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}