import { TabBeat } from "../data/guitarTabs";

// Bản mobile chưa có tổng hợp âm thanh. Vẫn hiển thị tab và vị trí nốt.
export function canPlayTabAudio(): boolean {
  return false;
}
export function playTabNote(_note: TabBeat, _seconds = 0.55): void {
  // Web uses tabAudio.web.ts with Web Audio API.
}
