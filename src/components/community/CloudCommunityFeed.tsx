import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    TextInput,
} from "react-native";

import {
    Ionicons,
} from "@expo/vector-icons";

import {
    useAuth,
} from "../../context/AuthContext";

import {
  CloudComment,
  CloudCommunityPost,
  createPostComment,
  setCommentReaction,
  setPostLike,
  subscribeCommentReactions,
  subscribeCommunityPosts,
  subscribePostComments,
  subscribePostLikes,
} from "../../services/communityService";

import {
    getPresetById,
    removePresetFromLibrary,
    savePresetToLibrary,
    subscribeMyPresets,
} from "../../services/presetService";

import {
  createNotification,
} from "../../services/notificationService";

import {
  subscribeFollowingIds,
} from "../../services/followService";

import {
  router,
} from "expo-router";

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

type CommunityFeedMode =
  | "discover"
  | "following";

export default function CloudCommunityFeed({
  mode = "discover",
}: {
  mode?: CommunityFeedMode;
}) {
  const {
    user,
  } = useAuth();

  const [
    posts,
    setPosts,
  ] =
    useState<
      CloudCommunityPost[]
    >([]);

  const [
    followingIds,
    setFollowingIds,
  ] = useState<string[]>([]);

  const [
    followingLoaded,
    setFollowingLoaded,
  ] = useState(false);

  const [
    savedPresetIds,
    setSavedPresetIds,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    toastMessage,
    setToastMessage,
  ] = useState("");

  useEffect(() => {
    return subscribeCommunityPosts(
      setPosts
    );
  }, []);

  useEffect(() => {
    if (
      mode !== "following" ||
      !user
    ) {
      setFollowingIds([]);
      setFollowingLoaded(true);

      return;
    }

    setFollowingLoaded(false);

    return subscribeFollowingIds(
      user.uid,

      (ids) => {
        setFollowingIds(ids);
        setFollowingLoaded(true);
      }
    );
  }, [
    mode,
    user?.uid,
  ]);

  const visiblePosts =
    useMemo(() => {
      if (
        mode === "discover"
      ) {
        return posts;
      }

      const followingSet =
        new Set(
          followingIds
        );

      return posts.filter(
        (post) =>
          followingSet.has(
            post.authorId
          )
      );
    }, [
      posts,
      followingIds,
      mode,
    ]);

  useEffect(() => {
    if (!user) {
      setSavedPresetIds(
        new Set()
      );

      return;
    }

    const unsubscribe =
      subscribeMyPresets(
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

    return unsubscribe;
  }, [user]);

  function showToast(
    message: string
  ) {
    setToastMessage(
      message
    );

    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  }

  async function handleTogglePreset(
    post: CloudCommunityPost
  ) {
    if (
      !user ||
      !post.presetId
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

        showToast(
          "Hoàn tác lưu preset"
        );

        return;
      }

      const preset =
        await getPresetById(
          post.presetId
        );

      if (!preset) {
        showToast(
          "Preset không còn tồn tại"
        );

        return;
      }

      await savePresetToLibrary(
        user.uid,
        preset
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
                user.email?.split("@")[0] ||
                "Guitarist",

              presetId:
                preset.id,

              postId:
                post.id,

              message:
                `đã lưu preset ${preset.name} của bạn.`,
            }
          );
        } catch (error) {
          console.error(
            "Create preset-saved notification error:",
            error
          );
        }
      }

      showToast(
        "Đã lưu preset"
      );
    } catch (error) {
      console.error(
        "Toggle preset error:",
        error
      );

      showToast(
        "Không thể cập nhật preset"
      );
    }
  }

  if (
    mode === "following" &&
    !followingLoaded
  ) {
    return (
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
          Loading following feed...
        </Text>
      </View>
    );
  }

  if (
    mode === "following" &&
    followingIds.length === 0
  ) {
    return (
      <View
        style={
          styles.empty
        }
      >
        <Ionicons
          name="people-outline"
          size={36}
          color="#666"
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          Chưa follow ai
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Follow các guitarist trong
          Discover để xem bài viết của
          họ tại đây.
        </Text>
      </View>
    );
  }

  if (
    mode === "following" &&
    visiblePosts.length === 0
  ) {
    return (
      <View
        style={
          styles.empty
        }
      >
        <Ionicons
          name="newspaper-outline"
          size={36}
          color="#666"
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          Chưa có bài mới
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Những bài đăng mới từ người
          bạn theo dõi sẽ xuất hiện ở đây.
        </Text>
      </View>
    );
  }

  if (
    mode === "discover" &&
    visiblePosts.length === 0
  ) {
    return (
      <View
        style={
          styles.empty
        }
      >
        <Ionicons
          name="chatbubbles-outline"
          size={36}
          color="#666"
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          Chưa có bài đăng
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Hãy là người đầu tiên chia sẻ
          với Community.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {toastMessage !== "" && (
        <View
          style={
            styles.toast
          }
        >
          <Ionicons
            name="checkmark-circle"
            size={19}
            color="#4ADE80"
          />

          <Text
            style={
              styles.toastText
            }
          >
            {toastMessage}
          </Text>
        </View>
      )}

      {visiblePosts.map(
        (post) => {
          const isSaved =
            post.presetId
              ? savedPresetIds.has(
                  post.presetId
                )
              : false;

          return (
            <CommunityPostCard
              key={post.id}
              post={post}
              isSaved={isSaved}
              onTogglePreset={() =>
                handleTogglePreset(
                  post
                )
              }
            />
          );
        }
      )}
    </View>
  );
}

