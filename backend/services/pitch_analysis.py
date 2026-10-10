from pathlib import Path
from typing import Any

import pretty_midi

from basic_pitch import (
    ICASSP_2022_MODEL_PATH,
)

from basic_pitch.inference import (
    Model,
    predict,
)


# =========================================================
# MODEL SINGLETON
#
# Không load model lại ở mỗi request.
# Model chỉ được tạo lần đầu khi analyze_pitch() được gọi.
# =========================================================

_basic_pitch_model: Model | None = None


def get_basic_pitch_model() -> Model:
    global _basic_pitch_model

    if _basic_pitch_model is None:
        print(
            "Loading Basic Pitch model..."
        )

        _basic_pitch_model = Model(
            ICASSP_2022_MODEL_PATH
        )

        print(
            "Basic Pitch model ready."
        )

    return _basic_pitch_model


# =========================================================
# ANALYZE PITCH
# =========================================================

def analyze_pitch(
    audio_path: Path | str,
) -> dict[str, Any]:

    path = Path(
        audio_path
    )

    if not path.exists():
        raise FileNotFoundError(
            f"Audio file not found: {path}"
        )

    if not path.is_file():
        raise ValueError(
            f"Audio path is not a file: {path}"
        )

    model = (
        get_basic_pitch_model()
    )

    print(
        f"Analyzing pitch: {path}"
    )

    # -----------------------------------------------------
    # Guitar frequency range
    #
    # Standard guitar E2 ≈ 82 Hz.
    # Ta để thấp hơn một chút để có margin.
    #
    # 75 Hz -> khoảng D#2
    # 1500 Hz -> dư cho upper guitar notes/harmonics
    # -----------------------------------------------------

    (
        _model_output,
        _midi_data,
        note_events,
    ) = predict(
        str(path),

        model,

        minimum_frequency=75.0,

        maximum_frequency=1500.0,
    )

    detected_notes = []

    # -----------------------------------------------------
    # note_event:
    #
    # (
    #   start_time,
    #   end_time,
    #   midi_pitch,
    #   amplitude,
    #   pitch_bends
    # )
    # -----------------------------------------------------

    for event in note_events:

        (
            start_time,
            end_time,
            midi_pitch,
            amplitude,
            _pitch_bends,
        ) = event

        note_name = (
            pretty_midi
            .note_number_to_name(
                int(
                    midi_pitch
                )
            )
        )

        duration = (
            float(
                end_time
            )
            -
            float(
                start_time
            )
        )

        detected_notes.append(
            {
                "note":
                    note_name,

                "midi":
                    int(
                        midi_pitch
                    ),

                "startTime":
                    round(
                        float(
                            start_time
                        ),
                        3,
                    ),

                "endTime":
                    round(
                        float(
                            end_time
                        ),
                        3,
                    ),

                "duration":
                    round(
                        duration,
                        3,
                    ),

                "amplitude":
                    round(
                        float(
                            amplitude
                        ),
                        3,
                    ),

            }
        )

    # Sắp theo thời gian.
    detected_notes.sort(
        key=lambda note:
            note["startTime"]
    )

    print(
        f"Detected "
        f"{len(detected_notes)} notes."
    )

    return {
        "noteCount":
            len(
                detected_notes
            ),

        "detectedNotes":
            detected_notes,
    }