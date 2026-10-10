// src/data/communityPosts.ts

export type CommunityPostType =
  | "event"
  | "service"
  | "course"
  | "review"
  | "tips"
  | "recruitment";

export type CommunityMediaType =
  | "image"
  | "video"
  | "none";

export interface CommunityPost {
  id: string;

  author: string;
  username: string;

  avatar: string;

  sponsored: boolean;
  time: string;

  content: string;

  category: CommunityPostType;

  mediaType: CommunityMediaType;

  // Ảnh bài đăng hoặc thumbnail video
  mediaUrl?: string;

  // Chỉ dùng nếu mediaType === "video"
  videoUrl?: string;

  likes: number;
  comments: number;

  cta?: {
    label: string;
  };
}

export const communityPosts: CommunityPost[] = [
  // ====================================================
  // SPONSORED POSTS
  // ====================================================

  {
    id: "10l06-show",

    author: "10L06 Band",
    username: "@10l06band",

    avatar: "/community/avatar/10L06.jpg",

    sponsored: true,

    time: "Hôm nay",

    content:
      "🎸 Ban nhạc 10L06 sẽ có buổi biểu diễn tại phòng H1-0405. Hẹn gặp mọi người tại buổi diễn!",

    category: "event",

    mediaType: "image",

    mediaUrl:
      "/community/post/10l06-show/poster.jpg",

    likes: 124,
    comments: 18,

    cta: {
      label: "Xem sự kiện",
    },
  },

  {
    id: "guitar-rental",

    author: "Thủ Đức Guitar Rental",
    username: "@guitarrenttd",

    avatar:
      "/community/avatar/guitar-rent.jpg",

    sponsored: true,

    time: "1 giờ trước",

    content:
      "🎸 Dịch vụ cho thuê đàn tại Thủ Đức. Có nhiều lựa chọn dành cho sinh viên luyện tập, biểu diễn hoặc cần đàn trong thời gian ngắn.",

    category: "service",

    mediaType: "image",

    mediaUrl:
      "/community/post/guitar-rental/banner.jpg",

    likes: 86,
    comments: 21,

    cta: {
      label: "Liên hệ thuê đàn",
    },
  },

  {
    id: "guitar-class",

    author: "University Guitar Class",
    username: "@uniguitarclass",

    avatar:
      "/community/avatar/guitar-class.jpg",

    sponsored: true,

    time: "3 giờ trước",

    content:
      "⚡ Chiêu sinh lớp guitar điện dành cho sinh viên Làng Đại học. Giảm giá 30% học phí và hỗ trợ thuê đàn miễn phí trong thời gian học.",

    category: "course",

    mediaType: "image",

    mediaUrl:
      "/community/post/guitar-class/class.jpg",

    likes: 173,
    comments: 35,

    cta: {
      label: "Đăng ký ngay",
    },
  },

  // ====================================================
  // FREE COMMUNITY POSTS
  // ====================================================

  {
    id: "enya-review",

    author: "Enya Guitar Review",
    username: "@enyareview",

    avatar:
      "/community/avatar/enya-review.jpg",

    sponsored: false,

    time: "2 giờ trước",

    content:
      "🎸 Review Enya Inspire: thiết kế, trải nghiệm chơi, hiệu ứng tích hợp và những điểm đáng chú ý sau khi sử dụng.",

    category: "review",

    mediaType: "video",

    mediaUrl:
      "/community/post/enya-review/enya-review-thumbnail.jpg",

    videoUrl:
      "/community/post/enya-review/video.mp4",

    likes: 231,
    comments: 42,
  },

  {
    id: "beginner-guitar",

    author: "Guitar Beginner VN",
    username: "@guitarbeginner",

    avatar:
      "/community/avatar/beginner.jpg",

    sponsored: false,

    time: "4 giờ trước",

    content:
      "🎸 Nên chọn loại đàn nào cho người mới? Classic, acoustic hay guitar điện? Cùng xem những điểm cần cân nhắc trước khi mua cây đàn đầu tiên.",

    category: "tips",

    mediaType: "video",

    mediaUrl:
      "/community/post/beginner-guitar/beginner-thumbnail.jpg",

    videoUrl:
      "/community/post/beginner-guitar/video.mp4",

    likes: 154,
    comments: 29,
  },

  {
    id: "chord-tips",

    author: "Guitar Tips",
    username: "@guitartips",

    avatar:
      "/community/avatar/tips.jpg",

    sponsored: false,

    time: "5 giờ trước",

    content:
      "🎵 Tập ngay vòng hợp âm G → D → Em → C. Chỉ với vòng hợp âm này, bạn đã có thể luyện cách chuyển hợp âm cho rất nhiều bài hát phổ biến.",

    category: "tips",

    mediaType: "image",

    mediaUrl:
      "/community/post/chord-tips/tips.jpg",

    likes: 315,
    comments: 51,
  },

  {
    id: "find-drummer",

    author: "10L06 Band",
    username: "@10l06band",

    avatar:
      "/community/avatar/find-drummer.jpg",

    sponsored: false,

    time: "6 giờ trước",

    content:
      "🥁 Ban nhạc 10L06 đang tìm drummer cho buổi diễn ngày 5/10. Nếu bạn chơi drum và muốn tham gia cùng band, hãy để lại bình luận hoặc liên hệ với nhóm.",

    category: "recruitment",

    mediaType: "image",

    mediaUrl:
      "/community/post/find-drummer/find-drummer.jpg",

    likes: 97,
    comments: 36,
  },
];