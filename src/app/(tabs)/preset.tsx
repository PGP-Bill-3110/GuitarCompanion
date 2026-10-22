import { colors } from "../../theme/colors";
import AppGradientBackground from "../../components/ui/AppGradientBackground";
import {
  useEffect,
  useState,
} from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  DEFAULT_PRESET_SETTINGS,
  GuitarPreset,
  PresetSettings,
} from "../../data/presets";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  createCloudPreset,
  findPresetByCode,
  savePresetToLibrary,
  subscribeMyPresets,
} from "../../services/presetService";

type PresetTab =
  | "editor"
  | "library"
  | "import";

const PRESET_TAG_OPTIONS = [
  "Clean",
  "Crunch",
  "Distortion",
  "High Gain",
  "Pop",
  "Rock",
  "Blues",
  "Metal",
  "Jazz",
  "Indie",
  "Ballad",
  "Funk",
  "Warm",
  "Bright",
  "Dreamy",
  "Ambient",
  "Heavy",
  "Vintage",
];

export default function PresetScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] =
    useState<PresetTab>("editor");

  const [settings, setSettings] =
    useState<PresetSettings>({
      ...DEFAULT_PRESET_SETTINGS,
    });

  const [myPresets, setMyPresets] =
    useState<GuitarPreset[]>([]);

  // =============================
  // SAVE FORM
  // =============================

  const [showSaveForm, setShowSaveForm] =
    useState(false);

  const [presetName, setPresetName] =
    useState("");

  const [
    presetDescription,
    setPresetDescription,
  ] = useState("");

  const [coverImage, setCoverImage] =
    useState("");

  const [
    selectedTags,
    setSelectedTags,
  ] = useState<string[]>([]);

  const [isPublic, setIsPublic] =
    useState(true);

  const [lastSaved, setLastSaved] =
    useState<GuitarPreset | null>(
      null
    );

  const [saveMessage, setSaveMessage] =
    useState("");

  const [savingPreset, setSavingPreset] =
    useState(false);

  // =============================
  // IMPORT
  // =============================

  const [importCode, setImportCode] =
    useState("");

  const [
    importResult,
    setImportResult,
  ] =
    useState<GuitarPreset | null>(
      null
    );

  const [importMessage, setImportMessage] =
    useState("");

  // =============================
  // SUBSCRIBE TO PRESETS
  // =============================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setMyPresets([]);
      return;
    }

    return subscribeMyPresets(
      user.uid,
      setMyPresets
    );
  }, [authLoading, user]);

  // =============================
  // SETTINGS
  // =============================

  function updateSetting(
    key: keyof PresetSettings,
    value: number | boolean
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter(
          (item) => item !== tag
        );
      }

      if (current.length >= 5) {
        return current;
      }

      return [...current, tag];
    });
  }

  // =============================
  // SAVE NEW PRESET
  // =============================

  async function savePreset() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (savingPreset) {
      return;
    }

    const cleanName =
      presetName.trim();

    if (!cleanName) {
      setSaveMessage(
        "Vui lòng nhập tên preset."
      );
      return;
    }

    try {
      setSavingPreset(true);
      setSaveMessage("");

      const preset =
        await createCloudPreset(
          user,
          {
            name: cleanName,
            description:
              presetDescription.trim(),
            coverImage:
              coverImage.trim() ||
              undefined,
            tags: selectedTags,
            device: "Demo Device",
            visibility: isPublic
              ? "public"
              : "private",
            settings: {
              ...settings,
            },
          }
        );

      setLastSaved(preset);
      setPresetName("");
      setPresetDescription("");
      setCoverImage("");
      setSelectedTags([]);
      setShowSaveForm(false);
    } catch (error) {
      console.error(
        "Cannot save preset:",
        error
      );
      setSaveMessage(
        "Không thể lưu preset. Vui lòng thử lại."
      );
    } finally {
      setSavingPreset(false);
    }
  }

  // =============================
  // COPY CODE
  // =============================

  async function copyCode(
    code: string
  ) {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard
    ) {
      await navigator.clipboard.writeText(
        code
      );
    }
  }

  // =============================
  // IMPORT
  // =============================

  async function searchPreset() {
    if (!user) {
      router.push("/login");
      return;
    }

    const code = importCode
      .trim()
      .toUpperCase();

    setImportResult(null);
    setImportMessage("");

    if (!code) {
      return;
    }

    try {
      const result =
        await findPresetByCode(code);

      if (!result) {
        setImportMessage(
          "Không tìm thấy preset với mã này."
        );
        return;
      }

      setImportResult(result);
    } catch (error) {
      console.error(
        "Cannot find preset:",
        error
      );
      setImportMessage(
        "Không thể tìm preset. Vui lòng thử lại."
      );
    }
  }

  async function saveImportedPreset() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!importResult) {
      return;
    }

    const alreadySaved =
      myPresets.some(
        (preset) =>
          preset.id ===
          importResult.id
      );

    if (alreadySaved) {
      setImportMessage(
        "Preset này đã có trong My Presets."
      );

      return;
    }

    try {
      await savePresetToLibrary(
        user.uid,
        importResult
      );
      setImportMessage(
        "Đã lưu preset vào My Presets."
      );
    } catch (error) {
      console.error(
        "Cannot save imported preset:",
        error
      );
      setImportMessage(
        "Không thể lưu preset. Vui lòng thử lại."
      );
    }
  }

  return (
    <View style={styles.container}>
      <AppGradientBackground />
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* ====================== */}
        {/* HEADER                 */}
        {/* ====================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Presets
            </Text>

            <Text
              style={styles.subtitle}
            >
              Create • Save • Share
            </Text>
          </View>

          <Ionicons
            name="options"
            size={28}
            color={colors.accent}
          />
        </View>

        {/* ====================== */}
        {/* SUB TABS               */}
        {/* ====================== */}

        <View style={styles.tabs}>
          <PresetTabButton
            icon="options"
            title="Editor"
            active={
              activeTab === "editor"
            }
            onPress={() =>
              setActiveTab("editor")
            }
          />

          <PresetTabButton
            icon="library"
            title="My Presets"
            active={
              activeTab === "library"
            }
            onPress={() =>
              setActiveTab("library")
            }
          />

          <PresetTabButton
            icon="key"
            title="Import"
            active={
              activeTab === "import"
            }
            onPress={() =>
              setActiveTab("import")
            }
          />
        </View>

        {/* ====================== */}
        {/* EDITOR                 */}
        {/* ====================== */}

        {activeTab === "editor" && (
          <>
            <View style={styles.heroCard}>
              <View
                style={
                  styles.heroIcon
                }
              >
                <Ionicons
                  name="musical-notes"
                  size={32}
                  color={colors.accent}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.heroTitle
                  }
                >
                  Custom Tone
                </Text>

                <Text
                  style={
                    styles.heroText
                  }
                >
                  Điều chỉnh tone theo
                  phong cách của bạn.
                </Text>
              </View>

              <View
                style={
                  styles.deviceBadge
                }
              >
                <View
                  style={
                    styles.onlineDot
                  }
                />

                <Text
                  style={
                    styles.deviceText
                  }
                >
                  Demo Device
                </Text>
              </View>
            </View>

            <Text
              style={styles.sectionTitle}
            >
              Amplifier
            </Text>

            <View style={styles.panel}>
              <SettingControl
                label="Gain"
                value={settings.gain}
                onChange={(value) =>
                  updateSetting(
                    "gain",
                    value
                  )
                }
              />

              <SettingControl
                label="Bass"
                value={settings.bass}
                onChange={(value) =>
                  updateSetting(
                    "bass",
                    value
                  )
                }
              />

              <SettingControl
                label="Mid"
                value={settings.mid}
                onChange={(value) =>
                  updateSetting(
                    "mid",
                    value
                  )
                }
              />

              <SettingControl
                label="Treble"
                value={
                  settings.treble
                }
                onChange={(value) =>
                  updateSetting(
                    "treble",
                    value
                  )
                }
              />
            </View>

            <Text
              style={styles.sectionTitle}
            >
              Effects
            </Text>

            <View style={styles.panel}>
              <SettingControl
                label="Reverb"
                value={
                  settings.reverb
                }
                onChange={(value) =>
                  updateSetting(
                    "reverb",
                    value
                  )
                }
              />

              <SettingControl
                label="Delay"
                value={settings.delay}
                onChange={(value) =>
                  updateSetting(
                    "delay",
                    value
                  )
                }
              />

              <SettingControl
                label="Chorus"
                value={
                  settings.chorus
                }
                onChange={(value) =>
                  updateSetting(
                    "chorus",
                    value
                  )
                }
              />

              <View
                style={
                  styles.switchRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.settingLabel
                    }
                  >
                    Drive
                  </Text>

                  <Text
                    style={
                      styles.settingHint
                    }
                  >
                    Overdrive effect
                  </Text>
                </View>

                <Switch
                  value={
                    settings.drive
                  }
                  onValueChange={(
                    value
                  ) =>
                    updateSetting(
                      "drive",
                      value
                    )
                  }
                  trackColor={{
                    false: colors.surfaceMuted,
                    true: colors.action,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() =>
                setShowSaveForm(
                  !showSaveForm
                )
              }
            >
              <Ionicons
                name="save"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save Preset
              </Text>
            </TouchableOpacity>

            {showSaveForm && (
              <SavePresetForm
                presetName={
                  presetName
                }
                setPresetName={
                  setPresetName
                }
                description={
                  presetDescription
                }
                setDescription={
                  setPresetDescription
                }
                coverImage={
                  coverImage
                }
                setCoverImage={
                  setCoverImage
                }
                selectedTags={
                  selectedTags
                }
                onToggleTag={
                  toggleTag
                }
                isPublic={isPublic}
                setIsPublic={
                  setIsPublic
                }
                savingPreset={
                  savingPreset
                }
                onSave={savePreset}
              />
            )}

            {saveMessage !== "" && (
              <Text style={styles.message}>
                {saveMessage}
              </Text>
            )}

            {lastSaved && (
              <View
                style={
                  styles.savedCard
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color="#4ADE80"
                />

                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={
                      styles.savedTitle
                    }
                  >
                    Preset đã được lưu
                  </Text>

                  <Text
                    style={
                      styles.savedCode
                    }
                  >
                    {lastSaved.code}
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.copyButton
                  }
                  onPress={() =>
                    copyCode(
                      lastSaved.code
                    )
                  }
                >
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ====================== */}
        {/* MY PRESETS             */}
        {/* ====================== */}

        {activeTab === "library" && (
          <>
            <View
              style={
                styles.libraryHeader
              }
            >
              <Text
                style={
                  styles.sectionTitleNoMargin
                }
              >
                My Presets
              </Text>

              <Text
                style={styles.count}
              >
                {myPresets.length}
              </Text>
            </View>

            {myPresets.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="library-outline"
                  size={50}
                  color={colors.textDim}
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Chưa có preset
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Tạo preset đầu tiên
                  trong Editor.
                </Text>
              </View>
            ) : (
              myPresets.map(
                (preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onCopy={() =>
                      copyCode(
                        preset.code
                      )
                    }
                    onLoad={() => {
                      setSettings({
                        ...preset.settings,
                      });

                      setActiveTab(
                        "editor"
                      );
                    }}
                  />
                )
              )
            )}
          </>
        )}

        {/* ====================== */}
        {/* IMPORT                 */}
        {/* ====================== */}

        {activeTab === "import" && (
          <>
            <Text
              style={styles.sectionTitle}
            >
              Import Preset
            </Text>

            <View
              style={
                styles.importCard
              }
            >
              <Text
                style={
                  styles.importTitle
                }
              >
                Enter Preset Code
              </Text>

              <Text
                style={
                  styles.importHint
                }
              >
                Ví dụ: GC-7K4P2M
              </Text>

              <View
                style={
                  styles.searchRow
                }
              >
                <TextInput
                  value={importCode}
                  onChangeText={
                    setImportCode
                  }
                  placeholder="GC-XXXXXX"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  style={
                    styles.codeInput
                  }
                />

                <TouchableOpacity
                  style={
                    styles.searchButton
                  }
                  onPress={searchPreset}
                >
                  <Ionicons
                    name="search"
                    size={21}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {importMessage !== "" && (
                <Text
                  style={
                    styles.message
                  }
                >
                  {importMessage}
                </Text>
              )}
            </View>

            {importResult && (
              <ImportPreview
                preset={importResult}
                onSave={
                  saveImportedPreset
                }
              />
            )}

          </>
        )}
      </ScrollView>
    </View>
  );
}

