export interface DetectedNote {
  note: string;

  midi: number;

  startTime: number;

  endTime: number;

  duration: number;

  amplitude: number;
}

export interface PracticeAnalysis {
  overallScore: number;

  noteAccuracy: number;

  timingScore: number;

  correct: number;

  wrong: number;

  missed: number;

  extra: number;

  meanTimingErrorMs:
    number | null;

  early: number;

  late: number;

  onTime: number;
}

export interface AudioAnalysisResult {
  success: boolean;

  audioId: string;

  filename: string;

  message: string;

  exercise?: {
    id: string;
    title: string;
  };

  analysis:
    PracticeAnalysis | null;

  feedback?: string[];
}

const API_URL =
  process.env
    .EXPO_PUBLIC_AI_API_URL ||
  "http://localhost:8000";

export async function uploadPracticeAudio(
  uri: string,
  exerciseId?: string
): Promise<AudioAnalysisResult> {
  // Đọc file recording local/blob
  const audioResponse =
    await fetch(uri);

  if (!audioResponse.ok) {
    throw new Error(
      "Cannot read recorded audio."
    );
  }

  const blob =
    await audioResponse.blob();

  if (
    !blob ||
    blob.size === 0
  ) {
    throw new Error(
      "Recorded audio is empty."
    );
  }

  // Xác định extension
  let extension =
    "webm";

  if (
    blob.type.includes(
      "mp4"
    ) ||
    blob.type.includes(
      "m4a"
    )
  ) {
    extension =
      "m4a";
  } else if (
    blob.type.includes(
      "wav"
    )
  ) {
    extension =
      "wav";
  } else if (
    blob.type.includes(
      "mpeg"
    )
  ) {
    extension =
      "mp3";
  }

  const filename =
    `practice-${Date.now()}.${extension}`;

  // Tạo multipart form
  const formData =
    new FormData();

  formData.append(
    "audio",
    blob,
    filename
  );

  if (exerciseId) {
    formData.append(
      "exerciseId",
      exerciseId
    );
  }

  // Upload FastAPI
  const response =
    await fetch(
      `${API_URL}/api/analyze`,
      {
        method: "POST",

        body:
          formData,
      }
    );

  if (!response.ok) {
    let errorMessage =
      `Analysis failed (${response.status})`;

    const errorBody =
      await response.text();

    if (errorBody.trim()) {
      let error: unknown;

      try {
        error = JSON.parse(errorBody);
      } catch (error) {
        console.warn(
          "Analysis error response is not valid JSON:",
          error
        );
      }

      if (
        typeof error === "object" &&
        error !== null
      ) {
        if (
          "detail" in error &&
          typeof error.detail === "string" &&
          error.detail
        ) {
          errorMessage = error.detail;
        } else if (
          "message" in error &&
          typeof error.message === "string" &&
          error.message
        ) {
          errorMessage = error.message;
        }
      }
    }

    throw new Error(
      errorMessage
    );
  }

  return response.json();
}