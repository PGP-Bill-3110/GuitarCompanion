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
  TextInput,
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
  GuitarPreset,
} from "../../data/presets";

import {
  subscribeMyPresets,
} from "../../services/presetService";

import {
  CloudPostType,
  createCommunityPost,
} from "../../services/communityService";

import {
  notifyFollowersOfNewPost,
} from "../../services/notificationService";

export default function CreatePostScreen() {
  const {
    user,
  } = useAuth();

  const [
    postType,
    setPostType,
  ] =
    useState<CloudPostType>(
      "text"
    );

  const [
    content,
    setContent,
  ] = useState("");

  const [
    myPresets,
    setMyPresets,
  ] =
    useState<GuitarPreset[]>([]);

  const [
    selectedPresetId,
    setSelectedPresetId,
  ] = useState("");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    if (!user) {
      setMyPresets([]);
      return;
    }

    return subscribeMyPresets(
      user.uid,
      setMyPresets
    );
  }, [user]);

  // Chỉ public preset
  // mới được share Community.
  const publicPresets =
    useMemo(
      () =>
        myPresets.filter(
          (preset) =>
            preset.visibility ===
            "public"
        ),
      [myPresets]
    );

  const selectedPreset =
    publicPresets.find(
      (preset) =>
        preset.id ===
        selectedPresetId
    );

  async function handlePost() {
    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (
      postType === "text" &&
      !content.trim()
    ) {
      setMessage(
        "Hãy nhập nội dung bài viết."
      );

      return;
    }

    if (
      postType === "preset" &&
      !selectedPreset
    ) {
      setMessage(
        "Hãy chọn một preset."
      );

      return;
    }

    if (creating) {
      return;
    }

    try {
      setCreating(true);
      setMessage("");

      const postId =
        await createCommunityPost(
          user,
          {
            type:
              postType,

            content:
              content.trim(),

            preset:
              postType ===
              "preset"
                ? selectedPreset
                : undefined,
          }
        );

      try {
        await notifyFollowersOfNewPost(
          {
            actorId:
              user.uid,

            actorName:
              user.displayName ||
              user.email
                ?.split("@")[0] ||
              "Guitarist",

            postId,

            postType,

            presetId:
              postType ===
                "preset"
                ? selectedPreset?.id
                : undefined,

            presetName:
              postType ===
                "preset"
                ? selectedPreset?.name
                : undefined,
          }
        );
      } catch (error) {
        // Post đã tạo thành công; lỗi
        // notification không được chặn.
        console.error(
          "Follower notification error:",
          error
        );
      }

      router.replace(
        "/community" as any
      );
    } catch (error) {
      console.error(
        "Create post error:",
        error
      );

      setMessage(
        "Không thể đăng bài. Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="close"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={
                styles.title
              }
            >
              Create Post
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Share with guitarists
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.postButton,

              creating &&
                styles.disabled,
            ]}
            disabled={creating}
            onPress={
              handlePost
            }
          >
            <Text
              style={
                styles.postButtonText
              }
            >
              {creating
                ? "Posting..."
                : "Post"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TYPE */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Post type
        </Text>

        <View
          style={
            styles.typeRow
          }
        >
          <TypeButton
            icon="chatbubble-outline"
            title="Text"
            active={
              postType ===
              "text"
            }
            onPress={() =>
              setPostType(
                "text"
              )
            }
          />

          <TypeButton
            icon="options-outline"
            title="Preset"
            active={
              postType ===
              "preset"
            }
            onPress={() =>
              setPostType(
                "preset"
              )
            }
          />
        </View>

        {/* CONTENT */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Caption
        </Text>

        <TextInput
          value={content}
          onChangeText={
            setContent
          }
          placeholder={
            postType ===
            "preset"
              ? "Chia sẻ gì đó về tone này..."
              : "Bạn đang nghĩ gì?"
          }
          placeholderTextColor="#666"
          multiline
          style={
            styles.textArea
          }
        />

        {/* PRESET SELECTOR */}

        {postType ===
          "preset" && (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Select Preset
            </Text>

            {publicPresets.length ===
            0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Ionicons
                  name="options-outline"
                  size={35}
                  color="#666"
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No public presets
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Bạn cần ít nhất một
                  public preset để chia
                  sẻ lên Community.
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/preset" as any
                    )
                  }
                >
                  <Text
                    style={
                      styles.purpleLink
                    }
                  >
                    Open Presets
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              publicPresets.map(
                (preset) => {
                  const selected =
                    preset.id ===
                    selectedPresetId;

                  return (
                    <TouchableOpacity
                      key={
                        preset.id
                      }
                      style={[
                        styles.presetCard,

                        selected &&
                          styles.presetCardSelected,
                      ]}
                      onPress={() =>
                        setSelectedPresetId(
                          preset.id
                        )
                      }
                    >
                      <View
                        style={
                          styles.presetIcon
                        }
                      >
                        <Ionicons
                          name="musical-notes"
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
                            styles.presetName
                          }
                        >
                          {
                            preset.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.code
                          }
                        >
                          {
                            preset.code
                          }
                        </Text>

                        <Text
                          style={
                            styles.tags
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {preset.tags.join(
                            " • "
                          )}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          selected
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={23}
                        color={
                          selected
                            ? "#8B5CF6"
                            : "#555"
                        }
                      />
                    </TouchableOpacity>
                  );
                }
              )
            )}
          </>
        )}

        {message !== "" && (
          <Text
            style={
              styles.message
            }
          >
            {message}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function TypeButton({
  icon,
  title,
  active,
  onPress,
}: {
  icon: any;
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.typeButton,

        active &&
          styles.typeButtonActive,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={
          active
            ? "#FFFFFF"
            : "#888"
        }
      />

      <Text
        style={[
          styles.typeText,

          active &&
            styles.typeTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
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
      maxWidth: 800,

      alignSelf: "center",

      padding: 24,
      paddingTop: 40,
      paddingBottom: 50,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },

    iconButton: {
      width: 45,
      height: 45,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      color: "#FFFFFF",
      fontSize: 25,
      fontWeight: "bold",
    },

    subtitle: {
      color: "#777",
      fontSize: 12,
      marginTop: 2,
    },

    postButton: {
      backgroundColor:
        "#7C3AED",

      borderRadius: 12,

      paddingHorizontal: 18,
      paddingVertical: 11,
    },

    postButtonText: {
      color: "#FFFFFF",
      fontWeight: "bold",
    },

    disabled: {
      opacity: 0.5,
    },

    sectionTitle: {
      color: "#FFFFFF",

      fontSize: 16,
      fontWeight: "bold",

      marginTop: 28,
      marginBottom: 11,
    },

    typeRow: {
      flexDirection: "row",
      gap: 10,
    },

    typeButton: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        "#17171D",

      borderRadius: 13,

      paddingVertical: 13,

      borderWidth: 1,
      borderColor:
        "#292930",
    },

    typeButtonActive: {
      backgroundColor:
        "#7C3AED",

      borderColor:
        "#8B5CF6",
    },

    typeText: {
      color: "#888",
      fontWeight: "600",
    },

    typeTextActive: {
      color: "#FFFFFF",
    },

    textArea: {
      minHeight: 130,

      backgroundColor:
        "#17171D",

      borderRadius: 18,

      padding: 17,

      color: "#FFFFFF",

      textAlignVertical:
        "top",
    },

    emptyCard: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      padding: 25,

      alignItems: "center",
    },

    emptyTitle: {
      color: "#FFFFFF",
      fontWeight: "bold",
      marginTop: 10,
    },

    emptyText: {
      color: "#777",
      textAlign: "center",
      maxWidth: 350,
      lineHeight: 19,
      marginTop: 5,
    },

    purpleLink: {
      color: "#A78BFA",
      fontWeight: "bold",
      marginTop: 15,
    },

    presetCard: {
      flexDirection: "row",

      alignItems: "center",

      gap: 13,

      backgroundColor:
        "#17171D",

      borderRadius: 17,

      borderWidth: 1,
      borderColor:
        "#25252D",

      padding: 14,

      marginBottom: 10,
    },

    presetCardSelected: {
      borderColor:
        "#7C3AED",

      backgroundColor:
        "#1D1729",
    },

    presetIcon: {
      width: 55,
      height: 55,

      borderRadius: 14,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    presetName: {
      color: "#FFFFFF",

      fontSize: 16,
      fontWeight: "bold",
    },

    code: {
      color: "#A78BFA",

      fontSize: 12,
      fontWeight: "600",

      marginTop: 3,
    },

    tags: {
      color: "#666",

      fontSize: 10,

      marginTop: 4,
    },

    message: {
      color: "#F87171",

      textAlign: "center",

      marginTop: 20,
    },
  });