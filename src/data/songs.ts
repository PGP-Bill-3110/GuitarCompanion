// src/data/songs.ts

export type SongType = "chord" | "score";

export type Difficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Unrated";

export interface Song {
  id: string;

  title: string;
  artist: string;

  type: SongType;

  analysisExerciseId?: string;

  key?: string;
  bpm?: number;
  capo?: number;

  difficulty: Difficulty;

  // Dùng cho bài chord dạng TXT
  textUrl?: string;

  // Vẫn hỗ trợ text hardcode nếu cần
  content?: string;

  // Dùng cho sheet / tablature dạng PDF
  pdfUrl?: string;

  description?: string;
}

// =====================================================
// SONG DATABASE TẠM THỜI
// =====================================================
//
// Hiện tại dữ liệu vẫn nằm local.
//
// Chord:
// public/chords/*.txt
//
// PDF:
// public/scores/*.pdf
//
// Sau này có thể thay bằng Firebase / backend mà UI
// gần như không cần thay đổi.
// =====================================================

export const songs: Song[] = [
  // ===================================================
  // CHORD / LYRICS
  // ===================================================

  {
    id: "phep-mau-chord",

    title: "Phép Màu",
    artist: "Chưa cập nhật",

    type: "chord",

    key: "G",

    difficulty: "Unrated",

    textUrl: "/chords/phep_mau.txt",

    description: "Hợp âm và lời bài hát",
  },

  {
    id: "dai-lo-mat-troi",

    title: "Đại Lộ Mặt Trời",
    artist: "Chưa cập nhật",

    type: "chord",

    capo: 4,

    difficulty: "Unrated",

    textUrl: "/chords/dai_lo_mat_troi.txt",

    description: "Hợp âm và lời bài hát",
  },

  {
    id: "bau-troi-moi",

    title: "Bầu Trời Mới",
    artist: "Chưa cập nhật",

    type: "chord",

    key: "C",
    capo: 3,

    difficulty: "Unrated",

    textUrl: "/chords/bau_troi_moi.txt",

    description: "Hợp âm và lời bài hát",
  },

  {
    id: "the-gioi-cua-anh",

    title: "Thế Giới Của Anh",
    artist: "Chưa cập nhật",

    type: "chord",

    difficulty: "Unrated",

    textUrl: "/chords/the_gioi_cua_anh.txt",

    description: "Hợp âm và lời bài hát",
  },

  {
    id: "yeu-em-dai-lau",

    title: "Yêu Em Dài Lâu",
    artist: "Chưa cập nhật",

    type: "chord",

    difficulty: "Unrated",

    textUrl: "/chords/yeu_em_dai_lau.txt",

    description: "Hợp âm và lời bài hát",
  },

  // ===================================================
  // SCORE / TAB PDF
  // ===================================================

  {
    id: "dieu-vo-tri-nhat",

    title: "Điều Vô Tri Nhất",
    artist: "Chưa cập nhật",

    type: "score",


    analysisExerciseId:
    "c-major-scale",

    difficulty: "Unrated",

    pdfUrl: "/scores/dieu-vo-tri-nhat.pdf",

    description: "Guitar score / tablature",
  },

  {
    id: "du-cho-tan-the",

    title: "Dù Cho Tận Thế",
    artist: "Chưa cập nhật",

    type: "score",

    difficulty: "Unrated",

    pdfUrl: "/scores/du-cho-tan-the.pdf",

    description: "Guitar score / tablature",
  },

  {
    id: "phep-mau-score",

    title: "Phép Màu",
    artist: "Chưa cập nhật",

    type: "score",

    difficulty: "Unrated",

    pdfUrl: "/scores/phep-mau.pdf",

    description: "Guitar score / tablature",
  },

  {
    id: "phonecert",

    title: "Phonecert",
    artist: "Chưa cập nhật",

    type: "score",

    difficulty: "Unrated",

    pdfUrl: "/scores/phonecert.pdf",

    description: "Guitar score / tablature",
  },

  {
    id: "river-flows-in-you",

    title: "River Flows in You",
    artist: "Chưa cập nhật",

    type: "score",

    difficulty: "Unrated",

    pdfUrl: "/scores/river-flows-in-you.pdf",

    description: "Guitar score / tablature",
  },

  {
    id: "thang-tu-la-loi-noi-doi-cua-em",

    title: "Tháng Tư Là Lời Nói Dối Của Em",
    artist: "Chưa cập nhật",

    type: "score",

    difficulty: "Unrated",

    pdfUrl:
      "/scores/thang-tu-la-loi-noi-doi-cua-em.pdf",

    description: "Guitar score / tablature",
  },

  {
    id: "thap-roi-tu-do",

    title: "Tháp Rơi Tự Do",
    artist: "Chưa cập nhật",

    type: "score",

    difficulty: "Unrated",

    pdfUrl: "/scores/thap-roi-tu-do.pdf",

    description: "Guitar score / tablature",
  },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getSongById(id: string) {
  return songs.find((song) => song.id === id);
}

export function getChordSongs() {
  return songs.filter((song) => song.type === "chord");
}

export function getScoreSongs() {
  return songs.filter((song) => song.type === "score");
}