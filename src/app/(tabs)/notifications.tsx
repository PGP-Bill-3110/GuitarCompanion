import {
  useEffect,
  useMemo,
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
  AppNotification,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from "../../services/notificationService";

export default function NotificationsScreen() {
  const {
    user,
  } = useAuth();

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      AppNotification[]
    >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ====================================
  // REALTIME NOTIFICATIONS
  // ====================================

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);

      return;
    }

    setLoading(true);

    const unsubscribe =
      subscribeNotifications(
        user.uid,

        (items) => {
          setNotifications(
            items
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, [user?.uid]);

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            !item.read
        ).length,
      [notifications]
    );

  // ====================================
  // OPEN NOTIFICATION
  // ====================================

  async function handleOpenNotification(
    notification:
      AppNotification
  ) {
    if (!user) {
      return;
    }

    try {
      if (
        !notification.read
      ) {
        await markNotificationRead(
          user.uid,
          notification.id
        );
      }

      // Hiện chưa có post-detail.
      // Tạm chuyển về Community.
      if (
        notification.type ===
          "post_like" ||
        notification.type ===
          "post_comment" ||
        notification.type ===
          "follow_post"
      ) {
        router.push(
          "/community" as any
        );

        return;
      }

      if (
        notification.type ===
        "preset_saved"
      ) {
        router.push(
          "/preset" as any
        );
      }
    } catch (error) {
      console.error(
        "Open notification error:",
        error
      );
    }
  }

  // ====================================
  // MARK ALL
  // ====================================

  async function handleMarkAll() {
    if (!user) {
      return;
    }

    try {
      await markAllNotificationsRead(
        user.uid
      );
    } catch (error) {
      console.error(
        "Mark all read error:",
        error
      );
    }
  }

  // ====================================
  // NOT LOGGED IN
  // ====================================

  if (!user) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Ionicons
          name="notifications-outline"
          size={50}
          color="#555"
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          Login required
        </Text>

        <TouchableOpacity
          style={
            styles.loginButton
          }
          onPress={() =>
            router.replace(
              "/login" as any
            )
          }
        >
          <Text
            style={
              styles.loginText
            }
          >
            Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

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

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.title
              }
            >
              Notifications
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={
                handleMarkAll
              }
            >
              <Text
                style={
                  styles.markAll
                }
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LOADING */}

        {loading && (
          <View
            style={
              styles.empty
            }
          >
            <Text
              style={
                styles.emptyText
              }
            >
              Loading notifications...
            </Text>
          </View>
        )}

        {/* EMPTY */}

        {!loading &&
          notifications.length ===
            0 && (
            <View
              style={
                styles.empty
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={35}
                  color="#A78BFA"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No notifications yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Likes, comments and
                preset saves will
                appear here.
              </Text>
            </View>
          )}

        {/* NOTIFICATIONS */}

        {!loading &&
          notifications.map(
            (
              notification,
              index
            ) => {
              const previous =
                index > 0
                  ? notifications[
                      index - 1
                    ]
                  : null;

              const currentLabel =
                getDayLabel(
                  notification
                    .createdAtMs
                );

              const previousLabel =
                previous
                  ? getDayLabel(
                      previous
                        .createdAtMs
                    )
                  : null;

              const showHeader =
                currentLabel !==
                previousLabel;

              return (
                <View
                  key={
                    notification.id
                  }
                >
                  {showHeader && (
                    <Text
                      style={
                        styles.dayLabel
                      }
                    >
                      {currentLabel}
                    </Text>
                  )}

                  <NotificationItem
                    notification={
                      notification
                    }
                    onPress={() =>
                      handleOpenNotification(
                        notification
                      )
                    }
                  />
                </View>
              );
            }
          )}
      </ScrollView>
    </View>
  );
}

// ============================================
// ITEM
// ============================================

function NotificationItem({
  notification,
  onPress,
}: {
  notification:
    AppNotification;

  onPress: () => void;
}) {
  const icon =
    getNotificationIcon(
      notification.type
    );

  const color =
    getNotificationColor(
      notification.type
    );

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,

        !notification.read &&
          styles.unreadCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.notificationIcon,

          {
            backgroundColor:
              `${color}18`,
          },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={21}
          color={color}
        />
      </View>

      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.notificationText
          }
        >
          <Text
            style={
              styles.actor
            }
          >
            {notification.actorName}
          </Text>
          {" "}
          {notification.message}
        </Text>

        <Text
          style={
            styles.time
          }
        >
          {formatTime(
            notification.createdAtMs
          )}
        </Text>
      </View>

      {!notification.read && (
        <View
          style={
            styles.unreadDot
          }
        />
      )}
    </TouchableOpacity>
  );
}

