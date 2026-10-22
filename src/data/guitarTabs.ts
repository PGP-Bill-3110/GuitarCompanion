export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6;

export interface TabBeat {
  string: GuitarString;
  fret: number;
}
export interface GuitarTab {
  id: string;
  title: string;
  subtitle: string;
  composer: string;
  difficulty: "Beginner";
  bpm: number;
  key: string;
  tuning: "E A D G B E";
  timeSignature: "4/4";
  bars: TabBeat[][];
  goals: string[];
  tips: string[];
  license: "GuitarCompanion original";
  sourceFormat: "structured-tab";
}

// Những bài dưới đây được biên soạn mới; không sao chép tab có bản quyền.
export const guitarTabs: GuitarTab[] = [
  {
    id: "open-strings",
    title: "Six Open Strings",
    subtitle: "Làm quen sáu dây buông",
    composer: "GuitarCompanion",
    difficulty: "Beginner", bpm: 65, key: "E minor", tuning: "E A D G B E", timeSignature: "4/4",
    license: "GuitarCompanion original", sourceFormat: "structured-tab",
    bars: [
      [{string:6,fret:0},{string:5,fret:0},{string:4,fret:0},{string:3,fret:0}],
      [{string:2,fret:0},{string:1,fret:0},{string:2,fret:0},{string:3,fret:0}],
      [{string:4,fret:0},{string:5,fret:0},{string:6,fret:0},{string:5,fret:0}],
      [{string:4,fret:0},{string:3,fret:0},{string:2,fret:0},{string:1,fret:0}],
    ],
    goals: ["Nhớ tên sáu dây đàn theo thứ tự E–A–D–G–B–E.", "Gảy đúng từng dây không bấm phím.", "Giữ bốn phách trong mỗi ô nhịp."],
    tips: ["0 là dây buông, không cần bấm phím.", "Dây 1 là E cao (mỏng nhất); dây 6 là E thấp (dày nhất).", "Gảy chậm và giữ tiếng từng nốt rõ ràng."],
  },
  {
    id: "high-e-melody",
    title: "First Melody on E",
    subtitle: "Giai điệu nguyên bản trên dây 1",
    composer: "GuitarCompanion",
    difficulty: "Beginner", bpm: 72, key: "E minor", tuning: "E A D G B E", timeSignature: "4/4",
    license: "GuitarCompanion original", sourceFormat: "structured-tab",
    bars: [
      [{string:1,fret:0},{string:1,fret:1},{string:1,fret:3},{string:1,fret:1}],
      [{string:1,fret:0},{string:1,fret:3},{string:1,fret:1},{string:1,fret:0}],
      [{string:1,fret:3},{string:1,fret:3},{string:1,fret:1},{string:1,fret:0}],
      [{string:1,fret:1},{string:1,fret:3},{string:1,fret:1},{string:1,fret:0}],
    ],
    goals: ["Bấm phím 1 bằng ngón trỏ và phím 3 bằng ngón áp út.", "Chuyển các ngăn 0–1–3 không gồng tay.", "Giữ tốc độ đều khi lặp giai điệu."],
    tips: ["Mỗi số tương ứng với ngăn đàn trên dây 1.", "Đầu ngón tay đặt ngay phía sau thanh phím.", "Nếu nốt bị rè, hãy giảm tốc độ trước."],
  },
  {
    id: "two-string-walk",
    title: "Two-String Walk",
    subtitle: "Luyện đổi dây 1 và dây 2",
    composer: "GuitarCompanion",
    difficulty: "Beginner", bpm: 76, key: "C major", tuning: "E A D G B E", timeSignature: "4/4",
    license: "GuitarCompanion original", sourceFormat: "structured-tab",
    bars: [
      [{string:2,fret:1},{string:2,fret:3},{string:1,fret:0},{string:1,fret:1}],
      [{string:1,fret:3},{string:1,fret:1},{string:1,fret:0},{string:2,fret:3}],
      [{string:2,fret:1},{string:1,fret:0},{string:2,fret:3},{string:1,fret:1}],
      [{string:1,fret:0},{string:2,fret:3},{string:2,fret:1},{string:2,fret:1}],
    ],
    goals: ["Chuyển chính xác giữa hai dây mỏng nhất.", "Nhớ vị trí phím 1 và 3 trên dây 2.", "Giữ nhịp ổn định trong 4 ô nhịp."],
    tips: ["B là dây 2, e là dây 1.", "Chỉ một dây được gảy trên mỗi phách của bài này.", "Có thể giảm BPM xuống 50 nếu đổi dây chưa kịp."],
  },
  {
    id: "c-arpeggio",
    title: "C Major Arpeggio",
    subtitle: "Rải hợp âm C trưởng đơn giản",
    composer: "GuitarCompanion",
    difficulty: "Beginner", bpm: 66, key: "C major", tuning: "E A D G B E", timeSignature: "4/4",
    license: "GuitarCompanion original", sourceFormat: "structured-tab",
    bars: [
      [{string:5,fret:3},{string:4,fret:2},{string:3,fret:0},{string:2,fret:1}],
      [{string:1,fret:0},{string:2,fret:1},{string:3,fret:0},{string:4,fret:2}],
      [{string:5,fret:3},{string:3,fret:0},{string:2,fret:1},{string:1,fret:0}],
      [{string:2,fret:1},{string:3,fret:0},{string:4,fret:2},{string:5,fret:3}],
    ],
    goals: ["Giữ thế bấm C trưởng ổn định.", "Gảy từng nốt của hợp âm, không quạt tất cả dây.", "Phân biệt dây trầm và dây cao trong mẫu rải."],
    tips: ["C trưởng mở thường dùng dây 5 ngăn 3, dây 4 ngăn 2 và dây 2 ngăn 1.", "Đừng gảy dây 6 trong bài tập này.", "Thử dùng ngón cái cho dây 5/4, các ngón khác cho dây cao."],
  },
];

export function getGuitarTab(id: string) {
  return guitarTabs.find((tab) => tab.id === id);
}

export function flattenTab(tab: GuitarTab): TabBeat[] {
  return tab.bars.flat();
}

// Chuẩn bị dữ liệu đầu vào alphaTex cho tích hợp alphaTab sau này.
// Cú pháp nốt có phím của alphaTex là "fret.string".
export function toAlphaTex(tab: GuitarTab): string {
  const clean = (text: string) => text.replace(/"/g, "'");
  const bars = tab.bars.map((bar) => bar.map((beat) => beat.fret + "." + beat.string).join(" ")).join(" | ");
  return "\\title \"" + clean(tab.title) + "\" \\artist \"" + clean(tab.composer) +
    "\" \\tempo " + tab.bpm + " . :4 " + bars;
}
