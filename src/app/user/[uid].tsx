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
  subscribePublicProfile,
} from "../../services/profileService";

import {
  followUser,
  subscribeFollowerCount,
  subscribeFollowingCount,
  subscribeFollowState,
  unfollowUser,
} from "../../services/followService";

import {
  createNotification,
} from "../../services/notificationService";


import type {
  GuitarPreset,
} from "../../data/presets";

import type {
  CloudCommunityPost,
} from "../../services/communityService";

import {
  subscribeUserPosts,
} from "../../services/communityService";

import {
  getPresetById,
  removePresetFromLibrary,
  savePresetToLibrary,
  subscribeMyPresets,
  subscribePublicPresets,
} from "../../services/presetService";

import {
  CommunityPostCard,
} from "../../components/community/CloudCommunityFeed";

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

export default function PublicProfileScreen() {
  const {
    uid,
  } =
    useLocalSearchParams<{
      uid: string;
    }>();

  const {
    user,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] =
    useState<
      PublicProfile | null
    >(null);

  const [
    following,
    setFollowing,
  ] = useState(false);

  const [
    followers,
    setFollowers,
  ] = useState(0);

  const [
    followingCount,
    setFollowingCount,
  ] = useState(0);

  const [
    changingFollow,
    setChangingFollow,
  ] = useState(false);

  type ProfileContentTab =
    | "posts"
    | "presets";

  const [
    contentTab,
    setContentTab,
  ] =
    useState<ProfileContentTab>(
      "posts"
    );

  const [
    userPosts,
    setUserPosts,
  ] =
    useState<
      CloudCommunityPost[]
    >([]);

  const [
    publicPresets,
    setPublicPresets,
  ] =
    useState<GuitarPreset[]>([]);

  const [
    savedPresetIds,
    setSavedPresetIds,
  ] =
    useState<Set<string>>(
      new Set()
    );

  const [
    presetMessage,
    setPresetMessage,
  ] = useState("");

  const isOwnProfile =
    user?.uid === uid;

  // ====================================
  // POSTS + PUBLIC PRESETS
  // ====================================

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribePosts =
      subscribeUserPosts(
        uid,
        setUserPosts
      );

    const unsubscribePresets =
      subscribePublicPresets(
        uid,
        setPublicPresets
      );

    return () => {
      unsubscribePosts();
      unsubscribePresets();
    };
  }, [uid]);

  // ====================================
  // PRESETS SAVED BY CURRENT USER
  // ====================================

  useEffect(() => {
    if (!user) {
      setSavedPresetIds(
        new Set()
      );

      return;
    }

    return subscribeMyPresets(
      user.uid,

      (presets) => {
        setSavedPresetIds(
          new Set(
            presets.map(
              (preset) =>
                preset.id
            )
          )
        );
      }
    );
  }, [user?.uid]);

  // ====================================
  // PROFILE
  // ====================================

  useEffect(() => {
    if (!uid) {
      return;
    }

    return subscribePublicProfile(
      uid,
      setProfile
    );
  }, [uid]);

  // ====================================
  // COUNTS
  // ====================================

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubFollowers =
      subscribeFollowerCount(
        uid,
        setFollowers
      );

    const unsubFollowing =
      subscribeFollowingCount(
        uid,
        setFollowingCount
      );

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [uid]);

  // ====================================
  // FOLLOW STATE
  // ====================================

  useEffect(() => {
    if (
      !user ||
      !uid ||
      user.uid === uid
    ) {
      setFollowing(false);
      return;
    }

    return subscribeFollowState(
      user.uid,
      uid,
      setFollowing
    );
  }, [
    user?.uid,
    uid,
  ]);

  // ====================================
  // TOGGLE FOLLOW
  // ====================================

  async function handleFollow() {
    if (
      !user ||
      !uid ||
      isOwnProfile ||
      changingFollow
    ) {
      return;
    }

    try {
      setChangingFollow(true);

      if (following) {
        await unfollowUser(
          user.uid,
          uid
        );

        return;
      }

      await followUser(
        user.uid,
        uid
      );

      // Notification chỉ khi Follow,
      // không gửi khi unfollow.
      await createNotification(
        uid,
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
        "Follow error:",
        error
      );
    } finally {
      setChangingFollow(false);
    }
  }

  // ====================================
  // PRESET SAVE
  // ====================================

  function showPresetMessage(
    message: string
  ) {
    setPresetMessage(
      message
    );

    setTimeout(() => {
      setPresetMessage("");
    }, 2200);
  }

  async function togglePreset(
    preset: GuitarPreset
  ) {
    if (!user) {
      router.push(
        "/login" as any
      );

      return;
    }

    try {
      const isSaved =
        savedPresetIds.has(
          preset.id
        );

      if (isSaved) {
        await removePresetFromLibrary(
          user.uid,
          preset.id
        );

        showPresetMessage(
          "Hoàn tác lưu preset"
        );

        return;
      }

      await savePresetToLibrary(
        user.uid,
        preset
      );

      showPresetMessage(
        "Đã lưu preset"
      );

      if (
        preset.creatorId !==
        user.uid
      ) {
        try {
          await createNotification(
            preset.creatorId,
            {
              type:
                "preset_saved",

              actorId:
                user.uid,

              actorName:
                user.displayName ||
                user.email
                  ?.split("@")[0] ||
                "Guitarist",

              presetId:
                preset.id,

              message:
                `đã lưu preset ${preset.name} của bạn.`,
            }
          );
        } catch (error) {
          // Save đã thành công,
          // notification fail không
          // được undo save.
          console.error(
            "Preset notification error:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Profile preset toggle error:",
        error
      );

      showPresetMessage(
        "Không thể cập nhật preset"
      );
    }
  }

  async function togglePostPreset(
    post: CloudCommunityPost
  ) {
    if (
      !post.presetId ||
      !user
    ) {
      return;
    }

    try {
      const isSaved =
        savedPresetIds.has(
          post.presetId
        );

      if (isSaved) {
        await removePresetFromLibrary(
          user.uid,
          post.presetId
        );

        showPresetMessage(
          "Hoàn tác lưu preset"
        );

        return;
      }

      const preset =
        await getPresetById(
          post.presetId
        );

      if (!preset) {
        showPresetMessage(
          "Preset không còn tồn tại"
        );

        return;
      }

      await togglePreset(
        preset
      );
    } catch (error) {
      console.error(
        "Profile post preset error:",
        error
      );

      showPresetMessage(
        "Không thể cập nhật preset"
      );
    }
  }

  if (!profile) {
    return (
      <View
        style={
          styles.center
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

  const emoji =
    getEmojiAvatar(
      profile.uid
    );

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
              styles.iconButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Guitar Profile
          </Text>

          <TouchableOpacity
            style={
              styles.iconButton
            }
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* PROFILE */}

        <View
          style={
            styles.profileSection
          }
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

          <Text
            style={
              styles.name
            }
          >
            {profile.displayName}
          </Text>

          <Text
            style={
              styles.username
            }
          >
            @{profile.username}
          </Text>

          {profile.bio !== "" && (
            <Text
              style={
                styles.bio
              }
            >
              {profile.bio}
            </Text>
          )}

          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,

                following &&
                  styles.followingButton,
              ]}
              disabled={
                changingFollow
              }
              onPress={
                handleFollow
              }
            >
              <Ionicons
                name={
                  following
                    ? "checkmark"
                    : "person-add-outline"
                }
                size={18}
                color={
                  following
                    ? "#A78BFA"
                    : "#FFFFFF"
                }
              />

              <Text
                style={[
                  styles.followButtonText,

                  following &&
                    styles.followingButtonText,
                ]}
              >
                {following
                  ? "Following"
                  : "Follow"}
              </Text>
            </TouchableOpacity>
          )}

          {isOwnProfile && (
            <TouchableOpacity
              style={
                styles.followingButton
              }
              onPress={() =>
                router.push(
                  "/profile" as any
                )
              }
            >
              <Text
                style={
                  styles.followingButtonText
                }
              >
                My Profile
              </Text>
            </TouchableOpacity>
          )}

          {/* SOCIAL STATS */}

          <View
            style={
              styles.stats
            }
          >
            <TouchableOpacity
              style={
                styles.stat
              }
              onPress={() =>
                router.push(
                  `/connections/${uid}?tab=followers`                    as any
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.statValue
                }
              >
                {followers}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Followers
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.divider
              }
            />

            <TouchableOpacity
              style={
                styles.stat
              }
              onPress={() =>
                router.push(
                  `/connections/${uid}?tab=following`                    as any
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.statValue
                }
              >
                {followingCount}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Following
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GUITAR IDENTITY */}

        <View
          style={
            styles.card
          }
        >
          <View
            style={
              styles.cardTitleRow
            }
          >
            <Ionicons
              name="musical-notes"
              size={21}
              color="#A78BFA"
            />

            <Text
              style={
                styles.cardTitle
              }
            >
              Guitar Identity
            </Text>
          </View>

          <ProfileRow
            label="Level"
            value={
              profile.level ||
              "Beginner"
            }
          />

          <ProfileRow
            label="Genres"
            value={
              profile
                .favoriteGenres
                .length
                ? profile
                    .favoriteGenres
                    .join(" • ")
                : "Not set"
            }
          />

          <ProfileRow
            label="Gear"
            value={
              profile.gear.length
                ? profile.gear.join(
                    ", "
                  )
                : "Not set"
            }
          />
        </View>

        {/* ================================= */}
        {/* PROFILE CONTENT */}
        {/* ================================= */}

        <View
          style={
            styles.contentTabs
          }
        >
          <TouchableOpacity
            style={[
              styles.contentTab,

              contentTab ===
                "posts" &&
                styles.contentTabActive,
            ]}
            onPress={() =>
              setContentTab(
                "posts"
              )
            }
          >
            <Text
              style={[
                styles.contentTabText,

                contentTab ===
                  "posts" &&
                  styles.contentTabTextActive,
              ]}
            >
              Posts
            </Text>

            <View
              style={
                styles.tabCount
              }
            >
              <Text
                style={
                  styles.tabCountText
                }
              >
                {userPosts.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.contentTab,

              contentTab ===
                "presets" &&
                styles.contentTabActive,
            ]}
            onPress={() =>
              setContentTab(
                "presets"
              )
            }
          >
            <Text
              style={[
                styles.contentTabText,

                contentTab ===
                  "presets" &&
                  styles.contentTabTextActive,
              ]}
            >
              Presets
            </Text>

            <View
              style={
                styles.tabCount
              }
            >
              <Text
                style={
                  styles.tabCountText
                }
              >
                {publicPresets.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {presetMessage !== "" && (
          <View
            style={
              styles.presetMessage
            }
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#4ADE80"
            />

            <Text
              style={
                styles.presetMessageText
              }
            >
              {presetMessage}
            </Text>
          </View>
        )}

        {contentTab ===
          "posts" && (
          <View
            style={
              styles.profileContent
            }
          >
            {userPosts.length ===
            0 ? (
              <ProfileContentEmpty
                icon="newspaper-outline"
                title="No posts yet"
                text="Guitarist này chưa có bài viết công khai."
              />
            ) : (
              userPosts.map(
                (post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    isSaved={
                      post.presetId
                        ? savedPresetIds.has(
                            post.presetId
                          )
                        : false
                    }
                    onTogglePreset={() =>
                      togglePostPreset(
                        post
                      )
                    }
                  />
                )
              )
            )}
          </View>
        )}

        {contentTab ===
          "presets" && (
          <View
            style={
              styles.profileContent
            }
          >
            {publicPresets.length ===
            0 ? (
              <ProfileContentEmpty
                icon="options-outline"
                title="No public presets"
                text="Guitarist này chưa chia sẻ preset công khai."
              />
            ) : (
              publicPresets.map(
                (preset) => (
                  <PublicPresetCard
                    key={preset.id}
                    preset={preset}
                    isSaved={
                      savedPresetIds.has(
                        preset.id
                      )
                    }
                    isOwnProfile={
                      isOwnProfile
                    }
                    onToggle={() =>
                      togglePreset(
                        preset
                      )
                    }
                  />
                )
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PublicPresetCard({
  preset,
  isSaved,
  isOwnProfile,
  onToggle,
}: {
  preset: GuitarPreset;

  isSaved: boolean;

  isOwnProfile: boolean;

  onToggle: () => void;
}) {
  return (
    <View
      style={
        styles.publicPresetCard
      }
    >
      <View
        style={
          styles.publicPresetIcon
        }
      >
        <Ionicons
          name="options"
          size={25}
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
            styles.publicPresetName
          }
        >
          {preset.name}
        </Text>

        <Text
          style={
            styles.publicPresetCode
          }
        >
          {preset.code}
        </Text>

        {preset.description ? (
          <Text
            style={
              styles.publicPresetDescription
            }
            numberOfLines={2}
          >
            {
              preset.description
            }
          </Text>
        ) : null}

        <View
          style={
            styles.publicPresetTags
          }
        >
          {(preset.tags ?? [])
            .slice(0, 5)
            .map((tag) => (
              <View
                key={tag}
                style={
                  styles.publicPresetTag
                }
              >
                <Text
                  style={
                    styles.publicPresetTagText
                  }
                >
                  {tag}
                </Text>
              </View>
            ))}
        </View>
      </View>

      {isOwnProfile ? (
        <View
          style={
            styles.ownPresetBadge
          }
        >
          <Ionicons
            name="person"
            size={14}
            color="#A78BFA"
          />

          <Text
            style={
              styles.ownPresetText
            }
          >
            Yours
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.profileSaveButton,

            isSaved &&
              styles.profileSavedButton,
          ]}
          onPress={
            onToggle
          }
        >
          <Ionicons
            name={
              isSaved
                ? "checkmark"
                : "bookmark-outline"
            }
            size={16}
            color={
              isSaved
                ? "#4ADE80"
                : "#FFFFFF"
            }
          />

          <Text
            style={[
              styles.profileSaveText,

              isSaved &&
                styles.profileSavedText,
            ]}
          >
            {isSaved
              ? "Saved"
              : "Save"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ProfileContentEmpty({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <View
      style={
        styles.contentEmpty
      }
    >
      <Ionicons
        name={icon}
        size={35}
        color="#666"
      />

      <Text
        style={
          styles.contentEmptyTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.contentEmptyText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.profileRow
      }
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
  );
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
      maxWidth: 780,

      alignSelf: "center",

      padding: 24,
      paddingTop: 34,
      paddingBottom: 60,
    },

    center: {
      flex: 1,
      backgroundColor:
        "#0B0B0F",
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      color: "#777",
    },

    header: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    headerTitle: {
      color: "#FFFFFF",

      fontSize: 17,
      fontWeight: "bold",
    },

    iconButton: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems: "center",
      justifyContent: "center",
    },

    profileSection: {
      alignItems: "center",

      marginTop: 35,
    },

    avatar: {
      width: 100,
      height: 100,

      borderRadius: 32,
    },

    emojiAvatar: {
      width: 100,
      height: 100,

      borderRadius: 32,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    emoji: {
      fontSize: 46,
    },

    name: {
      color: "#FFFFFF",

      fontSize: 25,

      fontWeight: "bold",

      marginTop: 18,
    },

    username: {
      color: "#777",

      fontSize: 13,

      marginTop: 5,
    },

    bio: {
      color: "#BDBDBD",

      textAlign: "center",

      maxWidth: 450,

      lineHeight: 20,

      marginTop: 14,
    },

    followButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      minWidth: 150,

      backgroundColor:
        "#7C3AED",

      borderRadius: 13,

      paddingHorizontal: 25,
      paddingVertical: 12,

      marginTop: 20,
    },

    followButtonText: {
      color: "#FFFFFF",

      fontWeight: "bold",
    },

    followingButton: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      minWidth: 150,

      backgroundColor:
        "#17171D",

      borderWidth: 1,

      borderColor:
        "#34343E",

      borderRadius: 13,

      paddingHorizontal: 25,
      paddingVertical: 12,

      marginTop: 20,
    },

    followingButtonText: {
      color: "#A78BFA",

      fontWeight: "bold",
    },

    stats: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 30,

      backgroundColor:
        "#17171D",

      borderRadius: 18,

      paddingVertical: 16,

      paddingHorizontal: 35,
    },

    stat: {
      minWidth: 110,

      alignItems: "center",
    },

    statValue: {
      color: "#FFFFFF",

      fontSize: 20,

      fontWeight: "bold",
    },

    statLabel: {
      color: "#777",

      fontSize: 11,

      marginTop: 3,
    },

    divider: {
      width: 1,
      height: 33,

      backgroundColor:
        "#303038",
    },

    card: {
      backgroundColor:
        "#17171D",

      borderRadius: 20,

      padding: 20,

      marginTop: 22,
    },

    cardTitleRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 9,

      marginBottom: 14,
    },

    cardTitle: {
      color: "#FFFFFF",

      fontSize: 16,

      fontWeight: "bold",
    },

    profileRow: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      gap: 15,

      paddingVertical: 12,

      borderTopWidth: 1,

      borderTopColor:
        "#292930",
    },

    rowLabel: {
      color: "#777",

      fontSize: 12,
    },

    rowValue: {
      color: "#FFFFFF",

      fontSize: 12,

      fontWeight: "600",

      flex: 1,

      textAlign: "right",
    },

    contentTabs: {
      flexDirection: "row",
      backgroundColor: "#17171D",
      borderRadius: 16,
      padding: 5,
      marginTop: 22,
    },

    contentTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 11,
      borderRadius: 12,
    },

    contentTabActive: {
      backgroundColor: "#7C3AED",
    },

    contentTabText: {
      color: "#777",
      fontSize: 13,
      fontWeight: "600",
    },

    contentTabTextActive: {
      color: "#FFFFFF",
    },

    tabCount: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      backgroundColor: "#292930",
      alignItems: "center",
      justifyContent: "center",
    },

    tabCountText: {
      color: "#BBBBBB",
      fontSize: 9,
      fontWeight: "bold",
    },

    profileContent: {
      marginTop: 15,
    },

    presetMessage: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: "#17231B",
      borderWidth: 1,
      borderColor: "#285436",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginTop: 13,
    },

    presetMessageText: {
      color: "#D5F5DE",
      fontSize: 12,
      fontWeight: "600",
    },

    publicPresetCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "#17171D",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#292930",
      padding: 16,
      marginBottom: 11,
    },

    publicPresetIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: "#251B3D",
      alignItems: "center",
      justifyContent: "center",
    },

    publicPresetName: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "bold",
    },

    publicPresetCode: {
      color: "#A78BFA",
      fontSize: 11,
      fontWeight: "700",
      marginTop: 3,
    },

    publicPresetDescription: {
      color: "#888",
      fontSize: 11,
      lineHeight: 16,
      marginTop: 6,
    },

    publicPresetTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 8,
    },

    publicPresetTag: {
      backgroundColor: "#292930",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    publicPresetTagText: {
      color: "#AAAAAA",
      fontSize: 9,
    },

    profileSaveButton: {
      minWidth: 80,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: "#7C3AED",
      borderRadius: 11,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },

    profileSavedButton: {
      backgroundColor: "#1C2A21",
      borderWidth: 1,
      borderColor: "#2F5A3B",
    },

    profileSaveText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "bold",
    },

    profileSavedText: {
      color: "#4ADE80",
    },

    ownPresetBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#251B3D",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    ownPresetText: {
      color: "#A78BFA",
      fontSize: 10,
      fontWeight: "600",
    },

    contentEmpty: {
      backgroundColor: "#17171D",
      borderRadius: 18,
      alignItems: "center",
      paddingVertical: 45,
      paddingHorizontal: 25,
    },

    contentEmptyTitle: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "bold",
      marginTop: 11,
    },

    contentEmptyText: {
      color: "#666",
      fontSize: 11,
      textAlign: "center",
      lineHeight: 17,
      marginTop: 5,
    },
  });