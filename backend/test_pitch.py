from pathlib import Path

from services.audio_service import (
    convert_to_wav,
)

from services.pitch_analysis import (
    analyze_pitch,
)

from services.note_processing import (
    process_single_notes,
)

from services.exercise_service import (
    get_exercise_by_id,
)

from services.scoring_service import (
    align_note_sequences,
)

from services.timing_service import (
    calculate_timing_score,
)

exercise = (
    get_exercise_by_id(
        "c-major-scale"
    )
)

if exercise is None:
    raise RuntimeError(
        "Exercise not found"
    )

expected_midis = [
    event["midi"]
    for event in exercise["events"]
    if event["type"] == "note"
]

print(
    "Expected MIDI:",
    expected_midis,
)


RAW_DIR = Path(
    "uploads/raw"
)

TEMP_DIR = Path(
    "uploads/temp"
)


audio_file = (
    RAW_DIR
    /
    "64f7b61f09a347139de2d9794b53abf1.webm"
)


wav_file = None


try:

    wav_file = (
        convert_to_wav(
            audio_file,
            TEMP_DIR,
        )
    )


    # ====================================
    # BASIC PITCH
    # ====================================

    pitch_result = (
        analyze_pitch(
            wav_file
        )
    )


    # ====================================
    # NOTE PROCESSING
    # ====================================

    processed = (
        process_single_notes(
            pitch_result[
                "detectedNotes"
            ],
            expected_midis,
        )
    )

    detected_midis = [
        note["midi"]
        for note in processed[
            "cleanedNotes"
        ]
    ]

    score = (
        align_note_sequences(
            expected_midis,
            detected_midis,
        )
    )

    timing = (
        calculate_timing_score(
            exercise,
            processed[
                "cleanedNotes"
            ],
            score[
                "alignment"
            ],
        )
    )

    print(
        "\n===== REFERENCE ====="
    )
    print(expected_midis)

    print(
        "\n===== DETECTED ====="
    )
    print(detected_midis)

    print(
        "\n===== SCORE ====="
    )
    print(
        "Correct:",
        score["correct"],
    )
    print(
        "Wrong:",
        score["wrong"],
    )

    print(
        "Mean error:",
        timing[
            "meanAbsErrorMs"
        ],
        "ms",
    )
    print(
        "Max error:",
        timing[
            "maxAbsErrorMs"
        ],
        "ms",
    )
    print(
        "On time:",
        timing[
            "onTimeCount"
        ],
    )
    print(
        "Early:",
        timing[
            "earlyCount"
        ],
    )
    print(
        "Late:",
        timing[
            "lateCount"
        ],
    )
    print(
        "\n"
        "===== TIMING DETAILS ====="
    )

    for event in timing[
        "events"
    ]:
        sign = (
            "+"
            if event[
                "errorMs"
            ] > 0
            else ""
        )
        print(
            f"{event['expectedNote']:4s} "
            f"-> "
            f"{event['detectedNote']:4s} "
            f"| expected "
            f"{event['expectedTime']:5.2f}s "
            f"| actual "
            f"{event['actualTime']:5.2f}s "
            f"| "
            f"{sign}{event['errorMs']:7.1f} ms "
            f"| {event['direction']:7s} "
            f"| score "
            f"{event['score']:5.1f}"
        )


    print(
        "\n"
        "=============================="
    )

    print(
        "NOTE PROCESSING"
    )

    print(
        "=============================="
    )


    print(
        "Raw:",
        processed[
            "rawCount"
        ]
    )

    print(
        "Filtered:",
        processed[
            "filteredCount"
        ]
    )

    print(
        "Merged:",
        processed[
            "mergedCount"
        ]
    )

    print(
        "Onset groups:",
        processed[
            "onsetGroupCount"
        ]
    )

    print(
        "Clean:",
        processed[
            "cleanCount"
        ]
    )


    print(
        "\n"
        "===== CLEAN SEQUENCE ====="
    )


    for note in processed[
        "cleanedNotes"
    ]:

        print(
            f"{note['relativeStartTime']:6.3f}s  "
            f"{note['note']:4s}  "
            f"MIDI={note['midi']:2d}  "
            f"duration={note['duration']:.3f}s  "
            f"amp={note['amplitude']:.3f}"
        )


finally:

    if (
        wav_file
        and
        wav_file.exists()
    ):

        wav_file.unlink()