// ============================================
// HELPERS
// ============================================

function getNotificationIcon(
  type:
    AppNotification["type"]
) {
  switch (type) {
    case "post_like":
      return "heart";

    case "post_comment":
      return "chatbubble";

    case "preset_saved":
      return "bookmark";

    case "follow_post":
      return "megaphone";

    case "new_follower":
      return "person-add";

    default:
      return "notifications";
  }
}

function getNotificationColor(
  type:
    AppNotification["type"]
) {
  switch (type) {
    case "post_like":
      return "#EF476F";

    case "post_comment":
      return "#A78BFA";

    case "preset_saved":
      return "#4ADE80";

    case "follow_post":
      return "#F59E0B";

    case "new_follower":
      return "#60A5FA";

    default:
      return "#A78BFA";
  }
}

function formatTime(
  timestamp: number
) {
  const diff =
    Date.now() -
    timestamp;

  const minutes =
    Math.floor(
      diff / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days}d`;
  }

  return new Date(
    timestamp
  ).toLocaleDateString();
}

function getDayLabel(
  timestamp: number
) {
  const date =
    new Date(timestamp);

  const now =
    new Date();

  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const target =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  const diffDays =
    Math.round(
      (
        today.getTime() -
        target.getTime()
      ) /
        86400000
    );

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return date.toLocaleDateString();
}

// ============================================
// STYLE
// ============================================

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
      paddingTop: 42,
      paddingBottom: 50,
    },

    header: {
      flexDirection: "row",

      alignItems: "center",

      gap: 14,

      marginBottom: 28,
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

      fontSize: 27,

      fontWeight: "bold",
    },

    subtitle: {
      color: "#777",

      fontSize: 11,

      marginTop: 3,
    },

    markAll: {
      color: "#A78BFA",

      fontSize: 11,

      fontWeight: "600",
    },

    dayLabel: {
      color: "#888",

      fontSize: 12,

      fontWeight: "bold",

      marginTop: 16,
      marginBottom: 9,

      textTransform:
        "uppercase",
    },

    notificationCard: {
      flexDirection: "row",

      alignItems: "center",

      gap: 13,

      backgroundColor:
        "#17171D",

      borderRadius: 17,

      padding: 15,

      marginBottom: 9,

      borderWidth: 1,

      borderColor:
        "#202027",
    },

    unreadCard: {
      backgroundColor:
        "#1B1724",

      borderColor:
        "#33284A",
    },

    notificationIcon: {
      width: 44,
      height: 44,

      borderRadius: 13,

      alignItems: "center",
      justifyContent: "center",

      flexShrink: 0,
    },

    notificationText: {
      color: "#BDBDBD",

      fontSize: 13,

      lineHeight: 18,
    },

    actor: {
      color: "#FFFFFF",

      fontWeight: "bold",
    },

    time: {
      color: "#555",

      fontSize: 10,

      marginTop: 5,
    },

    unreadDot: {
      width: 8,
      height: 8,

      borderRadius: 4,

      backgroundColor:
        "#8B5CF6",
    },

    empty: {
      alignItems: "center",

      paddingVertical: 80,
    },

    emptyIcon: {
      width: 70,
      height: 70,

      borderRadius: 22,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      color: "#FFFFFF",

      fontSize: 17,

      fontWeight: "bold",

      marginTop: 15,
    },

    emptyText: {
      color: "#666",

      maxWidth: 300,

      textAlign: "center",

      lineHeight: 19,

      marginTop: 6,
    },

    center: {
      flex: 1,

      backgroundColor:
        "#0B0B0F",

      alignItems: "center",
      justifyContent: "center",
    },

    loginButton: {
      backgroundColor:
        "#7C3AED",

      borderRadius: 13,

      paddingHorizontal: 30,
      paddingVertical: 13,

      marginTop: 20,
    },

    loginText: {
      color: "#FFFFFF",

      fontWeight: "bold",
    },
  });