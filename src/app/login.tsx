import {
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  auth,
} from "../config/firebase";

import {
  loginWithGoogle,
} from "../services/authService";

export default function LoginScreen() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  // ============================================
  // EMAIL LOGIN
  // ============================================

  async function handleLogin() {
    if (
      !email.trim() ||
      !password
    ) {
      Alert.alert(
        "Missing information",
        "Enter email and password."
      );

      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.replace(
        "/(tabs)" as any
      );
    } catch (error: any) {
      console.error(
        "Login error:",
        error
      );

      Alert.alert(
        "Login failed",
        "Email or password is incorrect."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // GOOGLE LOGIN
  // ============================================

  async function handleGoogleLogin() {
    // Code hiện tại dành cho Expo Web.
    if (Platform.OS !== "web") {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In native sẽ được cấu hình khi build Android/iOS."
      );

      return;
    }

    try {
      setGoogleLoading(true);

      await loginWithGoogle();

      router.replace(
        "/(tabs)" as any
      );
    } catch (error: any) {
      console.error(
        "Google login error:",
        error
      );

      if (
        error.code ===
        "auth/popup-closed-by-user"
      ) {
        return;
      }

      if (
        error.code ===
        "auth/popup-blocked"
      ) {
        Alert.alert(
          "Popup blocked",
          "Please allow popups and try again."
        );

        return;
      }

      if (
        error.code ===
        "auth/unauthorized-domain"
      ) {
        Alert.alert(
          "Unauthorized domain",
          "Add localhost to Firebase Authentication → Settings → Authorized domains."
        );

        return;
      }

      Alert.alert(
        "Google login failed",
        error.message ||
          "Cannot login with Google."
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* LOGO */}

        <View style={styles.logoCircle}>
          <Text style={styles.logo}>
            ♪
          </Text>
        </View>

        <Text style={styles.title}>
          Welcome Back
        </Text>

        <Text style={styles.subtitle}>
          Login to Guitar Companion
        </Text>

        {/* EMAIL */}

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@email.com"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />

        {/* PASSWORD */}

        <Text style={styles.label}>
          Password
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#666"
          secureTextEntry
          style={styles.input}
        />

        {/* LOGIN */}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={
            loading ||
            googleLoading
          }
        >
          <Text style={styles.primaryText}>
            {loading
              ? "Logging in..."
              : "Login"}
          </Text>
        </TouchableOpacity>

        {/* DIVIDER */}

        <View style={styles.divider}>
          <View
            style={styles.dividerLine}
          />

          <Text
            style={styles.dividerText}
          >
            OR
          </Text>

          <View
            style={styles.dividerLine}
          />
        </View>

        {/* GOOGLE */}

        <TouchableOpacity
          style={[
            styles.googleButton,
            googleLoading &&
              styles.disabledButton,
          ]}
          onPress={
            handleGoogleLogin
          }
          disabled={
            googleLoading ||
            loading
          }
        >
          <View
            style={
              styles.googleIcon
            }
          >
            <Text
              style={
                styles.googleLetter
              }
            >
              G
            </Text>
          </View>

          <Text
            style={
              styles.googleButtonText
            }
          >
            {googleLoading
              ? "Connecting..."
              : "Continue with Google"}
          </Text>
        </TouchableOpacity>

        {/* REGISTER */}

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/register" as any
            )
          }
        >
          <Text
            style={
              styles.secondaryText
            }
          >
            Don't have an account?{" "}

            <Text style={styles.link}>
              Register
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        "#0B0B0F",

      alignItems: "center",
      justifyContent: "center",

      padding: 24,
    },

    card: {
      width: "100%",

      maxWidth: 430,

      backgroundColor:
        "#17171D",

      borderRadius: 24,

      padding: 28,
    },

    logoCircle: {
      width: 70,
      height: 70,

      alignSelf: "center",

      borderRadius: 22,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    logo: {
      color: "#A78BFA",

      fontSize: 42,

      fontWeight: "bold",
    },

    title: {
      color: "#FFFFFF",

      fontSize: 28,

      fontWeight: "bold",

      textAlign: "center",

      marginTop: 20,
    },

    subtitle: {
      color: "#777",

      textAlign: "center",

      marginTop: 6,
      marginBottom: 25,
    },

    label: {
      color: "#AAA",

      fontSize: 12,

      fontWeight: "600",

      marginTop: 14,
      marginBottom: 7,
    },

    input: {
      backgroundColor:
        "#101015",

      borderRadius: 13,

      paddingHorizontal: 15,
      paddingVertical: 14,

      color: "#FFFFFF",
    },

    primaryButton: {
      backgroundColor:
        "#7C3AED",

      borderRadius: 14,

      paddingVertical: 15,

      alignItems: "center",

      marginTop: 25,
    },

    disabledButton: {
      opacity: 0.6,
    },

    primaryText: {
      color: "#FFFFFF",

      fontWeight: "bold",

      fontSize: 15,
    },

    divider: {
      flexDirection: "row",

      alignItems: "center",

      marginVertical: 22,
    },

    dividerLine: {
      flex: 1,

      height: 1,

      backgroundColor:
        "#303038",
    },

    dividerText: {
      color: "#666",

      fontSize: 11,

      marginHorizontal: 13,

      fontWeight: "600",
    },

    googleButton: {
      minHeight: 50,

      borderRadius: 14,

      backgroundColor:
        "#FFFFFF",

      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 16,

      gap: 12,
    },

    googleIcon: {
      width: 27,
      height: 27,

      borderRadius: 14,

      borderWidth: 1,
      borderColor: "#DDD",

      alignItems: "center",
      justifyContent: "center",
    },

    googleLetter: {
      color: "#4285F4",

      fontWeight: "bold",

      fontSize: 17,
    },

    googleButtonText: {
      color: "#202124",

      fontSize: 14,

      fontWeight: "600",
    },

    secondaryText: {
      color: "#777",

      textAlign: "center",

      marginTop: 22,
    },

    link: {
      color: "#A78BFA",

      fontWeight: "bold",
    },
  });