export function CommunityPostCard({
  post,
  isSaved,
  onTogglePreset,
}: {
  post: CloudCommunityPost;

  isSaved: boolean;

  onTogglePreset:
    () => void;
}) {
  const {
    user,
  } = useAuth();

  const [
    comments,
    setComments,
  ] =
    useState<CloudComment[]>([]);

  const [
    commentsOpen,
    setCommentsOpen,
  ] = useState(false);

  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    postingComment,
    setPostingComment,
  ] = useState(false);

  useEffect(() => {
    return subscribePostComments(
      post.id,
      setComments
    );
  }, [post.id]);

  async function handleComment() {
    if (!user) {
      Alert.alert(
        "Login required",
        "Bạn cần đăng nhập để bình luận."
      );

      return;
    }

    const cleanComment =
      commentText.trim();

    if (!cleanComment) {
      return;
    }

    if (postingComment) {
      return;
    }

    try {
      setPostingComment(true);

      await createPostComment(
        user,
        post.id,
        cleanComment
      );

      if (
        post.authorId !==
        user.uid
      ) {
        try {
          await createNotification(
            post.authorId,
            {
              type:
                "post_comment",

              actorId:
                user.uid,

              actorName:
                user.displayName ||
                user.email?.split("@")[0] ||
                "Guitarist",

              postId:
                post.id,

              message:
                "đã bình luận bài viết của bạn.",
            }
          );
        } catch (error) {
          console.error(
            "Create comment notification error:",
            error
          );
        }
      }

      setCommentText("");

      setCommentsOpen(true);
    } catch (error) {
      console.error(
        "Create comment error:",
        error
      );

      Alert.alert(
        "Comment",
        "Không thể đăng bình luận."
      );
    } finally {
      setPostingComment(false);
    }
  }

  const emoji =
    getEmojiAvatar(
      post.authorId
    );

  return (
    <View
      style={
        styles.card
      }
    >
      {/* AUTHOR */}

      <View
        style={
          styles.authorRow
        }
      >
        <TouchableOpacity
          style={
            styles.authorProfileButton
          }
          onPress={() =>
            router.push(
              `/user/${post.authorId}`                as any
            )
          }
          activeOpacity={0.8}
        >
          {post.authorAvatarUrl ? (
            <Image
              source={{
                uri:
                  post.authorAvatarUrl,
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

          <View>
            <Text
              style={
                styles.authorName
              }
            >
              {post.authorName}
            </Text>

            <Text
              style={
                styles.username
              }
            >
              @{post.authorUsername}
              {"  "}•{"  "}
              {formatTime(
                post.createdAtMs
              )}
            </Text>
          </View>
        </TouchableOpacity>

        <View
          style={{ flex: 1 }}
        />

        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color="#777"
        />
      </View>

      {/* TEXT */}

      {post.content !==
        "" && (
        <Text
          style={
            styles.content
          }
        >
          {post.content}
        </Text>
      )}

      {post.type === "image" && post.mediaUrl && (
        <View style={styles.mediaBox}>
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* PRESET */}

      {post.type ===
        "preset" &&
        post.presetPreview && (
          <View
            style={
              styles.presetBox
            }
          >
            <View
              style={
                styles.presetHeader
              }
            >
              <View
                style={
                  styles.presetIcon
                }
              >
                <Ionicons
                  name="options"
                  size={26}
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
                    post
                      .presetPreview
                      .name
                  }
                </Text>

                <Text
                  style={
                    styles.presetCreator
                  }
                >
                  by{" "}
                  {
                    post
                      .presetPreview
                      .creator
                  }
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.presetCode
              }
            >
              {
                post
                  .presetPreview
                  .code
              }
            </Text>

            <View
              style={
                styles.tags
              }
            >
              {post.presetPreview.tags
                .slice(0, 5)
                .map(
                  (tag) => (
                    <View
                      key={
                        tag
                      }
                      style={
                        styles.tag
                      }
                    >
                      <Text
                        style={
                          styles.tagText
                        }
                      >
                        {tag}
                      </Text>
                    </View>
                  )
                )}
            </View>

            <TouchableOpacity
              style={[
                styles.savePresetButton,

                isSaved &&
                  styles.savedPresetButton,
              ]}
              onPress={
                onTogglePreset
              }
            >
              <Ionicons
                name={
                  isSaved
                    ? "checkmark-circle"
                    : "bookmark-outline"
                }
                size={18}
                color={
                  isSaved
                    ? "#4ADE80"
                    : "#FFFFFF"
                }
              />

              <Text
                style={[
                  styles.savePresetText,

                  isSaved &&
                    styles.savedPresetText,
                ]}
              >
                {isSaved
                  ? "Saved"
                  : "Save Preset"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* ACTIONS */}

      <View
        style={
          styles.actions
        }
      >
        <PostLikeButton
          post={post}
        />

        <TouchableOpacity
          style={
            styles.action
          }
          onPress={() =>
            setCommentsOpen(
              !commentsOpen
            )
          }
        >
          <Ionicons
            name={
              commentsOpen
                ? "chatbubble"
                : "chatbubble-outline"
            }
            size={19}
            color={
              commentsOpen
                ? "#A78BFA"
                : "#888"
            }
          />

          <Text
            style={[
              styles.actionText,

              commentsOpen &&
                styles.commentActiveText,
            ]}
          >
            {comments.length}
          </Text>
        </TouchableOpacity>
      </View>

      {commentsOpen && (
        <View
          style={
            styles.commentsSection
          }
        >
          <View
            style={
              styles.commentInputRow
            }
          >
            <View
              style={
                styles.commentAvatar
              }
            >
              <Text
                style={
                  styles.commentAvatarEmoji
                }
              >
                {user
                  ? getEmojiAvatar(
                      user.uid
                    )
                  : "🎸"}
              </Text>
            </View>

            <TextInput
              value={commentText}
              onChangeText={
                setCommentText
              }
              placeholder="Viết bình luận..."
              placeholderTextColor="#666"
              style={
                styles.commentInput
              }
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendCommentButton,

                (!commentText.trim() ||
                  postingComment) &&
                  styles.sendCommentDisabled,
              ]}
              disabled={
                !commentText.trim() ||
                postingComment
              }
              onPress={
                handleComment
              }
            >
              <Ionicons
                name="send"
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {comments.length === 0 ? (
            <Text
              style={
                styles.noComments
              }
            >
              Chưa có bình luận.
              Hãy là người đầu tiên.
            </Text>
          ) : (
            comments.map(
              (comment) => (
                <CommentItem
                  key={
                    comment.id
                  }
                  postId={
                    post.id
                  }
                  comment={
                    comment
                  }
                />
              )
            )
          )}
        </View>
      )}
    </View>
  );
}

function PostLikeButton({
  post,
}: {
  post: CloudCommunityPost;
}) {
  const {
    user,
  } = useAuth();

  const [
    likeData,
    setLikeData,
  ] = useState({
    count: 0,
    liked: false,
  });

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  useEffect(() => {
    return subscribePostLikes(
      post.id,
      user?.uid,
      setLikeData
    );
  }, [post.id, user?.uid]);

  async function handleToggleLike() {
    if (!user || isUpdating) {
      return;
    }

    const liked =
      likeData.liked;

    setIsUpdating(true);

    try {
      await setPostLike(
        post.id,
        user.uid,
        !liked
      );

      if (
        !liked &&
        post.authorId !==
          user.uid
      ) {
        try {
          await createNotification(
            post.authorId,
            {
              type:
                "post_like",

              actorId:
                user.uid,

              actorName:
                user.displayName ||
                user.email?.split("@")[0] ||
                "Guitarist",

              postId:
                post.id,

              message:
                "đã thích bài viết của bạn.",
            }
          );
        } catch (error) {
          console.error(
            "Create post-like notification error:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Toggle post like error:",
        error
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <TouchableOpacity
      style={
        styles.action
      }
      onPress={
        handleToggleLike
      }
      disabled={
        !user || isUpdating
      }
      accessibilityRole="button"
      accessibilityLabel={
        likeData.liked
          ? "Unlike post"
          : "Like post"
      }
    >
      <Ionicons
        name={
          likeData.liked
            ? "heart"
            : "heart-outline"
        }
        size={20}
        color={
          likeData.liked
            ? "#EF4444"
            : "#888"
        }
      />

      <Text
        style={
          styles.actionText
        }
      >
        {likeData.count}
      </Text>
    </TouchableOpacity>
  );
}

function CommentItem({
  postId,
  comment,
}: {
  postId: string;
  comment: CloudComment;
}) {
  const {
    user,
  } = useAuth();

  const [
    likes,
    setLikes,
  ] = useState(0);

  const [
    dislikes,
    setDislikes,
  ] = useState(0);

  const [
    myReaction,
    setMyReaction,
  ] = useState<
    "like" |
    "dislike" |
    null
  >(null);

  const [
    reacting,
    setReacting,
  ] = useState(false);

  useEffect(() => {
    return subscribeCommentReactions(
      postId,
      comment.id,
      user?.uid,
      ({
        likes,
        dislikes,
        myReaction,
      }) => {
        setLikes(likes);
        setDislikes(dislikes);
        setMyReaction(myReaction);
      }
    );
  }, [
    postId,
    comment.id,
    user?.uid,
  ]);

  async function handleReaction(
    type:
      | "like"
      | "dislike"
  ) {
    if (!user || reacting) {
      return;
    }

    try {
      setReacting(true);

      await setCommentReaction(
        postId,
        comment.id,
        user.uid,
        myReaction === type
          ? null
          : type
      );
    } catch (error) {
      console.error(
        "Comment reaction error:",
        error
      );
    } finally {
      setReacting(false);
    }
  }

  const emoji =
    getEmojiAvatar(
      comment.authorId
    );

  function openProfile() {
    router.push(
      `/user/${comment.authorId}`        as any
    );
  }

  return (
    <View
      style={
        styles.commentItem
      }
    >
      <TouchableOpacity
        onPress={openProfile}
        activeOpacity={0.8}
      >
        {comment.authorAvatarUrl ? (
          <Image
            source={{
              uri:
                comment.authorAvatarUrl,
            }}
            style={
              styles.commentUserAvatar
            }
          />
        ) : (
          <View
            style={
              styles.commentAvatar
            }
          >
            <Text
              style={
                styles.commentAvatarEmoji
              }
            >
              {emoji}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
        }}
      >
        <View
          style={
            styles.commentBody
          }
        >
          <View
            style={
              styles.commentHeader
            }
          >
            <TouchableOpacity
              onPress={openProfile}
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.commentAuthor
                }
              >
                {comment.authorName}
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.commentTime
              }
            >
              {formatTime(
                comment.createdAtMs
              )}
            </Text>
          </View>

          <Text
            style={
              styles.commentContent
            }
          >
            {comment.content}
          </Text>
        </View>

        <View
          style={
            styles.commentReactions
          }
        >
          <TouchableOpacity
            style={
              styles.commentReactionButton
            }
            disabled={reacting}
            onPress={() =>
              handleReaction("like")
            }
          >
            <Ionicons
              name={
                myReaction === "like"
                  ? "thumbs-up"
                  : "thumbs-up-outline"
              }
              size={15}
              color={
                myReaction === "like"
                  ? "#A78BFA"
                  : "#777"
              }
            />

            <Text
              style={[
                styles.commentReactionText,
                myReaction === "like" &&
                  styles.commentReactionActive,
              ]}
            >
              {likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.commentReactionButton
            }
            disabled={reacting}
            onPress={() =>
              handleReaction("dislike")
            }
          >
            <Ionicons
              name={
                myReaction === "dislike"
                  ? "thumbs-down"
                  : "thumbs-down-outline"
              }
              size={15}
              color={
                myReaction === "dislike"
                  ? "#F87171"
                  : "#777"
              }
            />

            <Text
              style={[
                styles.commentReactionText,
                myReaction === "dislike" &&
                  styles.commentDislikeActive,
              ]}
            >
              {dislikes}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function formatTime(
  timestamp: number
) {
  const difference =
    Date.now() -
    timestamp;

  const minutes =
    Math.floor(
      difference /
        60000
    );

  if (minutes < 1) {
    return "now";
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

  return `${days}d`;
}

const styles =
  StyleSheet.create({
    card: {
      backgroundColor:
        "#17171D",

      borderRadius: 20,

      padding: 18,

      marginBottom: 15,
    },

    authorRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 11,
    },

    authorProfileButton: {
      flexDirection: "row",

      alignItems: "center",

      gap: 11,
    },

    avatar: {
      width: 44,
      height: 44,

      borderRadius: 14,
    },

    emojiAvatar: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    emoji: {
      fontSize: 22,
    },

    authorName: {
      color: "#FFFFFF",

      fontWeight: "bold",

      fontSize: 14,
    },

    username: {
      color: "#666",

      fontSize: 11,

      marginTop: 3,
    },

    content: {
      color: "#E5E5E5",

      fontSize: 14,

      lineHeight: 21,

      marginTop: 15,
    },

    mediaBox: {
      width: "100%",
      marginTop: 15,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#101015",
    },

    postImage: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: "#101015",
    },

    presetBox: {
      backgroundColor:
        "#101015",

      borderRadius: 17,

      padding: 16,

      marginTop: 15,

      borderWidth: 1,

      borderColor:
        "#292930",
    },

    presetHeader: {
      flexDirection: "row",

      alignItems: "center",

      gap: 12,
    },

    presetIcon: {
      width: 48,
      height: 48,

      borderRadius: 13,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    presetName: {
      color: "#FFFFFF",

      fontSize: 17,

      fontWeight: "bold",
    },

    presetCreator: {
      color: "#777",

      fontSize: 11,

      marginTop: 3,
    },

    presetCode: {
      color: "#A78BFA",

      fontSize: 14,

      fontWeight: "bold",

      marginTop: 14,
    },

    tags: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 6,

      marginTop: 9,
    },

    tag: {
      backgroundColor:
        "#292930",

      borderRadius: 8,

      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    tagText: {
      color: "#AAA",

      fontSize: 10,
    },

    savePresetButton: {
      backgroundColor:
        "#7C3AED",

      borderRadius: 11,

      paddingVertical: 11,

      marginTop: 15,

      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 7,
    },

    savePresetText: {
      color: "#FFFFFF",

      fontWeight: "bold",

      fontSize: 12,
    },

    savedPresetButton: {
      backgroundColor:
        "#1C2A21",

      borderWidth: 1,

      borderColor:
        "#2F5A3B",
    },

    savedPresetText: {
      color: "#4ADE80",
    },

    toast: {
      alignSelf: "center",

      flexDirection: "row",

      alignItems: "center",

      gap: 8,

      backgroundColor:
        "#17231B",

      borderWidth: 1,

      borderColor:
        "#285436",

      borderRadius: 13,

      paddingHorizontal: 16,
      paddingVertical: 11,

      marginBottom: 15,
    },

    toastText: {
      color: "#D5F5DE",

      fontWeight: "600",

      fontSize: 13,
    },

    actions: {
      flexDirection: "row",

      alignItems: "center",

      gap: 20,

      marginTop: 16,

      paddingTop: 14,

      borderTopWidth: 1,

      borderTopColor:
        "#292930",
    },

    action: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,
    },

    actionText: {
      color: "#888",

      fontSize: 11,
    },

    commentActiveText: {
      color: "#A78BFA",
      fontWeight: "600",
    },

    commentsSection: {
      marginTop: 14,

      paddingTop: 14,

      borderTopWidth: 1,

      borderTopColor:
        "#292930",
    },

    commentInputRow: {
      flexDirection: "row",

      alignItems: "flex-end",

      gap: 9,

      marginBottom: 16,
    },

    commentAvatar: {
      width: 36,
      height: 36,

      borderRadius: 11,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",

      flexShrink: 0,
    },

    commentAvatarEmoji: {
      fontSize: 18,
    },

    commentInput: {
      flex: 1,

      minHeight: 42,
      maxHeight: 100,

      backgroundColor:
        "#101015",

      borderRadius: 13,

      paddingHorizontal: 13,
      paddingVertical: 10,

      color: "#FFFFFF",

      textAlignVertical:
        "top",
    },

    sendCommentButton: {
      width: 42,
      height: 42,

      borderRadius: 12,

      backgroundColor:
        "#7C3AED",

      alignItems: "center",
      justifyContent: "center",
    },

    sendCommentDisabled: {
      opacity: 0.4,
    },

    commentItem: {
      flexDirection: "row",

      alignItems: "flex-start",

      gap: 9,

      marginBottom: 13,
    },

    commentReactions: {
      flexDirection: "row",
      alignItems: "center",

      gap: 14,

      marginTop: 5,
      marginLeft: 8,
    },

    commentReactionButton: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      paddingVertical: 4,
    },

    commentReactionText: {
      color: "#777",

      fontSize: 10,
    },

    commentReactionActive: {
      color: "#A78BFA",

      fontWeight: "bold",
    },

    commentDislikeActive: {
      color: "#F87171",

      fontWeight: "bold",
    },

    commentUserAvatar: {
      width: 36,
      height: 36,

      borderRadius: 11,

      flexShrink: 0,
    },

    commentBody: {
      flex: 1,

      backgroundColor:
        "#202027",

      borderRadius: 14,

      paddingHorizontal: 13,
      paddingVertical: 10,
    },

    commentHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      gap: 10,
    },

    commentAuthor: {
      color: "#FFFFFF",

      fontSize: 12,

      fontWeight: "bold",
    },

    commentTime: {
      color: "#555",

      fontSize: 9,
    },

    commentContent: {
      color: "#D4D4D4",

      fontSize: 13,

      lineHeight: 18,

      marginTop: 4,
    },

    noComments: {
      color: "#666",

      textAlign: "center",

      paddingVertical: 12,

      fontSize: 12,
    },

    empty: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      padding: 35,

      alignItems: "center",

      marginBottom: 15,
    },

    emptyTitle: {
      color: "#FFFFFF",

      fontWeight: "bold",

      marginTop: 10,
    },

    emptyText: {
      color: "#666",

      textAlign: "center",

      marginTop: 5,
    },
  });