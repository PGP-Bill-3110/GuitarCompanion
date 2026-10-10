import React, { useState } from "react";

import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import CloudCommunityFeed from "../../components/community/CloudCommunityFeed";

import {
  CommunityPost,
  communityPosts,
} from "../../data/communityPosts";

import NotificationBell
  from "../../components/notifications/NotificationBell";

type FeedTab =
  | "discover"
  | "following";

export default function CommunityScreen() {
  const [activeTab, setActiveTab] =
    useState<FeedTab>("discover");

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* =========================================== */}
        {/* HEADER                                      */}
        {/* =========================================== */}

        <View style={styles.communityHeader}>
          <View style={styles.communityTitleArea}>
            <Text style={styles.communityTitle}>
              Community
            </Text>

            <Text style={styles.communitySubtitle}>
              Play • Share • Connect
            </Text>
          </View>

          <View style={styles.headerActions}>
            <NotificationBell />

            <TouchableOpacity
              style={styles.createPostIconButton}
              onPress={() =>
                router.push(
                  "/create-post" as any
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="add"
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================== */}
        {/* FEED TABS                                   */}
        {/* =========================================== */}

        <View style={styles.feedTabs}>
          <FeedTabButton
            title="Discover"
            active={
              activeTab === "discover"
            }
            onPress={() =>
              setActiveTab("discover")
            }
          />

          <FeedTabButton
            title="Following"
            active={
              activeTab === "following"
            }
            onPress={() =>
              setActiveTab("following")
            }
          />
        </View>

        {/* =========================================== */}
        {/* FEED                                        */}
        {/* =========================================== */}

        {activeTab === "discover" && (
          <>
            <View style={styles.cloudFeed}>
              <CloudCommunityFeed mode="discover" />
            </View>

            <View style={styles.feed}>
              {communityPosts
                .filter(
                  (post) =>
                    post.sponsored
                )
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))}
            </View>
          </>
        )}

        {activeTab === "following" && (
          <View style={styles.cloudFeed}>
            <CloudCommunityFeed mode="following" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// =====================================================
// FEED TAB BUTTON
// =====================================================

function FeedTabButton({
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
        styles.feedTabButton,
        active &&
          styles.feedTabButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.feedTabText,
          active &&
            styles.feedTabTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// =====================================================
// POST CARD
// =====================================================

function PostCard({
  post,
}: {
  post: CommunityPost;
}) {
  const [liked, setLiked] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [playing, setPlaying] =
    useState(false);

  const likes =
    post.likes + (liked ? 1 : 0);

  return (
    <View style={styles.postCard}>
      {/* ============================================= */}
      {/* AUTHOR                                        */}
      {/* ============================================= */}

      <View style={styles.authorRow}>
        <Image
          source={{
            uri: post.avatar,
          }}
          style={styles.avatar}
        />

        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {post.author}
          </Text>

          {post.sponsored ? (
            <View
              style={
                styles.sponsoredLine
              }
            >
              <Text
                style={
                  styles.sponsoredText
                }
              >
                Tài trợ quảng cáo
              </Text>

              <Text
                style={
                  styles.sponsoredDot
                }
              >
                •
              </Text>

              <Ionicons
                name="earth"
                size={12}
                color="#777"
              />
            </View>
          ) : (
            <Text style={styles.postTime}>
              {post.time} •{" "}
              {post.username}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.moreButton}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      {/* ============================================= */}
      {/* POST CONTENT                                  */}
      {/* ============================================= */}

      <Text style={styles.postContent}>
        {post.content}
      </Text>

      {/* ============================================= */}
      {/* MEDIA                                         */}
      {/* ============================================= */}

      {post.mediaType !== "none" &&
        post.mediaUrl && (
          <View style={styles.mediaArea}>
            {post.mediaType ===
              "image" && (
              <Image
                source={{
                  uri: post.mediaUrl,
                }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            {post.mediaType ===
              "video" && (
              <>
                {playing &&
                post.videoUrl &&
                Platform.OS ===
                  "web" ? (
                  <WebVideo
                    videoUrl={
                      post.videoUrl
                    }
                    poster={
                      post.mediaUrl
                    }
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={
                      styles.videoThumbnail
                    }
                    onPress={() =>
                      setPlaying(true)
                    }
                  >
                    <Image
                      source={{
                        uri: post.mediaUrl,
                      }}
                      style={
                        styles.postImage
                      }
                      resizeMode="cover"
                    />

                    <View
                      style={
                        styles.videoOverlay
                      }
                    >
                      <View
                        style={
                          styles.playButton
                        }
                      >
                        <Ionicons
                          name="play"
                          size={30}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

      {/* ============================================= */}
      {/* SPONSORED CTA                                 */}
      {/* ============================================= */}

      {post.sponsored &&
        post.cta && (
          <View style={styles.adFooter}>
            <View style={styles.adInfo}>
              <Text style={styles.adLabel}>
                Guitar Companion
              </Text>

              <Text
                style={
                  styles.adDescription
                }
              >
                Nội dung được tài trợ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>
                {post.cta.label}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* ============================================= */}
      {/* COUNTERS                                      */}
      {/* ============================================= */}

      <View style={styles.counterRow}>
        <View style={styles.likeCounter}>
          <View
            style={
              styles.smallLikeCircle
            }
          >
            <Ionicons
              name="thumbs-up"
              size={11}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={styles.counterText}
          >
            {likes}
          </Text>
        </View>

        <Text style={styles.counterText}>
          {post.comments} bình luận
        </Text>
      </View>

      {/* ============================================= */}
      {/* ACTIONS                                       */}
      {/* ============================================= */}

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            setLiked(!liked)
          }
        >
          <Ionicons
            name={
              liked
                ? "thumbs-up"
                : "thumbs-up-outline"
            }
            size={21}
            color={
              liked
                ? "#A78BFA"
                : "#AAAAAA"
            }
          />

          <Text
            style={[
              styles.actionText,
              liked &&
                styles.actionTextActive,
            ]}
          >
            Thích
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color="#AAAAAA"
          />

          <Text style={styles.actionText}>
            Bình luận
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
        >
          <Ionicons
            name="share-social-outline"
            size={21}
            color="#AAAAAA"
          />

          <Text style={styles.actionText}>
            Chia sẻ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() =>
            setSaved(!saved)
          }
        >
          <Ionicons
            name={
              saved
                ? "bookmark"
                : "bookmark-outline"
            }
            size={21}
            color={
              saved
                ? "#A78BFA"
                : "#AAAAAA"
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =====================================================
// WEB VIDEO
// =====================================================

function WebVideo({
  videoUrl,
  poster,
}: {
  videoUrl: string;
  poster: string;
}) {
  return React.createElement(
    "video",
    {
      src: videoUrl,

      poster,

      controls: true,
      autoPlay: true,

      style: {
        width: "100%",
        maxHeight: "560px",

        display: "block",

        backgroundColor: "#000000",
      },
    }
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#0B0B0F",
  },

  content: {
    paddingTop: 45,
    paddingBottom: 40,

    width: "100%",
    maxWidth: 800,

    alignSelf: "center",
  },

  // =====================================
  // HEADER
  // =====================================

  communityHeader: {
    paddingHorizontal: 22,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 26,
  },

  communityTitleArea: {
    flex: 1,
  },

  communityTitle: {
    color: "#FFFFFF",

    fontSize: 30,

    fontWeight: "bold",
  },

  communitySubtitle: {
    color: "#777",

    fontSize: 13,

    marginTop: 4,
  },

  headerActions: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  createPostIconButton: {
    width: 50,
    height: 50,

    borderRadius: 16,

    backgroundColor: "#7C3AED",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // =====================================
  // FEED TABS
  // =====================================

  feedTabs: {
    flexDirection: "row",

    marginBottom: 22,

    marginHorizontal: 22,

    backgroundColor: "#17171D",

    padding: 5,

    borderRadius: 15,
  },

  feedTabButton: {
    flex: 1,

    paddingVertical: 10,

    alignItems: "center",

    borderRadius: 11,
  },

  feedTabButtonActive: {
    backgroundColor: "#7C3AED",
  },

  feedTabText: {
    color: "#777",

    fontWeight: "600",

    fontSize: 13,
  },

  feedTabTextActive: {
    color: "#FFFFFF",
  },

  // =====================================
  // FEED
  // =====================================

  feed: {
    gap: 18,

    paddingHorizontal: 22,
  },

  cloudFeed: {
    paddingHorizontal: 22,
  },

  emptyState: {
    backgroundColor: "#17171D",

    borderRadius: 18,

    padding: 35,

    marginHorizontal: 22,

    alignItems: "center",
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

  postCard: {
    backgroundColor: "#17171D",

    borderRadius: 20,

    overflow: "hidden",
  },

  // =====================================
  // AUTHOR
  // =====================================

  authorRow: {
    flexDirection: "row",

    alignItems: "center",

    padding: 17,
  },

  avatar: {
    width: 48,
    height: 48,

    borderRadius: 24,

    backgroundColor: "#292930",
  },

  authorInfo: {
    flex: 1,

    marginLeft: 12,
  },

  authorName: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "bold",
  },

  postTime: {
    color: "#777",

    fontSize: 12,

    marginTop: 4,
  },

  sponsoredLine: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    marginTop: 4,
  },

  sponsoredText: {
    color: "#999",

    fontSize: 12,

    fontWeight: "500",
  },

  sponsoredDot: {
    color: "#777",

    fontSize: 12,
  },

  moreButton: {
    padding: 8,
  },

  // =====================================
  // CONTENT
  // =====================================

  postContent: {
    color: "#E5E5E5",

    fontSize: 15,

    lineHeight: 23,

    paddingHorizontal: 17,
    paddingBottom: 16,
  },

  // =====================================
  // MEDIA
  // =====================================

  mediaArea: {
    width: "100%",

    backgroundColor: "#090909",
  },

  postImage: {
    width: "100%",

    aspectRatio: 16 / 9,

    backgroundColor: "#101015",
  },

  videoThumbnail: {
    width: "100%",

    position: "relative",
  },

  videoOverlay: {
    ...StyleSheet.absoluteFill,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(0,0,0,0.20)",
  },

  playButton: {
    width: 66,
    height: 66,

    borderRadius: 35,

    backgroundColor:
      "rgba(124,58,237,0.92)",

    alignItems: "center",
    justifyContent: "center",

    paddingLeft: 4,
  },

  // =====================================
  // AD CTA
  // =====================================

  adFooter: {
    backgroundColor: "#202027",

    paddingHorizontal: 17,
    paddingVertical: 13,

    flexDirection: "row",

    alignItems: "center",
  },

  adInfo: {
    flex: 1,
  },

  adLabel: {
    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "600",
  },

  adDescription: {
    color: "#777",

    fontSize: 11,

    marginTop: 3,
  },

  ctaButton: {
    backgroundColor: "#7C3AED",

    paddingHorizontal: 17,
    paddingVertical: 10,

    borderRadius: 10,
  },

  ctaText: {
    color: "#FFFFFF",

    fontWeight: "bold",

    fontSize: 12,
  },

  // =====================================
  // COUNTERS
  // =====================================

  counterRow: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 17,
    paddingTop: 13,
    paddingBottom: 10,
  },

  likeCounter: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  smallLikeCircle: {
    width: 19,
    height: 19,

    borderRadius: 10,

    backgroundColor: "#7C3AED",

    alignItems: "center",
    justifyContent: "center",
  },

  counterText: {
    color: "#777",

    fontSize: 12,
  },

  divider: {
    height: 1,

    backgroundColor: "#2A2A31",

    marginHorizontal: 17,
  },

  // =====================================
  // ACTIONS
  // =====================================

  actions: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  actionButton: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  actionText: {
    color: "#AAAAAA",

    fontSize: 12,

    fontWeight: "500",
  },

  actionTextActive: {
    color: "#A78BFA",
  },

  saveButton: {
    marginLeft: "auto",

    padding: 10,
  },
});