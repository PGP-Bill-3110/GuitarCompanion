import { colors } from "../../theme/colors";
import AppGradientBackground from "../../components/ui/AppGradientBackground";
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
  Image,
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

import * as ImagePicker
  from "expo-image-picker";

import {
  uploadCommunityMedia,
} from "../../services/mediaService";

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
  const [
    selectedImageUri,
    setSelectedImageUri,
  ] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string>("");
  const [selectedMediaName, setSelectedMediaName] = useState<string>("");
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

  async function handlePickImage() {
    try {
      setMessage("");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        throw new Error("Image picker returned no image URI.");
      }

      setSelectedImageUri(asset.uri);
      setSelectedMediaType(asset.mimeType || "image/jpeg");
      setSelectedMediaName(asset.fileName || "photo.jpg");
      setPostType("image");
    } catch (error) {
      console.error("Pick image error:", error);
      setMessage("Không thể chọn ảnh.");
    }
  }

  async function handlePickVideo() {
    try {
      setMessage("");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) throw new Error("No video selected");
      setSelectedImageUri(asset.uri);
      setSelectedMediaType(asset.mimeType || (asset.fileName?.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4"));
      setSelectedMediaName(asset.fileName || "video.mp4");
      setPostType("video");
    } catch (error) {
      console.error("Video picker error:", error);
      setMessage("Không thể chọn video.");
    }
  }

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

    if ((postType === "image" || postType === "video") && !selectedImageUri) {
      setMessage("Hãy chọn ảnh hoặc video.");
      return;
    }

    if (creating) {
      return;
    }

    try {
      setCreating(true);
      setMessage("");

      let mediaUrl: string | undefined;
      let mediaPath: string | undefined;

      if ((postType === "image" || postType === "video") && selectedImageUri) {
        const upload = await uploadCommunityMedia(
          user.uid,
          selectedImageUri,
          selectedMediaType,
          selectedMediaName
        );
        mediaUrl = upload.url;
        mediaPath = upload.path;
      }

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

            mediaUrl,
            mediaPath,
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
      <AppGradientBackground />
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
            icon="image-outline"
            title="Image"
            active={postType === "image"}
            onPress={handlePickImage}
          />

          <TypeButton
            icon="videocam-outline"
            title="Video"
            active={postType === "video"}
            onPress={handlePickVideo}
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
          placeholderTextColor={colors.textMuted}
          multiline
          style={
            styles.textArea
          }
        />

        {(postType === "image" || postType === "video") && selectedImageUri && (
          <View style={styles.imagePreviewCard}>
            {postType === "image" ? (
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePreview, { alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="videocam" size={38} color="#E5BAD1" />
                <Text style={{ color: "#FFFFFF", marginTop: 8 }}>{selectedMediaName}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeImageButton}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
              onPress={() => {
                setSelectedImageUri(null);
                setPostType("text");
              }}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

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
                  color={colors.textMuted}
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
                          color={colors.accent}
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
                            ? colors.accent
                            : colors.textDim
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
            : colors.textSoft
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
      backgroundColor: "#355C7D",
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
        colors.surface,

      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    title: {
      color: "#FFFFFF",
      fontSize: 25,
      fontWeight: "bold",
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },

    postButton: {
      backgroundColor:
        colors.action,

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
        colors.surface,

      borderRadius: 13,

      paddingVertical: 13,

      borderWidth: 1,
      borderColor:
        colors.border,
    },

    typeButtonActive: {
      backgroundColor: colors.activeSoft,

      borderColor: colors.borderAccent,
      borderWidth: 1,
    },

    typeText: {
      color: colors.textSoft,
      fontWeight: "600",
    },

    typeTextActive: {
      color: "#FFFFFF",
    },

    textArea: {
      minHeight: 130,

      backgroundColor:
        colors.surface,

      borderRadius: 18,

      padding: 17,

      color: "#FFFFFF",

      textAlignVertical:
        "top",
    },

    imagePreviewCard: {
      position: "relative",
      marginTop: 14,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    imagePreview: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: colors.surfaceDeep,
    },

    removeImageButton: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(0,0,0,0.65)",
      alignItems: "center",
      justifyContent: "center",
    },

    emptyCard: {
      backgroundColor:
        colors.surface,

      borderRadius: 18,

      padding: 25,

      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    emptyTitle: {
      color: "#FFFFFF",
      fontWeight: "bold",
      marginTop: 10,
    },

    emptyText: {
      color: colors.textMuted,
      textAlign: "center",
      maxWidth: 350,
      lineHeight: 19,
      marginTop: 5,
    },

    purpleLink: {
      color: colors.accent,
      fontWeight: "bold",
      marginTop: 15,
    },

    presetCard: {
      flexDirection: "row",

      alignItems: "center",

      gap: 13,

      backgroundColor:
        colors.surface,

      borderRadius: 17,

      borderWidth: 1,
      borderColor:
        colors.border,

      padding: 14,

      marginBottom: 10,
    },

    presetCardSelected: {
      borderColor:
        colors.borderAccent,

      backgroundColor:
        colors.activeSoft,
      borderWidth: 1,
    },

    presetIcon: {
      width: 55,
      height: 55,

      borderRadius: 14,

      backgroundColor:
        colors.accentSoft,

      alignItems: "center",
      justifyContent: "center",
    },

    presetName: {
      color: "#FFFFFF",

      fontSize: 16,
      fontWeight: "bold",
    },

    code: {
      color: colors.accent,

      fontSize: 12,
      fontWeight: "600",

      marginTop: 3,
    },

    tags: {
      color: colors.textMuted,

      fontSize: 10,

      marginTop: 4,
    },

    message: {
      color: "#F87171",

      textAlign: "center",

      marginTop: 20,
    },
  });