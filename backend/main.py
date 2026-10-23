from pathlib import Path
from math import isfinite
from uuid import uuid4
from fastapi.staticfiles import StaticFiles

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
    filter_notes,
    merge_same_notes,
)
from services.dynamic_score import parse_reference, score_reference

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
from record_audio_routes import router as record_audio_router
app.include_router(record_audio_router)

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
# COMMUNITY MEDIA: LOCAL DEMO SERVER
# Keep backend bound to 127.0.0.1 for local demo.
# =========================================================
COMMUNITY_MEDIA_DIR = UPLOAD_DIR / "community"
(COMMUNITY_MEDIA_DIR / "images").mkdir(parents=True, exist_ok=True)
(COMMUNITY_MEDIA_DIR / "videos").mkdir(parents=True, exist_ok=True)

app.mount(
    "/media/community",
    StaticFiles(directory=COMMUNITY_MEDIA_DIR),
    name="community-media",
)

MEDIA_TYPES = {
    "image/jpeg": ("images", ".jpg", 10 * 1024 * 1024),
    "image/png": ("images", ".png", 10 * 1024 * 1024),
    "image/webp": ("images", ".webp", 10 * 1024 * 1024),
    "video/mp4": ("videos", ".mp4", 80 * 1024 * 1024),
    "video/webm": ("videos", ".webm", 80 * 1024 * 1024),
    "video/quicktime": ("videos", ".mov", 80 * 1024 * 1024),
}

def valid_media_signature(content_type: str, data: bytes) -> bool:
    if content_type == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    if content_type in ("video/mp4", "video/quicktime"):
        return len(data) >= 12 and data[4:8] == b"ftyp"
    if content_type == "video/webm":
        return data.startswith(b"\x1a\x45\xdf\xa3")
    return False

@app.post("/api/community/upload-media")
async def upload_community_media(file: UploadFile = File(...)):
    media_type = (file.content_type or "").split(";")[0].strip().lower()
    if media_type not in MEDIA_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image/video format")
    folder, extension, max_bytes = MEDIA_TYPES[media_type]
    # Read max+1 so oversized uploads don't exhaust app memory.
    content = await file.read(max_bytes + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="Media too large")
    if not valid_media_signature(media_type, content):
        raise HTTPException(status_code=415, detail="File content does not match media format")
    filename = uuid4().hex + extension
    (COMMUNITY_MEDIA_DIR / folder / filename).write_bytes(content)
    relative_path = f"/media/community/{folder}/{filename}"
    return {
        "success": True,
        "mediaType": "image" if folder == "images" else "video",
        "mediaUrl": relative_path,
        "mediaPath": f"community/{folder}/{filename}",
        "contentType": media_type,
        "size": len(content),
    }


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
    bpm: float | None = Form(None),
    scoreJson: str | None = Form(None),
):

    if exerciseId and scoreJson:
        raise HTTPException(status_code=422, detail="Use exerciseId OR scoreJson, not both.")
    parsed_score = parse_reference(scoreJson) if scoreJson else None

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
            await audio.read(25 * 1024 * 1024 + 1)
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


    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Recording too large (max 25 MB).")
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

        if parsed_score:
            # Use polyphonic pitch events directly, rather than the monophonic
            # process_single_notes() pipeline used by fixed exercises.
            cleaned = merge_same_notes(filter_notes(raw_notes))
            result = score_reference(parsed_score, cleaned, bpm)
            note_accuracy = float(result["noteAccuracy"])
            timing_score = float(result["timingScore"])
            return {
                "success": True,
                "audioId": file_id,
                "filename": filename,
                "exercise": {"id": "dynamic-score", "title": parsed_score["title"]},
                "message": "Experimental score-based analysis complete",
                "analysis": result,
                "feedback": build_simple_feedback(note_accuracy, timing_score) + [
                    "Đánh giá thử nghiệm theo 60 giây đầu của một track.",
                    "Hợp âm, đa âm và đoạn lặp phức tạp có thể gây sai số; không coi đây là điểm tuyệt đối."
                ],
            }

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
        # The client stores the practice BPM in Firestore. Use it as the
        # target tempo when users change alphaTab playback speed.
        if bpm is not None:
            if not isfinite(bpm) or bpm < 20 or bpm > 300:
                raise HTTPException(status_code=422, detail="BPM must be between 20 and 300.")
            exercise = {**exercise, "bpm": bpm}

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