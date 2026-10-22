const API_URL = (process.env.EXPO_PUBLIC_AI_API_URL || "http://localhost:8000").replace(/\/$/, "");

export type CommunityMediaType = "image" | "video";
export interface UploadedMedia {
  url: string;
  path: string;
  contentType: string;
  mediaType: CommunityMediaType;
}

export async function uploadCommunityMedia(
  _uid: string,
  uri: string,
  contentType?: string,
  filename?: string
): Promise<UploadedMedia> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Cannot read selected media.");
  const blob = await response.blob();
  const type = contentType || blob.type || (filename?.toLowerCase().endsWith(".mov") ? "video/quicktime" : "application/octet-stream");
  const isVideo = type.startsWith("video/");
  const max = isVideo ? 80 * 1024 * 1024 : 10 * 1024 * 1024;
  if (blob.size > max) throw new Error(isVideo ? "Video exceeds 80 MB" : "Image exceeds 10 MB");
  const body = new FormData();
  const ext = type === "video/quicktime" ? "mov" : type === "video/mp4" ? "mp4" : type === "video/webm" ? "webm" : type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  body.append("file", new Blob([blob], { type }), filename || "post." + ext);
  const uploaded = await fetch(API_URL + "/api/community/upload-media", { method: "POST", body });
  if (!uploaded.ok) {
    let message = "Upload failed (" + uploaded.status + ")";
    try { message = (await uploaded.json()).detail || message; } catch {}
    throw new Error(message);
  }
  const result = await uploaded.json();
  return {
    url: API_URL + result.mediaUrl,
    path: result.mediaPath,
    contentType: result.contentType,
    mediaType: result.mediaType,
  };
}
export async function uploadCommunityImage(uid: string, uri: string, contentType?: string, filename?: string) {
  return uploadCommunityMedia(uid, uri, contentType, filename);
}
