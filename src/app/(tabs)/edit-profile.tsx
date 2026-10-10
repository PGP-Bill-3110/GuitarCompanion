import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  PublicProfile,
  subscribePublicProfile,
  updateGuitarIdentity,
} from "../../services/profileService";

const LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
];

const GENRES = [
  "Pop",
  "Rock",
  "Blues",
  "Metal",
  "Jazz",
  "Indie",
  "Ballad",
  "Funk",
  "Acoustic",
  "Classical",
];

export default function EditProfileScreen() {
  const {
    user,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] =
    useState<
      PublicProfile | null
    >(null);

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    bio,
    setBio,
  ] = useState("");

  const [
    level,
    setLevel,
  ] =
    useState(
      "beginner"
    );

  const [
    selectedGenres,
    setSelectedGenres,
  ] =
    useState<string[]>(
      []
    );

  const [
    gearText,
    setGearText,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  // ====================================
  // LOAD PROFILE
  // ====================================

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribePublicProfile(
      user.uid,
      setProfile
    );
  }, [user?.uid]);

  // ====================================
  // COPY PROFILE → FORM
  // ====================================

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDisplayName(
      profile.displayName || ""
    );

    setUsername(
      profile.username || ""
    );

    setBio(
      profile.bio || ""
    );

    setLevel(
      profile.level ||
        "beginner"
    );

    setSelectedGenres(
      profile.favoriteGenres ||
        []
    );

    setGearText(
      (profile.gear || [])
        .join("\n")
    );
  }, [profile?.uid]);

  const cleanUsername =
    useMemo(
      () =>
        username
          .trim()
          .toLowerCase()
          .replace(
            /[^a-z0-9._]/g,
            ""
          ),
      [username]
    );

  function toggleGenre(
    genre: string
  ) {
    setSelectedGenres(
      (current) => {
        if (
          current.includes(
            genre
          )
        ) {
          return current.filter(
            (item) =>
              item !== genre
          );
        }

        if (
          current.length >=
          5
        ) {
          return current;
        }

        return [
          ...current,
          genre,
        ];
      }
    );
  }

  async function handleSave() {
    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (
      !displayName.trim()
    ) {
      setMessage(
        "Display name không được để trống."
      );

      return;
    }

    if (
      cleanUsername.length <
      3
    ) {
      setMessage(
        "Username cần ít nhất 3 ký tự."
      );

      return;
    }

    if (
      bio.length > 160
    ) {
      setMessage(
        "Bio tối đa 160 ký tự."
      );

      return;
    }

    const gear =
      gearText
        .split("\n")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
        .slice(0, 10);

    try {
      setSaving(true);
      setMessage("");

      await updateGuitarIdentity(
        user.uid,
        {
          displayName:
            displayName.trim(),

          username:
            cleanUsername,

          bio:
            bio.trim(),

          level,

          favoriteGenres:
            selectedGenres,

          gear,
        }
      );

      router.back();
    } catch (error) {
      console.error(
        "Update Guitar Identity error:",
        error
      );

      setMessage(
        "Không thể cập nhật profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.iconButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.title
              }
            >
              Guitar Identity
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Personalize your guitar profile
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,

              saving &&
                styles.disabled,
            ]}
            disabled={saving}
            onPress={
              handleSave
            }
          >
            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? "Saving..."
                : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BASIC INFO */}

        <SectionTitle
          icon="person-outline"
          text="Profile"
        />

        <FieldLabel
          text="Display name"
        />

        <TextInput
          value={
            displayName
          }
          onChangeText={
            setDisplayName
          }
          placeholder="Phúc Phan Gia"
          placeholderTextColor="#666"
          style={
            styles.input
          }
          maxLength={50}
        />

        <FieldLabel
          text="Username"
        />

        <View
          style={
            styles.usernameInput
          }
        >
          <Text
            style={
              styles.atSign
            }
          >
            @
          </Text>

          <TextInput
            value={
              username
            }
            onChangeText={
              setUsername
            }
            autoCapitalize="none"
            placeholder="phucguitar"
            placeholderTextColor="#666"
            style={
              styles.usernameTextInput
            }
            maxLength={30}
          />
        </View>

        <Text
          style={
            styles.hint
          }
        >
          Preview: @{cleanUsername || "username"}
        </Text>

        <FieldLabel
          text="Bio"
        />

        <TextInput
          value={bio}
          onChangeText={
            setBio
          }
          multiline
          maxLength={160}
          placeholder="Tell other guitarists about yourself..."
          placeholderTextColor="#666"
          style={[
            styles.input,
            styles.bioInput,
          ]}
        />

        <Text
          style={
            styles.counter
          }
        >
          {bio.length}/160
        </Text>

        {/* LEVEL */}

        <SectionTitle
          icon="stats-chart-outline"
          text="Skill Level"
        />

        <View
          style={
            styles.levelRow
          }
        >
          {LEVELS.map(
            (item) => {
              const selected =
                level === item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.levelButton,

                    selected &&
                      styles.levelButtonSelected,
                  ]}
                  onPress={() =>
                    setLevel(
                      item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.levelText,

                      selected &&
                        styles.levelTextSelected,
                    ]}
                  >
                    {capitalize(
                      item
                    )}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* GENRES */}

        <SectionTitle
          icon="musical-notes-outline"
          text="Favorite Genres"
        />

        <Text
          style={
            styles.hint
          }
        >
          Chọn tối đa 5 genres
        </Text>

        <View
          style={
            styles.genreGrid
          }
        >
          {GENRES.map(
            (genre) => {
              const selected =
                selectedGenres.includes(
                  genre
                );

              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,

                    selected &&
                      styles.genreChipSelected,
                  ]}
                  onPress={() =>
                    toggleGenre(
                      genre
                    )
                  }
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
                      styles.genreText,

                      selected &&
                        styles.genreTextSelected,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        <Text
          style={
            styles.counter
          }
        >
          {
            selectedGenres.length
          }
          /5 selected
        </Text>

        {/* GEAR */}

        <SectionTitle
          icon="hardware-chip-outline"
          text="My Gear"
        />

        <Text
          style={
            styles.hint
          }
        >
          Mỗi thiết bị một dòng
        </Text>

        <TextInput
          value={
            gearText
          }
          onChangeText={
            setGearText
          }
          multiline
          placeholder={
            "Yamaha Pacifica 112V\nNUX Mighty Plug\nBoss DS-1"
          }
          placeholderTextColor="#666"
          style={[
            styles.input,
            styles.gearInput,
          ]}
        />

        {message !== "" && (
          <View
            style={
              styles.messageBox
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={17}
              color="#F87171"
            />

            <Text
              style={
                styles.message
              }
            >
              {message}
            </Text>
          </View>
        )}

        {/* BOTTOM SAVE */}

        <TouchableOpacity
          style={[
            styles.fullSaveButton,

            saving &&
              styles.disabled,
          ]}
          disabled={saving}
          onPress={
            handleSave
          }
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.fullSaveText
            }
          >
            Save Guitar Identity
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FieldLabel({
  text,
}: {
  text: string;
}) {
  return (
    <Text
      style={
        styles.fieldLabel
      }
    >
      {text}
    </Text>
  );
}

function SectionTitle({
  icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <View
      style={
        styles.sectionTitleRow
      }
    >
      <Ionicons
        name={icon}
        size={20}
        color="#A78BFA"
      />

      <Text
        style={
          styles.sectionTitle
        }
      >
        {text}
      </Text>
    </View>
  );
}

function capitalize(
  value: string
) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#0B0B0F",
    },

    content: {
      width: "100%",
      maxWidth: 760,

      alignSelf: "center",

      padding: 24,
      paddingTop: 35,
      paddingBottom: 70,
    },

    header: {
      flexDirection: "row",

      alignItems: "center",

      gap: 13,

      marginBottom: 26,
    },

    iconButton: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      color: "#FFFFFF",

      fontSize: 25,

      fontWeight: "bold",
    },

    subtitle: {
      color: "#777",

      fontSize: 11,

      marginTop: 3,
    },

    saveButton: {
      backgroundColor:
        "#7C3AED",

      borderRadius: 12,

      paddingHorizontal: 17,
      paddingVertical: 10,
    },

    saveButtonText: {
      color: "#FFFFFF",

      fontSize: 12,

      fontWeight: "bold",
    },

    disabled: {
      opacity: 0.5,
    },

    sectionTitleRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 8,

      marginTop: 25,
      marginBottom: 13,
    },

    sectionTitle: {
      color: "#FFFFFF",

      fontSize: 16,

      fontWeight: "bold",
    },

    fieldLabel: {
      color: "#BDBDBD",

      fontSize: 11,

      fontWeight: "600",

      marginBottom: 7,
      marginTop: 12,
    },

    input: {
      backgroundColor:
        "#17171D",

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        "#292930",

      color: "#FFFFFF",

      paddingHorizontal: 14,
      paddingVertical: 12,

      fontSize: 13,
    },

    usernameInput: {
      flexDirection: "row",

      alignItems: "center",

      backgroundColor:
        "#17171D",

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        "#292930",

      paddingLeft: 14,
    },

    atSign: {
      color: "#A78BFA",

      fontWeight: "bold",

      fontSize: 14,
    },

    usernameTextInput: {
      flex: 1,

      color: "#FFFFFF",

      paddingHorizontal: 5,
      paddingVertical: 12,

      outlineStyle: "none" as any,
    },

    hint: {
      color: "#666",

      fontSize: 10,

      marginTop: 7,
    },

    bioInput: {
      minHeight: 105,

      textAlignVertical:
        "top",
    },

    gearInput: {
      minHeight: 125,

      textAlignVertical:
        "top",
    },

    counter: {
      color: "#555",

      fontSize: 9,

      textAlign: "right",

      marginTop: 5,
    },

    levelRow: {
      flexDirection: "row",

      gap: 8,
    },

    levelButton: {
      flex: 1,

      alignItems: "center",

      backgroundColor:
        "#17171D",

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        "#292930",

      paddingVertical: 11,
    },

    levelButtonSelected: {
      backgroundColor:
        "#7C3AED",

      borderColor:
        "#8B5CF6",
    },

    levelText: {
      color: "#777",

      fontSize: 11,

      fontWeight: "600",
    },

    levelTextSelected: {
      color: "#FFFFFF",
    },

    genreGrid: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 8,

      marginTop: 10,
    },

    genreChip: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      backgroundColor:
        "#17171D",

      borderRadius: 20,

      borderWidth: 1,

      borderColor:
        "#292930",

      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    genreChipSelected: {
      backgroundColor:
        "#7C3AED",

      borderColor:
        "#8B5CF6",
    },

    genreText: {
      color: "#888",

      fontSize: 11,

      fontWeight: "600",
    },

    genreTextSelected: {
      color: "#FFFFFF",
    },

    messageBox: {
      flexDirection: "row",

      alignItems: "center",

      gap: 7,

      backgroundColor:
        "#2B1719",

      borderRadius: 12,

      padding: 12,

      marginTop: 18,
    },

    message: {
      color: "#FCA5A5",

      fontSize: 11,

      flex: 1,
    },

    fullSaveButton: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 8,

      backgroundColor:
        "#7C3AED",

      borderRadius: 14,

      paddingVertical: 14,

      marginTop: 28,
    },

    fullSaveText: {
      color: "#FFFFFF",

      fontSize: 13,

      fontWeight: "bold",
    },
  });