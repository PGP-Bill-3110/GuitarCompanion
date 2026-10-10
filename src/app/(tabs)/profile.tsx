import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  signOut,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../config/firebase";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  PracticeStats,
  subscribePracticeStats,
} from "../../services/practiceService";

// ======================================================
// TYPE
// ======================================================

interface UserProfile {
  uid?: string;

  email?: string;

  username?: string;

  displayName?: string;

  avatarUrl?: string;

  level?: string;

  plan?: string;

  streak?: number;

  practiceMinutes?: number;
}

// ======================================================
// EMOJI FALLBACK
// ======================================================

const DEFAULT_AVATARS = [
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
  if (!value) {
    return "🎸";
  }

  let total = 0;

  for (let i = 0; i < value.length; i++) {
    total += value.charCodeAt(i);
  }

  return DEFAULT_AVATARS[
    total % DEFAULT_AVATARS.length
  ];
}

// ======================================================
// SCREEN
// ======================================================

export default function ProfileScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile | null>(
      null
    );

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [
    practiceStats,
    setPracticeStats,
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

    return subscribePracticeStats(
      user.uid,
      setPracticeStats
    );
  }, [user?.uid]);

  // ====================================================
  // LOAD FIRESTORE PROFILE
  // ====================================================

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const unsubscribe =
      onSnapshot(
        userRef,

        (snapshot) => {
          if (snapshot.exists()) {
            setProfile(
              snapshot.data() as UserProfile
            );
          } else {
            // Fallback nếu Firestore profile
            // chưa tồn tại.
            setProfile({
              uid: user.uid,

              email:
                user.email || "",

              displayName:
                user.displayName || "",

              avatarUrl:
                user.photoURL || "",

              level:
                "beginner",

              plan:
                "free",

              streak: 0,

              practiceMinutes: 0,
            });
          }

          setProfileLoading(false);
        },

        (error) => {
          console.error(
            "Profile error:",
            error
          );

          setProfileLoading(false);
        }
      );

    return unsubscribe;
  }, [user]);

  // ====================================================
  // PROFILE VALUES
  // ====================================================

  const displayName =
    profile?.displayName ||
    profile?.username ||
    user?.displayName ||
    "Guitarist";

  const username =
    profile?.username ||
    user?.email?.split("@")[0] ||
    "guitarist";

  const email =
    profile?.email ||
    user?.email ||
    "";

  const avatarUrl =
    profile?.avatarUrl ||
    user?.photoURL ||
    "";

  const level =
    profile?.level ||
    "beginner";

  const plan =
    profile?.plan ||
    "free";

  const emojiAvatar =
    useMemo(
      () =>
        getEmojiAvatar(
          user?.uid ||
            username
        ),
      [
        user?.uid,
        username,
      ]
    );

  // ====================================================
  // LOGOUT
  // ====================================================

  async function handleLogout() {
    try {
      await signOut(auth);

      router.replace(
        "/login" as any
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      Alert.alert(
        "Logout failed",
        "Please try again."
      );
    }
  }

  // ====================================================
  // LOADING
  // ====================================================

  if (
    authLoading ||
    profileLoading
  ) {
    return (
      <View
        style={
          styles.centerScreen
        }
      >
        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  // ====================================================
  // NOT LOGGED IN
  // ====================================================

  if (!user) {
    return (
      <View
        style={
          styles.centerScreen
        }
      >
        <View
          style={
            styles.guestAvatar
          }
        >
          <Text
            style={
              styles.guestEmoji
            }
          >
            🎸
          </Text>
        </View>

        <Text
          style={
            styles.guestTitle
          }
        >
          Guitar Companion
        </Text>

        <Text
          style={
            styles.guestText
          }
        >
          Login to save your
          progress, presets and
          practice history.
        </Text>

        <TouchableOpacity
          style={
            styles.loginButton
          }
          onPress={() =>
            router.push(
              "/login" as any
            )
          }
        >
          <Text
            style={
              styles.loginButtonText
            }
          >
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/register" as any
            )
          }
        >
          <Text
            style={
              styles.registerText
            }
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ====================================================
  // PROFILE
  // ====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* =============================================== */}
      {/* HEADER                                          */}
      {/* =============================================== */}

      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.pageTitle
          }
        >
          Profile
        </Text>

        <TouchableOpacity
          style={
            styles.settingsButton
          }
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* =============================================== */}
      {/* USER CARD                                       */}
      {/* =============================================== */}

      <View
        style={
          styles.profileCard
        }
      >
        {/* AVATAR */}

        {avatarUrl ? (
          <Image
            source={{
              uri: avatarUrl,
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
                styles.emojiText
              }
            >
              {emojiAvatar}
            </Text>
          </View>
        )}

        {/* USER INFO */}

        <View
          style={
            styles.profileInfo
          }
        >
          <View
            style={
              styles.nameRow
            }
          >
            <Text
              style={
                styles.displayName
              }
              numberOfLines={1}
            >
              {displayName}
            </Text>

            <View
              style={[
                styles.planBadge,

                plan ===
                  "premium" &&
                  styles.premiumBadge,
              ]}
            >
              <Ionicons
                name={
                  plan ===
                  "premium"
                    ? "diamond"
                    : "person"
                }
                size={11}
                color={
                  plan ===
                  "premium"
                    ? "#FBBF24"
                    : "#A78BFA"
                }
              />

              <Text
                style={[
                  styles.planText,

                  plan ===
                    "premium" &&
                    styles.premiumText,
                ]}
              >
                {plan.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.username
            }
          >
            @{username}
          </Text>

          <Text
            style={
              styles.email
            }
          >
            {email}
          </Text>

          <View
            style={
              styles.levelBadge
            }
          >
            <Ionicons
              name="musical-note"
              size={12}
              color="#A78BFA"
            />

            <Text
              style={
                styles.levelText
              }
            >
              {formatLevel(
                level
              )}
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.editProfileButton
            }
            onPress={() =>
              router.push(
                "/edit-profile" as any
              )
            }
          >
            <Ionicons
              name="create-outline"
              size={17}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.editProfileText
              }
            >
              Edit Guitar Identity
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =============================================== */}
      {/* STATS                                           */}
      {/* =============================================== */}

      <View
        style={
          styles.statsRow
        }
      >
        <StatCard
          icon="flame"
          value={`${practiceStats.streak}`}
          label="Day Streak"
        />

        <StatCard
          icon="time"
          value={`${practiceStats.totalMinutes}m`}
          label="Practice"
        />

        <StatCard
          icon="musical-notes"
          value="0"
          label="Presets"
        />
      </View>

      {/* =============================================== */}
      {/* GUITAR IDENTITY                                 */}
      {/* =============================================== */}

      <Text
        style={
          styles.sectionTitle
        }
      >
        Guitar Identity
      </Text>

      <View
        style={
          styles.identityCard
        }
      >
        <ProfileRow
          icon="school-outline"
          label="Skill Level"
          value={formatLevel(
            level
          )}
        />

        <ProfileRow
          icon="diamond-outline"
          label="Membership"
          value={
            plan ===
            "premium"
              ? "Premium"
              : "Free"
          }
        />

        <ProfileRow
          icon="musical-notes-outline"
          label="Favorite Genres"
          value="Not set"
        />

        <ProfileRow
          icon="guitar-outline"
          label="My Gear"
          value="Not set"
          fallbackIcon
        />
      </View>

      {/* =============================================== */}
      {/* CONTENT                                         */}
      {/* =============================================== */}

      <Text
        style={
          styles.sectionTitle
        }
      >
        My Content
      </Text>

      <View
        style={
          styles.menuCard
        }
      >
        <MenuRow
          icon="options-outline"
          title="My Presets"
          subtitle="Saved and created tones"
          onPress={() =>
            router.push(
              "/preset" as any
            )
          }
        />

        <MenuRow
          icon="stats-chart-outline"
          title="Practice History"
          subtitle="Track your progress"
        />

        <MenuRow
          icon="trophy-outline"
          title="Achievements"
          subtitle="Your guitar milestones"
        />

        <MenuRow
          icon="people-outline"
          title="Following"
          subtitle="Guitarists you follow"
          last
        />
      </View>

      {/* =============================================== */}
      {/* ACCOUNT                                         */}
      {/* =============================================== */}

      <Text
        style={
          styles.sectionTitle
        }
      >
        Account
      </Text>

      <View
        style={
          styles.menuCard
        }
      >
        <MenuRow
          icon="create-outline"
          title="Edit Profile"
          subtitle="Username, avatar and preferences"
        />

        <MenuRow
          icon="shield-checkmark-outline"
          title="Privacy"
          subtitle="Account and visibility settings"
          last
        />
      </View>

      {/* LOGOUT */}

      <TouchableOpacity
        style={
          styles.logoutButton
        }
        onPress={
          handleLogout
        }
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#F87171"
        />

        <Text
          style={
            styles.logoutText
          }
        >
          Logout
        </Text>
      </TouchableOpacity>

      <Text
        style={
          styles.footer
        }
      >
        Guitar Companion
      </Text>
    </ScrollView>
  );
}

