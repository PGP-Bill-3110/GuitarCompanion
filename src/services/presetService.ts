import type { User } from "firebase/auth";

import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    where,
} from "firebase/firestore";

import { db } from "../config/firebase";

import {
    createPresetCode,
    GuitarPreset,
    PresetSettings,
} from "../data/presets";

// =====================================================
// TYPE
// =====================================================

export interface CreatePresetInput {
  name: string;

  description: string;

  coverImage?: string;

  tags: string[];

  device: string;

  visibility:
    | "public"
    | "private";

  settings: PresetSettings;
}

// =====================================================
// UNIQUE CODE
// =====================================================

async function generateUniqueCode() {return createPresetCode();}

// =====================================================
// CREATE PRESET
// =====================================================

export async function createCloudPreset(
  user: User,
  input: CreatePresetInput
) {
  const presetRef = doc(
    collection(db, "presets")
  );

  const code =
    await generateUniqueCode();

  const creator =
    user.displayName ||
    user.email?.split("@")[0] ||
    "guitarist";

  const preset: GuitarPreset = {
    id: presetRef.id,

    code,

    name: input.name,

    description:
      input.description,

    creatorId: user.uid,

    creator,

    ...(input.coverImage !== undefined
      ? { coverImage: input.coverImage }
      : {}),

    tags: input.tags,

    device: input.device,

    visibility:
      input.visibility,

    settings: {
      ...input.settings,
    },

    createdAt: Date.now(),
  };

  // Lưu preset chính
  await setDoc(
    presetRef,
    preset
  );

  // Đồng thời thêm vào thư viện creator
  await setDoc(
    doc(
      db,
      "users",
      user.uid,
      "savedPresets",
      preset.id
    ),
    {
      presetId: preset.id,

      source: "created",

      savedAt: Date.now(),
    }
  );

  return preset;
}

// =====================================================
// FIND PRESET BY CODE
// =====================================================

export async function findPresetByCode(
  presetCode: string
) {
  const code = presetCode
    .trim()
    .toUpperCase();

  const q = query(
    collection(db, "presets"),

    where(
      "code",
      "==",
      code
    ),

    where(
      "visibility",
      "==",
      "public"
    ),

    limit(1)
  );

  const snapshot =
    await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as GuitarPreset;
}

// =====================================================
// SAVE OTHER USER PRESET
// =====================================================

export async function savePresetToLibrary(
  uid: string,
  preset: GuitarPreset
) {
  await setDoc(
    doc(
      db,
      "users",
      uid,
      "savedPresets",
      preset.id
    ),
    {
      presetId: preset.id,

      source:
        preset.creatorId === uid
          ? "created"
          : "imported",

      savedAt: Date.now(),
    }
  );
}

// =====================================================
// SUBSCRIBE MY PRESETS
// =====================================================

export function subscribeMyPresets(
  uid: string,
  callback: (
    presets: GuitarPreset[]
  ) => void
) {
  const q = query(
    collection(
      db,
      "users",
      uid,
      "savedPresets"
    ),

    orderBy(
      "savedAt",
      "desc"
    )
  );

  return onSnapshot(
    q,

    async (snapshot) => {
      const presets =
        await Promise.all(
          snapshot.docs.map(
            async (
              libraryDocument
            ) => {
              const {
                presetId,
              } =
                libraryDocument.data();

              const presetSnapshot =
                await getDoc(
                  doc(
                    db,
                    "presets",
                    presetId
                  )
                );

              if (
                !presetSnapshot.exists()
              ) {
                return null;
              }

              return presetSnapshot.data() as GuitarPreset;
            }
          )
        );

      callback(
        presets.filter(
          (
            preset
          ): preset is GuitarPreset =>
            preset !== null
        )
      );
    },

    (error) => {
      console.error(
        "Preset subscription error:",
        error
      );

      callback([]);
    }
  );
}

// =====================================================
// REALTIME COUNT
// =====================================================

export function subscribePresetCount(
  uid: string,
  callback: (
    count: number
  ) => void
) {
  return onSnapshot(
    collection(
      db,
      "users",
      uid,
      "savedPresets"
    ),

    (snapshot) => {
      callback(
        snapshot.size
      );
    },

    (error) => {
      console.error(
        "Preset count error:",
        error
      );

      callback(0);
    }
  );
}

// tìm preset theo ID

export async function getPresetById(
  presetId: string
) {
  const snapshot =
    await getDoc(
      doc(
        db,
        "presets",
        presetId
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as GuitarPreset;
}

// xóa preset
 
export async function removePresetFromLibrary(
  uid: string,
  presetId: string
) {
  await deleteDoc(
    doc(
      db,
      "users",
      uid,
      "savedPresets",
      presetId
    )
  );
}

// ======================================
// PUBLIC PRESETS OF ONE USER
// ======================================

export function subscribePublicPresets(
  creatorId: string,
  callback: (
    presets: GuitarPreset[]
  ) => void
) {
  const presetsQuery =
    query(
      collection(
        db,
        "presets"
      ),

      where(
        "creatorId",
        "==",
        creatorId
      ),

      where(
        "visibility",
        "==",
        "public"
      )
    );

  return onSnapshot(
    presetsQuery,

    (snapshot) => {
      const presets =
        snapshot.docs.map(
          (presetDoc) => ({
            ...presetDoc.data(),

            id:
              presetDoc.id,
          })
        ) as GuitarPreset[];

      callback(presets);
    },

    (error) => {
      console.error(
        "Public presets subscription error:",
        error
      );

      callback([]);
    }
  );
}