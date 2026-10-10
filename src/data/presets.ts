// src/data/presets.ts

export interface PresetSettings {
  gain: number;
  bass: number;
  mid: number;
  treble: number;

  reverb: number;
  delay: number;
  chorus: number;

  drive: boolean;
}

export type PresetVisibility =
  | "public"
  | "private";

export interface GuitarPreset {
  id: string;

  code: string;

  name: string;
  description: string;

  creatorId: string;
  creator: string;

  coverImage?: string;

  tags: string[];

  device: string;

  
    visibility:
    | "public"
    | "private";

  settings: PresetSettings;

  createdAt: number;
}

export const DEFAULT_PRESET_SETTINGS: PresetSettings =
  {
    gain: 35,

    bass: 55,
    mid: 45,
    treble: 65,

    reverb: 40,
    delay: 20,
    chorus: 25,

    drive: false,
  };

// =====================================================
// DEMO PUBLIC PRESETS
// Sau này phần này sẽ được thay bằng Firebase Firestore.
// =====================================================

export const sharedPresetCatalog: GuitarPreset[] =
  [
    {
      id: "shared-dreamy-clean",

      code: "GC-7K4P2M",

      name: "Dreamy Clean",

      description:
        "Clean tone nhẹ, nhiều reverb và chorus. Phù hợp ballad và ambient.",

      creatorId: "demo",

      creator: "@minhguitar",

      tags: [
        "Clean",
        "Ambient",
        "Ballad",
      ],

      device: "Generic",

      visibility: "public",

      settings: {
        gain: 30,

        bass: 55,
        mid: 42,
        treble: 68,

        reverb: 55,
        delay: 25,
        chorus: 35,

        drive: false,
      },

      createdAt: Date.now(),
    },

    {
      id: "shared-rock-stage",

      code: "GC-RK2026",

      name: "Campus Rock",

      description:
        "Tone rock dành cho biểu diễn live, gain vừa phải và mid nổi bật.",

      creatorId: "demo",

      creator: "@10l06band",

      tags: ["Rock", "Live"],

      device: "Generic",

      visibility: "public",

      settings: {
        gain: 68,

        bass: 58,
        mid: 70,
        treble: 62,

        reverb: 22,
        delay: 12,
        chorus: 5,

        drive: true,
      },

      createdAt: Date.now(),
    },

    {
      id: "shared-blues-night",

      code: "GC-BLUES1",

      name: "Late Night Blues",

      description:
        "Tone blues ấm, mid cao, drive nhẹ.",

      creatorId: "demo",

      creator: "@guitarcompanion",

      tags: ["Blues", "Warm"],

      device: "Generic",

      visibility: "public",

      settings: {
        gain: 48,

        bass: 62,
        mid: 72,
        treble: 50,

        reverb: 30,
        delay: 8,
        chorus: 0,

        drive: true,
      },

      createdAt: Date.now(),
    },
  ];

// =====================================================
// GENERATE SHARE CODE
// =====================================================

export function createPresetCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (let i = 0; i < 8; i++) {
    result +=
      characters[
        Math.floor(
          Math.random() *
            characters.length
        )
      ];
  }

  return `GC-${result}`;
}