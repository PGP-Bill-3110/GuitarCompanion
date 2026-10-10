from typing import Any

import pretty_midi


# =========================================================
# TIMING CONFIG
# =========================================================

# Sai lệch <= 0.10 beat:
# coi như gần như perfect.
PERFECT_WINDOW_BEATS = 0.10

# Sai lệch >= 0.75 beat:
# event đó nhận 0 timing point.
ZERO_SCORE_BEATS = 0.75


# =========================================================
# SINGLE EVENT SCORE
# =========================================================

def calculate_event_timing_score(
    absolute_error_beats: float,
) -> float:
    """
    Convert timing deviation in beats
    into a 0..100 score.

    <= 0.10 beat -> 100
    >= 0.75 beat -> 0

    Between them -> linear interpolation.
    """

    if (
        absolute_error_beats
        <= PERFECT_WINDOW_BEATS
    ):
        return 100.0

    if (
        absolute_error_beats
        >= ZERO_SCORE_BEATS
    ):
        return 0.0

    usable_range = (
        ZERO_SCORE_BEATS
        -
        PERFECT_WINDOW_BEATS
    )

    error_inside_range = (
        absolute_error_beats
        -
        PERFECT_WINDOW_BEATS
    )

    score = (
        1.0
        -
        (
            error_inside_range
            /
            usable_range
        )
    ) * 100.0

    return round(
        max(
            0.0,
            min(
                100.0,
                score,
            ),
        ),
        1,
    )


# =========================================================
# TIMING ANALYSIS
# =========================================================