// ======================================================
// HELPER COMPONENTS
// ======================================================

function StatCard({
  icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.statCard
      }
    >
      <Ionicons
        name={icon}
        size={22}
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

function ProfileRow({
  icon,
  label,
  value,
  fallbackIcon,
}: {
  icon: any;
  label: string;
  value: string;
  fallbackIcon?: boolean;
}) {
  return (
    <View
      style={
        styles.profileRow
      }
    >
      <View
        style={
          styles.rowIcon
        }
      >
        <Ionicons
          name={
            fallbackIcon
              ? "hardware-chip-outline"
              : icon
          }
          size={20}
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
            styles.rowLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.rowValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  last,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.menuRow,

        !last &&
          styles.menuBorder,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={
          styles.menuIcon
        }
      >
        <Ionicons
          name={icon}
          size={21}
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
            styles.menuTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.menuSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#555"
      />
    </TouchableOpacity>
  );
}

function formatLevel(
  level: string
) {
  if (!level) {
    return "Beginner";
  }

  return (
    level.charAt(0).toUpperCase() +
    level.slice(1)
  );
}

// ======================================================
// STYLE
// ======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        "#0B0B0F",
    },

    content: {
      width: "100%",

      maxWidth: 900,

      alignSelf: "center",

      padding: 24,
      paddingTop: 48,
      paddingBottom: 50,
    },

    centerScreen: {
      flex: 1,

      backgroundColor:
        "#0B0B0F",

      alignItems: "center",
      justifyContent: "center",

      padding: 30,
    },

    loadingText: {
      color: "#888",
    },

    header: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 25,
    },

    pageTitle: {
      color: "#FFFFFF",

      fontSize: 30,

      fontWeight: "bold",
    },

    settingsButton: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems: "center",
      justifyContent: "center",
    },

    // PROFILE

    profileCard: {
      backgroundColor:
        "#17171D",

      borderRadius: 22,

      padding: 20,

      flexDirection: "row",

      alignItems: "center",
    },

    avatar: {
      width: 88,
      height: 88,

      borderRadius: 28,

      backgroundColor:
        "#25252D",
    },

    emojiAvatar: {
      width: 88,
      height: 88,

      borderRadius: 28,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    emojiText: {
      fontSize: 42,
    },

    profileInfo: {
      flex: 1,

      marginLeft: 18,
    },

    nameRow: {
      flexDirection: "row",

      alignItems: "center",

      flexWrap: "wrap",

      gap: 8,
    },

    displayName: {
      color: "#FFFFFF",

      fontSize: 22,

      fontWeight: "bold",

      maxWidth: "70%",
    },

    username: {
      color: "#A78BFA",

      marginTop: 5,

      fontWeight: "600",
    },

    email: {
      color: "#777",

      marginTop: 4,

      fontSize: 12,
    },

    editProfileButton: {
      alignSelf: "flex-start",

      flexDirection: "row",

      alignItems: "center",

      gap: 7,

      backgroundColor: "#7C3AED",

      borderRadius: 12,

      paddingHorizontal: 14,

      paddingVertical: 9,

      marginTop: 12,
    },

    editProfileText: {
      color: "#FFFFFF",

      fontSize: 12,

      fontWeight: "bold",
    },

    planBadge: {
      flexDirection: "row",

      alignItems: "center",

      gap: 4,

      backgroundColor:
        "#251B3D",

      paddingHorizontal: 8,
      paddingVertical: 4,

      borderRadius: 8,
    },

    premiumBadge: {
      backgroundColor:
        "#3A2C0A",
    },

    planText: {
      color: "#A78BFA",

      fontSize: 9,

      fontWeight: "bold",
    },

    premiumText: {
      color: "#FBBF24",
    },

    levelBadge: {
      alignSelf:
        "flex-start",

      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      backgroundColor:
        "#202027",

      borderRadius: 8,

      paddingHorizontal: 8,
      paddingVertical: 5,

      marginTop: 9,
    },

    levelText: {
      color: "#AAA",

      fontSize: 11,

      fontWeight: "600",
    },

    // STATS

    statsRow: {
      flexDirection: "row",

      gap: 10,

      marginTop: 15,
    },

    statCard: {
      flex: 1,

      backgroundColor:
        "#17171D",

      borderRadius: 16,

      paddingVertical: 16,

      alignItems: "center",
    },

    statValue: {
      color: "#FFFFFF",

      fontSize: 19,

      fontWeight: "bold",

      marginTop: 6,
    },

    statLabel: {
      color: "#777",

      fontSize: 10,

      marginTop: 3,
    },

    sectionTitle: {
      color: "#FFFFFF",

      fontSize: 19,

      fontWeight: "bold",

      marginTop: 28,
      marginBottom: 12,
    },

    // IDENTITY

    identityCard: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      paddingHorizontal: 17,
    },

    profileRow: {
      minHeight: 67,

      flexDirection: "row",

      alignItems: "center",

      gap: 13,

      borderBottomWidth: 1,

      borderBottomColor:
        "#26262D",
    },

    rowIcon: {
      width: 38,
      height: 38,

      borderRadius: 11,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    rowLabel: {
      color: "#777",

      fontSize: 10,
    },

    rowValue: {
      color: "#FFFFFF",

      fontWeight: "600",

      marginTop: 3,
    },

    // MENUS

    menuCard: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      paddingHorizontal: 16,

      overflow: "hidden",
    },

    menuRow: {
      minHeight: 73,

      flexDirection: "row",

      alignItems: "center",

      gap: 13,
    },

    menuBorder: {
      borderBottomWidth: 1,

      borderBottomColor:
        "#26262D",
    },

    menuIcon: {
      width: 40,
      height: 40,

      borderRadius: 12,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    menuTitle: {
      color: "#FFFFFF",

      fontWeight: "600",
    },

    menuSubtitle: {
      color: "#666",

      fontSize: 11,

      marginTop: 3,
    },

    logoutButton: {
      marginTop: 30,

      minHeight: 52,

      borderRadius: 15,

      backgroundColor:
        "#211416",

      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 9,
    },

    logoutText: {
      color: "#F87171",

      fontWeight: "bold",
    },

    footer: {
      color: "#444",

      textAlign: "center",

      marginTop: 25,

      fontSize: 11,
    },

    // GUEST

    guestAvatar: {
      width: 100,
      height: 100,

      borderRadius: 30,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    guestEmoji: {
      fontSize: 48,
    },

    guestTitle: {
      color: "#FFFFFF",

      fontSize: 25,

      fontWeight: "bold",

      marginTop: 20,
    },

    guestText: {
      color: "#777",

      textAlign: "center",

      maxWidth: 350,

      lineHeight: 21,

      marginTop: 8,
    },

    loginButton: {
      width: "100%",

      maxWidth: 320,

      backgroundColor:
        "#7C3AED",

      borderRadius: 14,

      paddingVertical: 14,

      alignItems: "center",

      marginTop: 25,
    },

    loginButtonText: {
      color: "#FFFFFF",

      fontWeight: "bold",
    },

    registerText: {
      color: "#A78BFA",

      fontWeight: "600",

      marginTop: 17,
    },
  });