"""Local-only GuitarCompanion record media endpoints (demo, not public hosting)."""
import re
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

router = APIRouter()
RECORDINGS_DIR = Path(__file__).resolve().parent / "uploads" / "records"
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
MAX_BYTES = 40 * 1024 * 1024
SUPPORTED = {
    "audio/webm": ".webm",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/ogg": ".ogg",
}


def valid_header(mime: str, data: bytes) -> bool:
    if mime == "audio/webm":
        return data.startswith(b"\x1a\x45\xdf\xa3")
    if mime in ("audio/mp4", "audio/x-m4a"):
        return len(data) >= 12 and data[4:8] == b"ftyp"
    if mime in ("audio/wav", "audio/x-wav"):
        return data[:4] == b"RIFF" and data[8:12] == b"WAVE"
    if mime == "audio/ogg":
        return data.startswith(b"OggS")
    if mime == "audio/mpeg":
        return data.startswith(b"ID3") or (len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)
    return False


@router.post("/api/records/upload")
async def upload_record_audio(file: UploadFile = File(...)):
    mime = (file.content_type or "").split(";", 1)[0].strip().lower()
    if mime not in SUPPORTED:
        raise HTTPException(status_code=415, detail="Unsupported audio format")
    data = await file.read(MAX_BYTES + 1)
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Recording exceeds 40 MB")
    if not valid_header(mime, data):
        raise HTTPException(status_code=415, detail="Invalid audio file content")
    name = uuid4().hex + SUPPORTED[mime]
    path = RECORDINGS_DIR / name
    path.write_bytes(data)
    return {"success": True, "mediaUrl": "/api/records/" + name, "filename": name, "size": len(data)}


@router.get("/api/records/{filename}")
def get_record_audio(filename: str):
    if not re.fullmatch(r"[0-9a-f]{32}\.(webm|m4a|mp3|wav|ogg)", filename):
        raise HTTPException(status_code=404, detail="Recording not found")
    path = RECORDINGS_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Recording not found")
    mime = {
        ".webm": "audio/webm", ".m4a": "audio/mp4", ".mp3": "audio/mpeg",
        ".wav": "audio/wav", ".ogg": "audio/ogg",
    }[path.suffix]
    return FileResponse(path, media_type=mime, filename=filename, content_disposition_type="inline")