def calculate_timing_score(
    exercise: dict[str, Any],
    cleaned_notes: list[dict[str, Any]],
    alignment: list[dict[str, Any]],
) -> dict[str, Any]:

    # -----------------------------------------------------
    # BPM
    # -----------------------------------------------------

    bpm = exercise.get(
        "bpm"
    )

    if (
        bpm is None
        or float(bpm) <= 0
    ):
        raise ValueError(
            "Exercise must have a valid BPM."
        )

    bpm = float(
        bpm
    )

    beat_duration = (
        60.0 / bpm
    )


    # -----------------------------------------------------
    # NOTE EVENTS FROM REFERENCE
    # -----------------------------------------------------

    expected_events = [
        event
        for event
        in exercise.get(
            "events",
            []
        )
        if (
            event.get(
                "type"
            )
            ==
            "note"
        )
    ]

    expected_events.sort(
        key=lambda event:
            float(
                event[
                    "startBeat"
                ]
            )
    )


    if not expected_events:

        return {
            "timingScore":
                0.0,

            "timingPrecision":
                0.0,

            "coverage":
                0.0,

            "matchedCount":
                0,

            "expectedCount":
                0,

            "meanAbsErrorMs":
                None,

            "maxAbsErrorMs":
                None,

            "events":
                [],
        }


    # -----------------------------------------------------
    # NORMALIZE REFERENCE TIME
    #
    # Nếu reference bắt đầu beat 4 thay vì beat 0,
    # ta vẫn coi first note = 0 giây.
    # -----------------------------------------------------

    first_start_beat = float(
        expected_events[0][
            "startBeat"
        ]
    )


    expected_times = []

    for event in expected_events:

        relative_beat = (
            float(
                event[
                    "startBeat"
                ]
            )
            -
            first_start_beat
        )

        expected_time = (
            relative_beat
            *
            beat_duration
        )

        expected_times.append(
            expected_time
        )


    # -----------------------------------------------------
    # ALIGNMENT -> TIMING PAIRS
    #
    # correct + wrong đều có thể đánh giá timing.
    #
    # Ví dụ:
    # expected F4
    # user played F#4
    #
    # Pitch sai,
    # nhưng onset vẫn có thể đúng.
    # -----------------------------------------------------

    timing_events = []

    event_scores = []

    absolute_errors_ms = []

    early_count = 0
    late_count = 0
    on_time_count = 0


    for item in alignment:

        if item["type"] not in (
            "correct",
            "wrong",
        ):
            continue

        expected_index = (
            item.get(
                "expectedIndex"
            )
        )

        detected_index = (
            item.get(
                "detectedIndex"
            )
        )

        if (
            expected_index is None
            or
            detected_index is None
        ):
            continue

        if (
            expected_index
            >= len(
                expected_events
            )
            or
            detected_index
            >= len(
                cleaned_notes
            )
        ):
            continue


        expected_event = (
            expected_events[
                expected_index
            ]
        )

        detected_event = (
            cleaned_notes[
                detected_index
            ]
        )


        # ---------------------------------------------
        # EXPECTED TIME
        # ---------------------------------------------

        expected_time = (
            expected_times[
                expected_index
            ]
        )


        # ---------------------------------------------
        # ACTUAL TIME
        #
        # note_processing.py đã normalize
        # note đầu tiên thành 0.
        # ---------------------------------------------

        actual_time = float(
            detected_event.get(
                "relativeStartTime",
                detected_event[
                    "startTime"
                ],
            )
        )


        # ---------------------------------------------
        # ERROR
        #
        # positive = late
        # negative = early
        # ---------------------------------------------

        signed_error_seconds = (
            actual_time
            -
            expected_time
        )

        absolute_error_seconds = abs(
            signed_error_seconds
        )

        signed_error_beats = (
            signed_error_seconds
            /
            beat_duration
        )

        absolute_error_beats = abs(
            signed_error_beats
        )


        event_score = (
            calculate_event_timing_score(
                absolute_error_beats
            )
        )


        # ---------------------------------------------
        # CLASSIFICATION
        # ---------------------------------------------

        if (
            absolute_error_beats
            <=
            PERFECT_WINDOW_BEATS
        ):

            direction = (
                "on_time"
            )

            on_time_count += 1

        elif (
            signed_error_seconds
            < 0
        ):

            direction = (
                "early"
            )

            early_count += 1

        else:

            direction = (
                "late"
            )

            late_count += 1


        # ---------------------------------------------
        # NOTE NAMES
        # ---------------------------------------------

        expected_midi = int(
            expected_event[
                "midi"
            ]
        )

        detected_midi = int(
            detected_event[
                "midi"
            ]
        )


        expected_name = (
            expected_event.get(
                "note"
            )
            or
            pretty_midi
            .note_number_to_name(
                expected_midi
            )
        )

        detected_name = (
            detected_event.get(
                "note"
            )
            or
            pretty_midi
            .note_number_to_name(
                detected_midi
            )
        )


        error_ms = (
            signed_error_seconds
            *
            1000.0
        )


        timing_events.append(
            {
                "expectedIndex":
                    expected_index,

                "detectedIndex":
                    detected_index,

                "pitchResult":
                    item[
                        "type"
                    ],

                "expectedNote":
                    expected_name,

                "detectedNote":
                    detected_name,

                "expectedTime":
                    round(
                        expected_time,
                        3,
                    ),

                "actualTime":
                    round(
                        actual_time,
                        3,
                    ),

                "errorMs":
                    round(
                        error_ms,
                        1,
                    ),

                "errorBeats":
                    round(
                        signed_error_beats,
                        3,
                    ),

                "direction":
                    direction,

                "score":
                    event_score,
            }
        )


        event_scores.append(
            event_score
        )

        absolute_errors_ms.append(
            abs(
                error_ms
            )
        )


    # -----------------------------------------------------
    # FINAL SCORE
    # -----------------------------------------------------

    matched_count = (
        len(
            timing_events
        )
    )

    expected_count = (
        len(
            expected_events
        )
    )


    coverage = (
        (
            matched_count
            /
            expected_count
        )
        * 100.0
        if expected_count > 0
        else 0.0
    )


    if event_scores:

        timing_precision = (
            sum(
                event_scores
            )
            /
            len(
                event_scores
            )
        )

    else:

        timing_precision = 0.0


    if absolute_errors_ms:

        mean_abs_error_ms = (
            sum(
                absolute_errors_ms
            )
            /
            len(
                absolute_errors_ms
            )
        )

        max_abs_error_ms = max(
            absolute_errors_ms
        )

    else:

        mean_abs_error_ms = None
        max_abs_error_ms = None


    # Timing Score hiện tại = timing precision.
    #
    # Missed/extra notes đã được Note Accuracy
    # xử lý riêng, nên không double-penalty.
    timing_score = (
        timing_precision
    )


    return {
        "targetBpm":
            bpm,

        "beatDuration":
            round(
                beat_duration,
                4,
            ),

        "timingScore":
            round(
                timing_score,
                1,
            ),

        "timingPrecision":
            round(
                timing_precision,
                1,
            ),

        "coverage":
            round(
                coverage,
                1,
            ),

        "matchedCount":
            matched_count,

        "expectedCount":
            expected_count,

        "onTimeCount":
            on_time_count,

        "earlyCount":
            early_count,

        "lateCount":
            late_count,

        "meanAbsErrorMs":
            (
                round(
                    mean_abs_error_ms,
                    1,
                )
                if
                mean_abs_error_ms
                is not None
                else None
            ),

        "maxAbsErrorMs":
            (
                round(
                    max_abs_error_ms,
                    1,
                )
                if
                max_abs_error_ms
                is not None
                else None
            ),

        "events":
            timing_events,
    }