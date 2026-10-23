/* GuitarCompanion local score library. Browser-only, no network or Firebase. */
(function (global) {
  "use strict";
  const DB_NAME = "guitarcompanion-score-library";
  const DB_VERSION = 1;
  const STORE = "scores";
  const MAX_BYTES = 15 * 1024 * 1024;
  const VALID = new Set(["xml", "musicxml", "mxl", "gp", "gpx", "gp3", "gp4", "gp5", "cap", "capx", "tex", "txt"]);
  let connection = null;

  function checkSupported() {
    if (!("indexedDB" in global)) throw new Error("Trình duyệt không hỗ trợ IndexedDB.");
  }
  function open() {
    checkSupported();
    if (connection) return connection;
    connection = new Promise(function (resolve, reject) {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("savedAt", "savedAt", { unique: false });
        }
      };
      req.onsuccess = function () {
        const db = req.result;
        db.onversionchange = function () { db.close(); connection = null; };
        resolve(db);
      };
      req.onerror = function () { connection = null; reject(req.error || new Error("Không thể mở thư viện cục bộ.")); };
      req.onblocked = function () { connection = null; reject(new Error("Đóng các tab cũ đang sử dụng thư viện rồi thử lại.")); };
    });
    return connection;
  }
  function transact(mode, perform) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let value;
        let request;
        tx.oncomplete = function () { resolve(value); };
        tx.onabort = function () { reject(tx.error || request?.error || new Error("Không thể ghi dữ liệu IndexedDB.")); };
        tx.onerror = function () { /* onabort will reject */ };
        try {
          request = perform(store);
          if (request) {
            request.onsuccess = function () { value = request.result; };
          }
        } catch (error) {
          try { tx.abort(); } catch (_) {}
          reject(error);
        }
      });
    });
  }
  function format(filename) {
    return String(filename || "").split(".").pop().toLowerCase();
  }
  function metadata(record) {
    return { id: record.id, name: record.name, format: record.format, size: record.size, savedAt: record.savedAt, title: record.title || "" };
  }
  async function save(input) {
    const ext = format(input.name);
    if (!VALID.has(ext)) throw new Error("Định dạng file chưa được hỗ trợ.");
    const bytes = input.bytes;
    if (!(bytes instanceof ArrayBuffer) || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
      throw new Error("File rỗng hoặc vượt quá 15 MB.");
    }
    const record = {
      id: typeof global.crypto?.randomUUID === "function" ? global.crypto.randomUUID() : "score-" + Date.now() + "-" + Math.random().toString(36).slice(2),
      name: String(input.name).slice(0, 180),
      format: ext,
      size: bytes.byteLength,
      savedAt: Date.now(),
      title: String(input.title || input.name).slice(0, 200),
      bytes
    };
    await transact("readwrite", function (store) { return store.put(record); });
    return metadata(record);
  }
  async function list() {
    const records = await transact("readonly", function (store) { return store.getAll(); });
    return records.map(metadata).sort(function (a, b) { return b.savedAt - a.savedAt; });
  }
  function get(id) {
    return transact("readonly", function (store) { return store.get(id); });
  }
  function remove(id) {
    return transact("readwrite", function (store) { return store.delete(id); });
  }
  global.GuitarCompanionScoreDB = { open, save, list, get, remove, VALID, MAX_BYTES };
})(window);
