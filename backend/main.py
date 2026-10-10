from pathlib import Path
from uuid import uuid4

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from services.exercise_service import (
    get_all_exercises,
    get_exercise_by_id,
)

from services.audio_service import (
    convert_to_wav,
)

from services.pitch_analysis import (
    analyze_pitch,
)

from services.note_processing import (
    process_single_notes,
)

from services.scoring_service import (
    align_note_sequences,
)

from services.timing_service import (
    calculate_timing_score,
)

# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Guitar Companion AI Backend"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    # MVP development only.
    # Production nên giới hạn domain.
    allow_origins=[
        "*"
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PATHS
# =========================================================

BASE_DIR = (
    Path(__file__)
    .resolve()
    .parent
)

UPLOAD_DIR = (
    BASE_DIR
    / "uploads"
)

RAW_DIR = (
    UPLOAD_DIR
    / "raw"
)

TEMP_DIR = (
    UPLOAD_DIR
    / "temp"
)


# Tự tạo folder nếu chưa tồn tại.
RAW_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

TEMP_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "name":
            "Guitar Companion AI",

        "status":
            "running",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():

    return {
        "success":
            True,

        "status":
            "healthy",
    }


# =========================================================
# EXERCISES
# =========================================================

@app.get("/api/exercises")
def list_exercises():

    exercises = (
        get_all_exercises()
    )

    return {
        "success":
            True,

        "count":
            len(exercises),

        "exercises":
            exercises,
    }


@app.get(
    "/api/exercises/{exercise_id}"
)
def get_exercise(
    exercise_id: str
):

    exercise = (
        get_exercise_by_id(
            exercise_id
        )
    )

    if exercise is None:

        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    return {
        "success":
            True,

        "exercise":
            exercise,
    }


# =========================================================
# AUDIO ANALYSIS
# =========================================================

def build_simple_feedback(
    note_accuracy: float,
    timing_score: float,
) -> list[str]:
    feedback = []

    if note_accuracy >= 85:
        feedback.append(
            "Good note accuracy. "
            "Most notes were played correctly."
        )
    elif note_accuracy >= 60:
        feedback.append(
            "Some notes were incorrect or missed. "
            "Practice the note sequence slowly."
        )
    else:
        feedback.append(
            "Focus on playing the correct notes "
            "before increasing speed."
        )

    if timing_score >= 85:
        feedback.append(
            "Good timing. "
            "Your rhythm is close to the target tempo."
        )
    elif timing_score >= 60:
        feedback.append(
            "Timing is fairly good, "
            "but some notes are early or late."
        )
    else:
        feedback.append(
            "Practice with a metronome "
            "to improve timing consistency."
        )

    return feedback


@app.post("/api/analyze")
async def analyze_audio(
    audio: UploadFile = File(...),
    exerciseId: str | None = Form(None),
):

    # -----------------------------------------------------
    # 1. Determine extension
    # -----------------------------------------------------

    original_filename = (
        audio.filename
        or "audio.webm"
    )

    suffix = (
        Path(
            original_filename
        )
        .suffix
        .lower()
    )

    if not suffix:
        suffix = ".webm"


    # -----------------------------------------------------
    # 2. Generate unique ID
    # -----------------------------------------------------

    file_id = (
        uuid4().hex
    )

    filename = (
        f"{file_id}{suffix}"
    )

    raw_path = (
        RAW_DIR
        / filename
    )


    # -----------------------------------------------------
    # 3. Read upload
    # -----------------------------------------------------

    try:

        content = (
            await audio.read()
        )

    except Exception as error:

        print(
            "Cannot read uploaded audio:",
            error,
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot read uploaded audio."
            ),
        )


    if len(content) == 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "Uploaded audio is empty."
            ),
        )


    # -----------------------------------------------------
    # 4. Save original recording
    #
    # uploads/raw/<uuid>.webm
    # -----------------------------------------------------

    try:

        raw_path.write_bytes(
            content
        )

    except Exception as error:

        print(
            "Cannot save raw audio:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Cannot save uploaded audio."
            ),
        )


    print(
        f"Raw audio saved: {raw_path}"
    )


    # -----------------------------------------------------
    # 5. Temporary WAV
    # -----------------------------------------------------

    wav_path = None


    try:

        # =================================================
        # WEBM / M4A -> WAV
        #
        # raw/<uuid>.webm
        #       ↓
        # temp/<uuid>.wav
        # =================================================

        wav_path = (
            convert_to_wav(
                raw_path,
                TEMP_DIR,
            )
        )

        print(
            f"Temporary WAV created: {wav_path}"
        )


        # =================================================
        # BASIC PITCH
        # =================================================

        pitch_result = (
            analyze_pitch(
                wav_path
            )
        )


        # =================================================
        # EXERCISE SCORING
        # =================================================

        raw_notes = pitch_result["detectedNotes"]

        if not exerciseId:
            return {
                "success": True,
                "audioId": file_id,
                "filename": filename,
                "exerciseId": None,
                "message": "Audio analyzed successfully",
                "noteCount": len(raw_notes),
                "detectedNotes": raw_notes,
                "analysis": None,
            }

        exercise = get_exercise_by_id(exerciseId)

        if exercise is None:
            raise HTTPException(
                status_code=404,
                detail="Exercise not found.",
            )

        expected_events = [
            event
            for event in exercise.get("events", [])
            if event.get("type") == "note"
        ]
        expected_events.sort(
            key=lambda event: float(event.get("startBeat", 0)),
        )

        if not expected_events:
            raise HTTPException(
                status_code=400,
                detail="Exercise does not contain note events.",
            )

        expected_midis = [
            int(event["midi"])
            for event in expected_events
        ]

        processed = process_single_notes(
            raw_notes,
            expected_midis,
        )
        cleaned_notes = processed["cleanedNotes"]
        detected_midis = [
            int(note["midi"])
            for note in cleaned_notes
        ]

        note_result = align_note_sequences(
            expected_midis,
            detected_midis,
        )
        timing_result = calculate_timing_score(
            exercise,
            cleaned_notes,
            note_result["alignment"],
        )

        note_accuracy = float(note_result["noteAccuracy"])
        timing_score = float(timing_result["timingScore"])
        overall_score = round(
            (note_accuracy + timing_score) / 2,
            1,
        )
        feedback = build_simple_feedback(
            note_accuracy,
            timing_score,
        )

        return {
            "success": True,
            "audioId": file_id,
            "filename": filename,
            "exercise": {
                "id": exerciseId,
                "title": exercise.get("title", exerciseId),
            },
            "message": "Practice analyzed successfully",
            "analysis": {
                "overallScore": overall_score,
                "noteAccuracy": note_accuracy,
                "timingScore": timing_score,
                "correct": note_result["correct"],
                "wrong": note_result["wrong"],
                "missed": note_result["missed"],
                "extra": note_result["extra"],
                "meanTimingErrorMs": timing_result["meanAbsErrorMs"],
                "early": timing_result["earlyCount"],
                "late": timing_result["lateCount"],
                "onTime": timing_result["onTimeCount"],
            },
            "feedback": feedback,
            "debug": {
                "rawNoteCount": len(raw_notes),
                "cleanNoteCount": len(cleaned_notes),
                "expectedMidi": expected_midis,
                "detectedMidi": detected_midis,
                "alignment": note_result["alignment"],
                "timingEvents": timing_result["events"],
            },
        }

    except HTTPException:
        raise

    except Exception as error:
        import traceback

        print(
            "Analysis error:",
            repr(error),
        )
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Audio analysis failed: {str(error)}"
            ),
        )


    finally:

        # =================================================
        # DELETE TEMP WAV
        # =================================================

        if (
            wav_path is not None
            and wav_path.exists()
        ):

            try:

                wav_path.unlink()

                print(
                    "Temporary WAV deleted:",
                    wav_path,
                )

            except Exception as error:

                # Không làm API fail chỉ vì
                # cleanup file temp thất bại.
                print(
                    "Cannot delete temporary WAV:",
                    error,
                )