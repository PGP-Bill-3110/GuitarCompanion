import subprocess
from pathlib import Path

from imageio_ffmpeg import get_ffmpeg_exe


def convert_to_wav(
    input_path: Path,
    output_dir: Path,
) -> Path:
    """
    Convert uploaded audio such as WebM/M4A
    into a temporary mono WAV file.

    input_path:
        uploads/raw/<uuid>.webm

    output:
        uploads/temp/<uuid>.wav
    """

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_dir
        / f"{input_path.stem}.wav"
    )

    command = [
        get_ffmpeg_exe(),
        "-nostdin",
        "-y",

        "-i",
        str(input_path),

        # Mono
        "-ac",
        "1",

        # Standardized sample rate
        "-ar",
        "22050",

        str(output_path),
    ]

    try:
        subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
        )

    except subprocess.CalledProcessError as error:
        output_path.unlink(missing_ok=True)
        print(
            "FFmpeg error:"
        )

        print(
            error.stderr
        )

        raise RuntimeError(
            "Cannot convert audio to WAV."
        ) from error

    except OSError as error:
        output_path.unlink(missing_ok=True)
        raise RuntimeError(
            "Cannot start FFmpeg for audio conversion."
        ) from error

    if not output_path.exists():
        raise RuntimeError(
            "Converted WAV was not created."
        )

    return output_path