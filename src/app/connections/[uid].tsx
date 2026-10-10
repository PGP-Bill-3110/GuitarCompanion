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
  Image,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  PublicProfile,
  getPublicProfilesByIds,
} from "../../services/profileService";

import {
  followUser,
  subscribeFollowerIds,
  subscribeFollowingIds,
  subscribeFollowState,
  unfollowUser,
} from "../../services/followService";

import {
  createNotification,
} from "../../services/notificationService";

type ConnectionTab =
  | "followers"
  | "following";

const EMOJIS = [
  "🎸",
  "🎵",
  "🤘",
  "🎧",
  "🎶",
  "⭐",
];

function getEmojiAvatar(
  value: string
) {
  let total = 0;

  for (
    let i = 0;
    i < value.length;
    i++
  ) {
    total +=
      value.charCodeAt(i);
  }

  return EMOJIS[
    total %
      EMOJIS.length
  ];
}

export default function ConnectionsScreen() {
  const params =
    useLocalSearchParams<{
      uid: string;
      tab?: string;
    }>();

  const uid =
    params.uid;

  const {
    user,
  } = useAuth();

  const initialTab:
    ConnectionTab =
    params.tab ===
    "following"
      ? "following"
      : "followers";

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ConnectionTab>(
      initialTab
    );

  const [
    profiles,
    setProfiles,
  ] =
    useState<
      PublicProfile[]
    >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // =====================================
  // LOAD CONNECTION IDS
  // =====================================

  useEffect(() => {
    if (!uid) {
      return;
    }

    setLoading(true);

    function handleIds(
      ids: string[]
    ) {
      getPublicProfilesByIds(
        ids
      )
        .then(
          (items) => {
            const sorted =
              [...items].sort(
                (a, b) =>
                  a.displayName.localeCompare(
                    b.displayName
                  )
              );

            setProfiles(
              sorted
            );

            setLoading(
              false
            );
          }
        )
        .catch(
          (error) => {
            console.error(
              "Cannot load connection profiles:",
              error
            );

            setProfiles(
              []
            );

            setLoading(
              false
            );
          }
        );
    }

    if (
      activeTab ===
      "followers"
    ) {
      return subscribeFollowerIds(
        uid,
        handleIds
      );
    }

    return subscribeFollowingIds(
      uid,
      handleIds
    );
  }, [
    uid,
    activeTab,
  ]);

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
        showsVerticalScrollIndicator={
          false
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
              Connections
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Guitar community
            </Text>
          </View>
        </View>

        {/* TABS */}

        <View
          style={
            styles.tabs
          }
        >
          <ConnectionTabButton
            title="Followers"
            active={
              activeTab ===
              "followers"
            }
            onPress={() =>
              setActiveTab(
                "followers"
              )
            }
          />

          <ConnectionTabButton
            title="Following"
            active={
              activeTab ===
              "following"
            }
            onPress={() =>
              setActiveTab(
                "following"
              )
            }
          />
        </View>

        {/* CONTENT */}

        {loading ? (
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
              Loading...
            </Text>
          </View>
        ) : profiles.length ===
          0 ? (
          <View
            style={
              styles.empty
            }
          >
            <Ionicons
              name={
                activeTab ===
                "followers"
                  ? "people-outline"
                  : "person-add-outline"
              }
              size={40}
              color="#666"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              {activeTab ===
              "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {activeTab ===
              "followers"
                ? "Followers sẽ xuất hiện ở đây."
                : "Những guitarist đang được theo dõi sẽ xuất hiện ở đây."}
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.list
            }
          >
            {profiles.map(
              (profile) => (
                <ConnectionUserCard
                  key={
                    profile.uid
                  }
                  profile={
                    profile
                  }
                  currentUserId={
                    user?.uid
                  }
                />
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ========================================
// TAB
// ========================================

function ConnectionTabButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tab,

        active &&
          styles.tabActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabText,

          active &&
            styles.tabTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ========================================
// USER CARD
// ========================================

function ConnectionUserCard({
  profile,
  currentUserId,
}: {
  profile: PublicProfile;
  currentUserId:
    | string
    | undefined;
}) {
  const {
    user,
  } = useAuth();

  const [
    following,
    setFollowing,
  ] = useState(false);

  const [
    changing,
    setChanging,
  ] = useState(false);

  const isMe =
    currentUserId ===
    profile.uid;

  useEffect(() => {
    if (
      !currentUserId ||
      isMe
    ) {
      setFollowing(
        false
      );

      return;
    }

    return subscribeFollowState(
      currentUserId,
      profile.uid,
      setFollowing
    );
  }, [
    currentUserId,
    profile.uid,
    isMe,
  ]);

  async function handleToggleFollow() {
    if (
      !user ||
      isMe ||
      changing
    ) {
      return;
    }

    try {
      setChanging(true);

      if (following) {
        await unfollowUser(
          user.uid,
          profile.uid
        );

        return;
      }

      await followUser(
        user.uid,
        profile.uid
      );

      // New follower notification
      try {
        await createNotification(
          profile.uid,
          {
            type:
              "new_follower",

            actorId:
              user.uid,

            actorName:
              user.displayName ||
              user.email
                ?.split("@")[0] ||
              "Guitarist",

            message:
              "đã bắt đầu theo dõi bạn.",
          }
        );
      } catch (error) {
        console.error(
          "Follower notification error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Follow toggle error:",
        error
      );
    } finally {
      setChanging(
        false
      );
    }
  }

  const emoji =
    getEmojiAvatar(
      profile.uid
    );

  return (
    <View
      style={
        styles.userCard
      }
    >
      {/* CLICK PROFILE */}

      <TouchableOpacity
        style={
          styles.userInfo
        }
        onPress={() =>
          router.push(
            `/user/${profile.uid}`              as any
          )
        }
        activeOpacity={0.8}
      >
        {profile.avatarUrl ? (
          <Image
            source={{
              uri:
                profile.avatarUrl,
            }}
            style={
              styles.avatar
            }
          />
        ) : (
          <View
            style={
              styles.emojiAvatar
            }
          >
            <Text
              style={
                styles.emoji
              }
            >
              {emoji}
            </Text>
          </View>
        )}

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.name
            }
            numberOfLines={1}
          >
            {
              profile.displayName
            }
          </Text>

          <Text
            style={
              styles.username
            }
            numberOfLines={1}
          >
            @{profile.username}
          </Text>

          {profile.level ? (
            <Text
              style={
                styles.level
              }
            >
              {capitalize(
                profile.level
              )}{" "}
              guitarist
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* FOLLOW BUTTON */}

      {!isMe && (
        <TouchableOpacity
          style={[
            styles.followButton,

            following &&
              styles.followingButton,
          ]}
          disabled={
            changing
          }
          onPress={
            handleToggleFollow
          }
        >
          <Ionicons
            name={
              following
                ? "checkmark"
                : "person-add-outline"
            }
            size={15}
            color={
              following
                ? "#A78BFA"
                : "#FFFFFF"
            }
          />

          <Text
            style={[
              styles.followText,

              following &&
                styles.followingText,
            ]}
          >
            {changing
              ? "..."
              : following
              ? "Following"
              : "Follow"}
          </Text>
        </TouchableOpacity>
      )}

      {isMe && (
        <View
          style={
            styles.youBadge
          }
        >
          <Text
            style={
              styles.youText
            }
          >
            You
          </Text>
        </View>
      )}
    </View>
  );
}

function capitalize(
  value: string
) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        "#0B0B0F",
    },

    content: {
      width: "100%",

      maxWidth: 780,

      alignSelf:
        "center",

      padding: 24,

      paddingTop: 35,

      paddingBottom: 60,
    },

    header: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 14,

      marginBottom: 25,
    },

    backButton: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems:
        "center",

      justifyContent:
        "center",
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

    tabs: {
      flexDirection:
        "row",

      backgroundColor:
        "#17171D",

      borderRadius: 16,

      padding: 5,

      marginBottom: 20,
    },

    tab: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingVertical: 11,

      borderRadius: 12,
    },

    tabActive: {
      backgroundColor:
        "#7C3AED",
    },

    tabText: {
      color: "#777",

      fontSize: 13,

      fontWeight: "600",
    },

    tabTextActive: {
      color: "#FFFFFF",
    },

    list: {
      gap: 10,
    },

    userCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,

      backgroundColor:
        "#17171D",

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        "#24242C",

      padding: 14,
    },

    userInfo: {
      flex: 1,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,
    },

    avatar: {
      width: 52,
      height: 52,

      borderRadius: 16,
    },

    emojiAvatar: {
      width: 52,
      height: 52,

      borderRadius: 16,

      backgroundColor:
        "#251B3D",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emoji: {
      fontSize: 25,
    },

    name: {
      color: "#FFFFFF",

      fontSize: 14,

      fontWeight: "bold",
    },

    username: {
      color: "#777",

      fontSize: 11,

      marginTop: 3,
    },

    level: {
      color: "#A78BFA",

      fontSize: 9,

      marginTop: 5,
    },

    followButton: {
      minWidth: 93,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 5,

      backgroundColor:
        "#7C3AED",

      borderRadius: 11,

      paddingHorizontal: 12,

      paddingVertical: 9,
    },

    followingButton: {
      backgroundColor:
        "#211B2D",

      borderWidth: 1,

      borderColor:
        "#453563",
    },

    followText: {
      color: "#FFFFFF",

      fontSize: 10,

      fontWeight: "bold",
    },

    followingText: {
      color: "#A78BFA",
    },

    youBadge: {
      backgroundColor:
        "#292930",

      borderRadius: 10,

      paddingHorizontal: 12,

      paddingVertical: 8,
    },

    youText: {
      color: "#888",

      fontSize: 10,

      fontWeight: "600",
    },

    empty: {
      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#17171D",

      borderRadius: 18,

      paddingVertical: 60,

      paddingHorizontal: 30,
    },

    emptyTitle: {
      color: "#FFFFFF",

      fontSize: 15,

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