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
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../config/firebase";

import {
  loginWithGoogle,
} from "../services/authService";

export default function RegisterScreen() {
  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  // ============================================
  // EMAIL REGISTER
  // ============================================

  async function handleRegister() {
    if (
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing information",
        "Please fill in all fields."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      Alert.alert(
        "Password",
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password",
        "Password must contain at least 6 characters."
      );

      return;
    }

    try {
      setLoading(true);

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const user =
        credential.user;

      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
          uid: user.uid,

          email:
            user.email || "",

          username:
            username.trim(),

          displayName:
            username.trim(),

          avatarUrl: "",

          level:
            "beginner",

          plan:
            "free",

          streak: 0,

          practiceMinutes: 0,

          provider:
            "password",

          createdAt:
            serverTimestamp(),
        }
      );

      router.replace(
        "/(tabs)" as any
      );
    } catch (error: any) {
      console.error(
        "Register error:",
        error
      );

      let message =
        "Cannot create account.";

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        message =
          "This email is already registered.";
      }

      if (
        error.code ===
        "auth/weak-password"
      ) {
        message =
          "Password is too weak.";
      }

      if (
        error.code ===
        "auth/invalid-email"
      ) {
        message =
          "Invalid email address.";
      }

      Alert.alert(
        "Register failed",
        message
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // GOOGLE REGISTER / LOGIN
  // ============================================

  async function handleGoogleRegister() {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In native will be configured when Android/iOS support is added."
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
        "Google register error:",
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
          "Add localhost in Firebase Authentication → Settings → Authorized domains."
        );

        return;
      }

      Alert.alert(
        "Google Sign-In failed",
        error.message ||
          "Cannot continue with Google."
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
          Create Account
        </Text>

        <Text style={styles.subtitle}>
          Join Guitar Companion
        </Text>

        {/* USERNAME */}

        <Text style={styles.label}>
          Username
        </Text>

        <TextInput
          value={username}
          onChangeText={
            setUsername
          }
          placeholder="phucguitar"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

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

        {/* CONFIRM PASSWORD */}

        <Text style={styles.label}>
          Confirm Password
        </Text>

        <TextInput
          value={confirmPassword}
          onChangeText={
            setConfirmPassword
          }
          placeholder="••••••••"
          placeholderTextColor="#666"
          secureTextEntry
          style={styles.input}
        />

        {/* EMAIL REGISTER */}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={
            handleRegister
          }
          disabled={
            loading ||
            googleLoading
          }
        >
          <Text
            style={
              styles.primaryText
            }
          >
            {loading
              ? "Creating..."
              : "Create Account"}
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
            handleGoogleRegister
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

        {/* LOGIN */}

        <TouchableOpacity
          onPress={() =>
            router.replace(
              "/login" as any
            )
          }
        >
          <Text
            style={
              styles.secondaryText
            }
          >
            Already have an account?{" "}

            <Text style={styles.link}>
              Login
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
      marginBottom: 20,
    },

    label: {
      color: "#AAA",

      fontSize: 12,

      fontWeight: "600",

      marginTop: 12,
      marginBottom: 7,
    },

    input: {
      backgroundColor:
        "#101015",

      borderRadius: 13,

      paddingHorizontal: 15,
      paddingVertical: 13,

      color: "#FFFFFF",
    },

    primaryButton: {
      backgroundColor:
        "#7C3AED",

      borderRadius: 14,

      paddingVertical: 15,

      alignItems: "center",

      marginTop: 22,
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

      marginVertical: 20,
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