(function (global) {
  "use strict";
  const NAME = "guitarcompanion-score-references";
  const STORE = "references";
  let connection = null;
  function open() {
    if (!global.indexedDB) return Promise.reject(new Error("IndexedDB unavailable"));
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { connection = null; reject(request.error || new Error("IndexedDB error")); };
    });
    return connection;
  }
  async function read(key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function save(record) {
    if (!record || typeof record.key !== "string" || record.key.length > 250 ||
        !Array.isArray(record.notes) || record.notes.length < 1 || record.notes.length > 1500) {
      throw new Error("Invalid score reference");
    }
    const db = await open();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ ...record, savedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  global.GuitarCompanionReferenceDB = { read, save };
})(window);