// ======================================================
// TAB
// ======================================================

function PresetTabButton({
  icon,
  title,
  active,
  onPress,
}: {
  icon: any;
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tab,
        active && styles.activeTab,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          active
            ? "#FFFFFF"
            : colors.textMuted
        }
      />

      <Text
        style={[
          styles.tabText,
          active &&
            styles.activeTabText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// SETTING CONTROL
// ======================================================

function SettingControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const decrease = () =>
    onChange(
      Math.max(0, value - 5)
    );

  const increase = () =>
    onChange(
      Math.min(100, value + 5)
    );

  return (
    <View style={styles.setting}>
      <View
        style={
          styles.settingHeader
        }
      >
        <Text
          style={
            styles.settingLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.settingValue
          }
        >
          {value}
        </Text>
      </View>

      <View
        style={styles.settingBody}
      >
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={decrease}
        >
          <Ionicons
            name="remove"
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              {
                width: `${value}%`,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={styles.adjustButton}
          onPress={increase}
        >
          <Ionicons
            name="add"
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ======================================================
// SAVE FORM
// ======================================================

function SavePresetForm({
  presetName,
  setPresetName,

  description,
  setDescription,

  coverImage,
  setCoverImage,

  selectedTags,
  onToggleTag,

  isPublic,
  setIsPublic,

  savingPreset,
  onSave,
}: any) {
  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>
        Save Preset
      </Text>

      <FieldLabel text="Preset name" />

      <TextInput
        value={presetName}
        onChangeText={setPresetName}
        placeholder="Dreamy Clean"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      <FieldLabel text="Description" />

      <TextInput
        value={description}
        onChangeText={
          setDescription
        }
        placeholder="Mô tả tone..."
        placeholderTextColor={colors.textMuted}
        multiline
        style={[
          styles.input,
          styles.textArea,
        ]}
      />

      <FieldLabel text="Cover image" />

      <TextInput
        value={coverImage}
        onChangeText={
          setCoverImage
        }
        placeholder="/presets/covers/dreamy.jpg"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      <FieldLabel text="Tags" />

      <Text style={styles.tagHint}>
        Chọn tối đa 5 tags
      </Text>

      <View style={styles.tagSelector}>
        {PRESET_TAG_OPTIONS.map(
          (tag: string) => {
            const selected =
              selectedTags.includes(tag);

            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagOption,
                  selected &&
                    styles.tagOptionSelected,
                ]}
                onPress={() =>
                  onToggleTag(tag)
                }
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
              >
                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={[
                    styles.tagOptionText,
                    selected &&
                      styles.tagOptionTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      <Text style={styles.tagCount}>
        {selectedTags.length}/5 selected
      </Text>

      <View
        style={
          styles.visibilityRow
        }
      >
        <View>
          <Text
            style={
              styles.settingLabel
            }
          >
            Public preset
          </Text>

          <Text
            style={
              styles.settingHint
            }
          >
            Cho phép chia sẻ bằng mã
          </Text>
        </View>

        <Switch
          value={isPublic}
          onValueChange={
            setIsPublic
          }
          trackColor={{
            false: colors.surfaceMuted,
            true: colors.action,
          }}
        />
      </View>

      <TouchableOpacity
        style={
          styles.confirmButton
        }
        disabled={savingPreset}
        onPress={onSave}
      >
        <Text
          style={
            styles.confirmButtonText
          }
        >
          {savingPreset
            ? "Saving..."
            : "Save & Generate Code"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function FieldLabel({
  text,
}: {
  text: string;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {text}
    </Text>
  );
}

// ======================================================
// PRESET CARD
// ======================================================

function PresetCard({
  preset,
  onCopy,
  onLoad,
}: {
  preset: GuitarPreset;
  onCopy: () => void;
  onLoad: () => void;
}) {
  return (
    <View style={styles.presetCard}>
      {preset.coverImage ? (
        <Image
          source={{
            uri: preset.coverImage,
          }}
          style={styles.cover}
        />
      ) : (
        <View
          style={
            styles.defaultCover
          }
        >
          <Ionicons
            name="musical-notes"
            size={28}
            color={colors.accent}
          />
        </View>
      )}

      <View
        style={styles.presetInfo}
      >
        <Text
          style={
            styles.presetName
          }
        >
          {preset.name}
        </Text>

        <Text
          style={
            styles.creator
          }
        >
          {preset.creator}
        </Text>

        <Text
          style={styles.code}
        >
          {preset.code}
        </Text>

        <View style={styles.tags}>
          {preset.tags
            .slice(0, 3)
            .map((tag) => (
              <View
                key={tag}
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
            ))}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={
            styles.smallAction
          }
          onPress={onCopy}
        >
          <Ionicons
            name="copy-outline"
            size={19}
            color={colors.textSoft}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.loadButton
          }
          onPress={onLoad}
        >
          <Text
            style={
              styles.loadText
            }
          >
            Load
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ======================================================
// IMPORT PREVIEW
// ======================================================

function ImportPreview({
  preset,
  onSave,
}: {
  preset: GuitarPreset;
  onSave: () => void;
}) {
  return (
    <View
      style={
        styles.importPreview
      }
    >
      <View style={styles.previewTop}>
        <View
          style={
            styles.defaultCoverLarge
          }
        >
          <Ionicons
            name="musical-notes"
            size={34}
            color={colors.accent}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={
              styles.previewName
            }
          >
            {preset.name}
          </Text>

          <Text
            style={
              styles.creator
            }
          >
            by {preset.creator}
          </Text>

          <Text
            style={
              styles.previewCode
            }
          >
            {preset.code}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.previewDescription
        }
      >
        {preset.description}
      </Text>

      <View
        style={
          styles.previewSettings
        }
      >
        <MiniSetting
          label="Gain"
          value={
            preset.settings.gain
          }
        />

        <MiniSetting
          label="Bass"
          value={
            preset.settings.bass
          }
        />

        <MiniSetting
          label="Mid"
          value={
            preset.settings.mid
          }
        />

        <MiniSetting
          label="Treble"
          value={
            preset.settings.treble
          }
        />

        <MiniSetting
          label="Reverb"
          value={
            preset.settings.reverb
          }
        />

        <MiniSetting
          label="Delay"
          value={
            preset.settings.delay
          }
        />
      </View>

      <TouchableOpacity
        style={
          styles.confirmButton
        }
        onPress={onSave}
      >
        <Ionicons
          name="download-outline"
          size={19}
          color="#FFFFFF"
        />

        <Text
          style={
            styles.confirmButtonText
          }
        >
          Save to My Presets
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function MiniSetting({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.miniSetting}>
      <Text
        style={
          styles.miniLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.miniValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#355C7D",
  },

  content: {
    width: "100%",

    maxWidth: 1000,

    alignSelf: "center",

    padding: 24,
    paddingTop: 45,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",

    alignItems: "center",
  },

  backButton: {
    width: 46,
    height: 46,

    borderRadius: 14,

    backgroundColor: colors.surface,

    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerText: {
    flex: 1,

    marginLeft: 15,
  },

  title: {
    color: "#FFFFFF",

    fontSize: 30,

    fontWeight: "bold",
  },

  subtitle: {
    color: colors.textMuted,

    marginTop: 3,
  },

  tabs: {
    flexDirection: "row",

    backgroundColor: colors.surface,

    borderRadius: 16,

    padding: 5,

    marginTop: 28,
  },

  tab: {
    flex: 1,

    paddingVertical: 12,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    borderRadius: 12,
  },

  activeTab: {
    backgroundColor: colors.activeSoft,
  },

  tabText: {
    color: colors.textMuted,

    fontWeight: "600",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  heroCard: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.surface,

    borderRadius: 20,

    padding: 20,

    marginTop: 24,

    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  heroIcon: {
    width: 60,
    height: 60,

    borderRadius: 17,

    backgroundColor: colors.accentSoft,

    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    color: "#FFFFFF",

    fontSize: 19,

    fontWeight: "bold",
  },

  heroText: {
    color: colors.textSoft,

    marginTop: 5,
  },

  deviceBadge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,

    backgroundColor: colors.surfaceRaised,

    borderRadius: 10,

    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },

  onlineDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#4ADE80",
  },

  deviceText: {
    color: colors.textSoft,

    fontSize: 11,
  },

  sectionTitle: {
    color: "#FFFFFF",

    fontSize: 20,

    fontWeight: "bold",

    marginTop: 28,
    marginBottom: 14,
  },

  sectionTitleNoMargin: {
    color: "#FFFFFF",

    fontSize: 20,

    fontWeight: "bold",
  },

  panel: {
    backgroundColor: colors.surface,

    borderRadius: 20,

    padding: 18,

    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  setting: {
    gap: 9,
  },

  settingHeader: {
    flexDirection: "row",

    justifyContent: "space-between",
  },

  settingLabel: {
    color: "#FFFFFF",

    fontWeight: "600",
  },

  settingHint: {
    color: colors.textMuted,

    fontSize: 11,

    marginTop: 3,
  },

  settingValue: {
    color: colors.accent,

    fontWeight: "bold",
  },

  settingBody: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  adjustButton: {
    width: 34,
    height: 34,

    borderRadius: 10,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  bar: {
    flex: 1,

    height: 8,

    borderRadius: 5,

    backgroundColor: colors.surfaceMuted,

    overflow: "hidden",
  },

  barFill: {
    height: "100%",

    backgroundColor: colors.action,
  },

  switchRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingTop: 5,
  },

  saveButton: {
    backgroundColor: colors.action,

    borderRadius: 17,

    paddingVertical: 17,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 9,

    marginTop: 25,
  },

  saveButtonText: {
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "bold",
  },

  form: {
    marginTop: 18,

    backgroundColor: colors.surface,

    borderRadius: 20,

    padding: 20,
  },

  formTitle: {
    color: "#FFFFFF",

    fontSize: 20,

    fontWeight: "bold",

    marginBottom: 18,
  },

  fieldLabel: {
    color: colors.textSoft,

    fontSize: 12,

    fontWeight: "600",

    marginBottom: 7,
    marginTop: 13,
  },

  input: {
    backgroundColor: colors.surfaceDeep,

    borderRadius: 12,

    paddingHorizontal: 14,
    paddingVertical: 13,

    color: "#FFFFFF",

    outlineStyle: "none",
    borderWidth: 1,
    borderColor: colors.border,
  } as any,

  tagHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },

  tagSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tagOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },

  tagOptionSelected: {
    backgroundColor: colors.action,
    borderColor: colors.accent,
  },

  tagOptionText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
  },

  tagOptionTextSelected: {
    color: "#FFFFFF",
  },

  tagCount: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 9,
  },

  textArea: {
    minHeight: 85,

    textAlignVertical: "top",
  },

  visibilityRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 18,
  },

  confirmButton: {
    backgroundColor: colors.action,

    borderRadius: 13,

    paddingVertical: 14,

    paddingHorizontal: 18,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    marginTop: 20,
  },

  confirmButtonText: {
    color: "#FFFFFF",

    fontWeight: "bold",
  },

  savedCard: {
    flexDirection: "row",

    alignItems: "center",

    gap: 13,

    marginTop: 18,

    backgroundColor: "#142018",

    borderRadius: 16,

    padding: 16,
  },

  savedTitle: {
    color: "#FFFFFF",

    fontWeight: "bold",
  },

  savedCode: {
    color: "#4ADE80",

    fontSize: 17,

    fontWeight: "bold",

    marginTop: 4,
  },

  copyButton: {
    width: 42,
    height: 42,

    borderRadius: 12,

    backgroundColor: "#26352A",

    alignItems: "center",
    justifyContent: "center",
  },

  libraryHeader: {
    flexDirection: "row",

    alignItems: "center",

    gap: 9,

    marginTop: 28,
    marginBottom: 15,
  },

  count: {
    color: "#FFFFFF",

    backgroundColor: colors.action,

    minWidth: 25,

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 10,

    textAlign: "center",

    fontSize: 11,
  },

  presetCard: {
    backgroundColor: colors.surface,

    borderRadius: 18,

    padding: 15,

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cover: {
    width: 70,
    height: 70,

    borderRadius: 15,
  },

  defaultCover: {
    width: 70,
    height: 70,

    borderRadius: 15,

    backgroundColor: colors.accentSoft,

    alignItems: "center",
    justifyContent: "center",
  },

  presetInfo: {
    flex: 1,

    marginLeft: 14,
  },

  presetName: {
    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "bold",
  },

  creator: {
    color: colors.textMuted,

    fontSize: 12,

    marginTop: 3,
  },

  code: {
    color: colors.accent,

    fontWeight: "bold",

    marginTop: 5,
  },

  tags: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 5,

    marginTop: 7,
  },

  tag: {
    backgroundColor: colors.surfaceMuted,

    borderRadius: 7,

    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  tagText: {
    color: colors.textSoft,

    fontSize: 10,
  },

  cardActions: {
    alignItems: "center",

    gap: 8,
  },

  smallAction: {
    width: 38,
    height: 38,

    borderRadius: 11,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",
    justifyContent: "center",
  },

  loadButton: {
    backgroundColor: colors.action,

    borderRadius: 9,

    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  loadText: {
    color: "#FFFFFF",

    fontSize: 11,

    fontWeight: "bold",
  },

  empty: {
    alignItems: "center",

    marginTop: 80,
  },

  emptyTitle: {
    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "bold",

    marginTop: 13,
  },

  emptyText: {
    color: colors.textMuted,

    marginTop: 5,
  },

  importCard: {
    backgroundColor: colors.surface,

    borderRadius: 20,

    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  importTitle: {
    color: "#FFFFFF",

    fontSize: 18,

    fontWeight: "bold",
  },

  importHint: {
    color: colors.textMuted,

    marginTop: 5,
  },

  searchRow: {
    flexDirection: "row",

    gap: 10,

    marginTop: 18,
  },

  codeInput: {
    flex: 1,

    backgroundColor: colors.surfaceDeep,

    borderRadius: 12,

    paddingHorizontal: 15,

    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "bold",

    letterSpacing: 1,

    outlineStyle: "none",
    borderWidth: 1,
    borderColor: colors.border,
  } as any,

  searchButton: {
    width: 50,
    height: 50,

    borderRadius: 13,

    backgroundColor: colors.action,

    alignItems: "center",
    justifyContent: "center",
  },

  message: {
    color: colors.accent,

    marginTop: 14,
  },

  importPreview: {
    backgroundColor: colors.surface,

    borderRadius: 20,

    padding: 20,

    marginTop: 18,
  },

  previewTop: {
    flexDirection: "row",

    alignItems: "center",

    gap: 14,
  },

  defaultCoverLarge: {
    width: 80,
    height: 80,

    borderRadius: 18,

    backgroundColor: colors.accentSoft,

    alignItems: "center",
    justifyContent: "center",
  },

  previewName: {
    color: "#FFFFFF",

    fontSize: 20,

    fontWeight: "bold",
  },

  previewCode: {
    color: colors.accent,

    fontWeight: "bold",

    marginTop: 5,
  },

  previewDescription: {
    color: colors.textSoft,

    lineHeight: 21,

    marginTop: 18,
  },

  previewSettings: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

    marginTop: 15,
  },

  miniSetting: {
    width: "31%",

    backgroundColor: colors.surfaceDeep,

    borderRadius: 11,

    padding: 11,
  },

  miniLabel: {
    color: colors.textMuted,

    fontSize: 10,
  },

  miniValue: {
    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "bold",

    marginTop: 3,
  },
});