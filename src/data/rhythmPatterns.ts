export type StrumDirection = "D" | "U";
export type RhythmMeter = 2 | 3 | 4;
export interface RhythmPattern {
  id: string;
  name: string;
  meter: RhythmMeter;
  difficulty: "Dễ" | "Vừa";
  description: string;
  /** Eighth-note slots, from 1, &, 2, &, ...; null means do not strum. */
  steps: (StrumDirection | null)[];
  hint: string;
}
export const rhythmPatterns: RhythmPattern[] = [
  {
    id: "two-down", name: "Hai phách cơ bản", meter: 2, difficulty: "Dễ",
    description: "Gảy xuống ở mỗi phách trong nhịp 2/4.",
    steps: ["D", null, "D", null], hint: "Đếm 1 – 2 –. Đánh xuống đúng hai phách."
  },
  {
    id: "two-eighths", name: "Xuống – lên", meter: 2, difficulty: "Dễ",
    description: "Tập tay xuống/lên đều trên các nốt móc đơn.",
    steps: ["D", "U", "D", "U"], hint: "Đếm 1 & 2 &; xuống ở số, lên ở dấu &."
  },
  {
    id: "three-waltz", name: "Waltz 3/4", meter: 3, difficulty: "Dễ",
    description: "Ba nhịp đều, nhấn mạnh phách thứ nhất.",
    steps: ["D", null, "D", null, "D", null],
    hint: "Đếm 1 – 2 – 3 – và nhấn nhẹ phách số 1."
  },
  {
    id: "three-flow", name: "3/4 xuống – lên", meter: 3, difficulty: "Vừa",
    description: "Giữ tay chuyển động đều trong nhịp 3/4.",
    steps: ["D", null, "D", "U", "D", "U"],
    hint: "Đếm 1 & 2 & 3 &; chỉ gảy ở ô có mũi tên."
  },
  {
    id: "four-down", name: "Bốn phách xuống", meter: 4, difficulty: "Dễ",
    description: "Gảy xuống ở mỗi phách, phù hợp bài học đếm nhịp 4/4.",
    steps: ["D", null, "D", null, "D", null, "D", null],
    hint: "Đếm 1 2 3 4; bắt đầu ở 60 BPM."
  },
  {
    id: "four-eighths", name: "Tám móc đơn", meter: 4, difficulty: "Dễ",
    description: "Mỗi phách gồm một lần xuống và một lần lên.",
    steps: ["D", "U", "D", "U", "D", "U", "D", "U"],
    hint: "Đếm 1 & 2 & 3 & 4 &; giữ khoảng cách đều."
  },
  {
    id: "four-pop", name: "Pop strumming D–DU–UDU", meter: 4, difficulty: "Vừa",
    description: "Mẫu gảy phổ biến có những khoảng nghỉ quan trọng.",
    steps: ["D", null, "D", "U", null, "U", "D", "U"],
    hint: "Đếm 1 & 2 & 3 & 4 &. Tay vẫn chuyển động qua chỗ nghỉ."
  }
];
export function patternsForMeter(meter: RhythmMeter) {
  return rhythmPatterns.filter(p => p.meter === meter);
}
export const beginnerRhythmLessons: Record<string,string> = {
  "count-four":"four-down",
  "eighth-notes":"four-eighths",
  "strumming-pattern":"four-pop",
  "smooth-transitions":"four-down",
  "song-progression":"four-pop",
  "first-performance":"four-pop"
};
