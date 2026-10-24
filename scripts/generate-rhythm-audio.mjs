import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

// Generate portable PCM/WAV cues for expo-audio. No recording or external assets.
const output = join(dirname(fileURLToPath(import.meta.url)), "../assets/rhythm");
mkdirSync(output, { recursive: true });
const rate = 24000;

function synthesize(name, frequency, durationMs, volume) {
  const frames = Math.round(rate * durationMs / 1000);
  const wav = Buffer.alloc(44 + frames * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);  // PCM header size
  wav.writeUInt16LE(1, 20);   // PCM
  wav.writeUInt16LE(1, 22);   // mono
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * 2, 40);

  for (let i = 0; i < frames; i++) {
    const t = i / rate;
    const fadeIn = Math.min(1, t / 0.002);
    const decay = Math.exp(-t * (name.includes("click") || name === "accent" ? 65 : 38));
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const overtone = 0.22 * Math.sin(2 * Math.PI * frequency * 2 * t);
    const sample = Math.max(-1, Math.min(1, (fundamental + overtone) * fadeIn * decay * volume));
    wav.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  writeFileSync(join(output, name + ".wav"), wav);
}

synthesize("accent", 1430, 90, 0.42);
synthesize("click", 1020, 90, 0.31);
synthesize("down", 395, 110, 0.34);
synthesize("up", 595, 110, 0.28);
console.log("Generated four PCM/WAV rhythm cues.");
