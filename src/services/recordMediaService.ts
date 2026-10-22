// Web-first: keep the upload method isolated so it can later use Firebase Storage.
const BASE_URL = (process.env.EXPO_PUBLIC_AI_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function uploadRecordingAudio(uri: string): Promise<string> {
  const local = await fetch(uri);
  if (!local.ok) throw new Error("Cannot read the recording on this device");
  const blob = await local.blob();
  const rawMime = (blob.type || "audio/webm").split(";", 1)[0].toLowerCase();
  const mime = rawMime === "audio/x-m4a" ? "audio/mp4" : rawMime;
  const extensions: Record<string, string> = {
    "audio/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3",
    "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg",
  };
  const ext = extensions[mime];
  if (!ext) throw new Error(`Recording format not supported: ${mime}`);
  if (blob.size > 40 * 1024 * 1024) throw new Error("Recording exceeds 40 MB");
  const body = new FormData();
  body.append("file", new Blob([blob], { type: mime }), `recording.${ext}`);
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/records/upload`, { method: "POST", body });
  } catch {
    throw new Error(`FastAPI unavailable at ${BASE_URL}`);
  }
  if (!response.ok) {
    let msg = `Upload failed (HTTP ${response.status})`;
    try { msg = (await response.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  const result = await response.json();
  if (!result.mediaUrl || !result.success) throw new Error("Invalid upload response");
  return `${BASE_URL}${result.mediaUrl}`;
}
