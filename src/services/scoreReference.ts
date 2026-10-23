export interface ScoreReferenceNote {
  midi: number;
  startTime: number;
  duration: number;
}
export interface ScoreReference {
  key: string;
  sourceId: string;
  title: string;
  bpm: number;
  trackIndex: number;
  trackName: string;
  notes: ScoreReferenceNote[];
  durationSeconds: number;
  startBar?: number;
  endBar?: number;
  startTick?: number;
  endTick?: number;
  polyphonic: boolean;
  changingTempo: boolean;
  savedAt?: number;
}

export async function getScoreReference(key: string): Promise<ScoreReference | null> {
  if (typeof indexedDB === "undefined" || !key || key.length > 250) return null;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("guitarcompanion-score-references", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("references")) {
        database.createObjectStore("references", { keyPath: "key" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Cannot open score reference library"));
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("references", "readonly");
      const data = tx.objectStore("references").get(key);
      data.onsuccess = () => {
        db.close();
        resolve(data.result ?? null);
      };
      data.onerror = () => { db.close(); reject(data.error); };
    };
  });
}
