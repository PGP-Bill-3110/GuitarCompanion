import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

interface PdfViewerProps {
  file: string;
}

export default function PdfViewer({
  file,
}: PdfViewerProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="document-text-outline"
        size={60}
        color="#A78BFA"
      />

      <Text style={styles.title}>
        PDF Score
      </Text>

      <Text style={styles.description}>
        Trình đọc PDF native sẽ được
        bổ sung khi chuyển sang bản
        Android/iOS.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          Linking.openURL(file)
        }
      >
        <Text style={styles.buttonText}>
          Mở PDF
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: "#202027",

      padding: 30,
    },

    title: {
      color: "#FFFFFF",

      fontSize: 22,
      fontWeight: "bold",

      marginTop: 15,
    },

    description: {
      color: "#888",

      textAlign: "center",

      lineHeight: 20,

      marginTop: 8,
    },

    button: {
      backgroundColor: "#7C3AED",

      paddingHorizontal: 25,
      paddingVertical: 14,

      borderRadius: 14,

      marginTop: 20,
    },

    buttonText: {
      color: "#FFFFFF",

      fontWeight: "bold",
    },
  });