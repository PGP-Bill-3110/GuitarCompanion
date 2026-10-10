from typing import Any


# =========================================================
# CONFIG
# =========================================================

# Standard guitar:
# E2 = 40
# E6 = 88 (24th fret high E)
MIN_GUITAR_MIDI = 40
MAX_GUITAR_MIDI = 88

# Basic Pitch của bạn đang tạo nhiều event
# khoảng 0.139 - 0.2s.
#
# Chỉ loại những event cực ngắn.
MIN_DURATION = 0.13

# Các event xuất hiện gần cùng thời điểm
# được xem như một onset group.
ONSET_WINDOW = 0.08

# Cùng một MIDI và gap rất nhỏ
# -> coi là cùng một note bị split.
MERGE_GAP = 0.08


# =========================================================
# 1. FILTER
# =========================================================

def filter_notes(
    notes: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    filtered = []

    for note in notes:

        midi = int(
            note["midi"]
        )

        duration = float(
            note["duration"]
        )

        # Outside standard guitar range
        if (
            midi < MIN_GUITAR_MIDI
            or
            midi > MAX_GUITAR_MIDI
        ):
            continue

        # Very short noise event
        if duration < MIN_DURATION:
            continue

        filtered.append(
            {
                **note
            }
        )

    return filtered


# =========================================================
# 2. MERGE SPLIT NOTES
# =========================================================

def merge_same_notes(
    notes: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    if not notes:
        return []

    sorted_notes = sorted(
        notes,
        key=lambda note:
            (
                note["startTime"],
                note["midi"],
            )
    )

    result = []

    for note in sorted_notes:

        merged = False

        # Search backwards because the matching
        # event is normally recent.
        for previous in reversed(
            result
        ):

            # Once we're too far away,
            # no need to search older events.
            if (
                note["startTime"]
                -
                previous["endTime"]
                >
                MERGE_GAP
            ):
                break

            same_pitch = (
                previous["midi"]
                ==
                note["midi"]
            )

            gap = (
                note["startTime"]
                -
                previous["endTime"]
            )

            if (
                same_pitch
                and
                gap <= MERGE_GAP
            ):
                previous[
                    "endTime"
                ] = max(
                    previous[
                        "endTime"
                    ],
                    note[
                        "endTime"
                    ],
                )

                previous[
                    "duration"
                ] = round(
                    previous[
                        "endTime"
                    ]
                    -
                    previous[
                        "startTime"
                    ],
                    3,
                )

                previous[
                    "amplitude"
                ] = round(
                    max(
                        previous[
                            "amplitude"
                        ],
                        note[
                            "amplitude"
                        ],
                    ),
                    3,
                )

                merged = True

                break

        if not merged:
            result.append(
                {
                    **note
                }
            )

    return result


# =========================================================
# 3. GROUP SIMULTANEOUS ONSETS
# =========================================================

def group_by_onset(
    notes: list[dict[str, Any]],
) -> list[list[dict[str, Any]]]:

    if not notes:
        return []

    sorted_notes = sorted(
        notes,
        key=lambda note:
            note["startTime"]
    )

    groups = []

    current_group = [
        sorted_notes[0]
    ]

    anchor_time = (
        sorted_notes[0][
            "startTime"
        ]
    )

    for note in sorted_notes[1:]:

        if (
            note["startTime"]
            -
            anchor_time
            <=
            ONSET_WINDOW
        ):
            current_group.append(
                note
            )

        else:
            groups.append(
                current_group
            )

            current_group = [
                note
            ]

            anchor_time = (
                note[
                    "startTime"
                ]
            )

    groups.append(
        current_group
    )

    return groups


# =========================================================
# 4. SELECT SINGLE-NOTE CANDIDATE
# =========================================================

def choose_single_note(
    group: list[dict[str, Any]],
) -> dict[str, Any]:

    if len(group) == 1:
        return {
            **group[0]
        }

    # MVP heuristic:
    #
    # Guitar harmonics normally appear
    # above the fundamental.
    #
    # Prefer lower pitch, but amplitude
    # is kept for later debugging.
    selected = min(
        group,
        key=lambda note:
            note["midi"]
    )

    result = {
        **selected
    }

    result[
        "candidateCount"
    ] = len(
        group
    )

    result[
        "candidates"
    ] = [
        {
            "note":
                item["note"],

            "midi":
                item["midi"],

            "amplitude":
                item[
                    "amplitude"
                ],
        }
        for item
        in group
    ]

    return result


# =========================================================
# 5. PROCESS SINGLE NOTE EXERCISE
# =========================================================

def process_single_notes(
    raw_notes: list[dict],
    expected_midis: list[int] | None = None,
) -> dict:

    filtered = (
        filter_notes(
            raw_notes
        )
    )

    merged = (
        merge_same_notes(
            filtered
        )
    )

    onset_groups = (
        group_by_onset(
            merged
        )
    )

    selected = [
        choose_single_note(
            group
        )
        for group in onset_groups
    ]

    selected.sort(
        key=lambda note:
            note["startTime"]
    )

    # =====================================
    # EXERCISE-AWARE FILTER
    # =====================================

    if expected_midis:

        selected = (
            filter_for_reference(
                selected,
                expected_midis,
            )
        )

    # =====================================
    # RELATIVE TIME
    # =====================================

    if selected:

        first_onset = (
            selected[0][
                "startTime"
            ]
        )

        for note in selected:

            note[
                "relativeStartTime"
            ] = round(
                note["startTime"]
                -
                first_onset,
                3,
            )

    return {
        "rawCount":
            len(raw_notes),

        "filteredCount":
            len(filtered),

        "mergedCount":
            len(merged),

        "onsetGroupCount":
            len(onset_groups),

        "cleanCount":
            len(selected),

        "cleanedNotes":
            selected,
    }

def filter_for_reference(
    notes: list[dict],
    expected_midis: list[int],
    margin: int = 5,
) -> list[dict]:
    """
    Restrict detected notes to a pitch range
    relevant to the current exercise.

    Example:
    C major scale = MIDI 60..72

    margin=5
    => keep MIDI 55..77
    """

    if not expected_midis:
        return notes

    min_midi = (
        min(expected_midis)
        - margin
    )

    max_midi = (
        max(expected_midis)
        + margin
    )

    return [
        note
        for note in notes

        if (
            min_midi
            <= note["midi"]
            <= max_midi
        )
    ]