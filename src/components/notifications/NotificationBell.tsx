import {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
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
  subscribeUnreadNotificationCount,
} from "../../services/notificationService";

export default function NotificationBell() {
  const {
    user,
  } = useAuth();

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe =
      subscribeUnreadNotificationCount(
        user.uid,
        setUnreadCount
      );

    return unsubscribe;
  }, [user?.uid]);

  return (
    <TouchableOpacity
      style={
        styles.button
      }
      onPress={() =>
        router.push(
          "/notifications" as any
        )
      }
      activeOpacity={0.8}
    >
      <Ionicons
        name="notifications-outline"
        size={23}
        color="#FFFFFF"
      />

      {unreadCount > 0 && (
        <View
          style={
            styles.badge
          }
        >
          <Text
            style={
              styles.badgeText
            }
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    button: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems: "center",
      justifyContent: "center",

      position: "relative",
    },

    badge: {
      position: "absolute",

      top: -4,
      right: -4,

      minWidth: 19,
      height: 19,

      paddingHorizontal: 5,

      borderRadius: 10,

      backgroundColor:
        "#EF4444",

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 2,

      borderColor:
        "#0B0B0F",
    },

    badgeText: {
      color: "#FFFFFF",

      fontSize: 9,

      fontWeight: "bold",
    },
  });