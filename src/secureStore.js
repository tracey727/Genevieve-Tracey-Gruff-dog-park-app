const DB_NAME = 'genevieve-secure-v1';
const STORE = 'keys';
const KEY_NAME = 'device-aes-key';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getKey() {
  const db = await openDb();
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(KEY_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(key, KEY_NAME);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return key;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function secureSet(name, value) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  const payload = {
    iv: Array.from(iv),
    cipher: Array.from(new Uint8Array(cipher))
  };
  localStorage.setItem(`genevieve:secure:${name}`, JSON.stringify(payload));
}

export async function secureGet(name, fallback) {
  try {
    const raw = localStorage.getItem(`genevieve:secure:${name}`);
    if (!raw) return fallback;
    const payload = JSON.parse(raw);
    const key = await getKey();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(payload.iv) },
      key,
      new Uint8Array(payload.cipher)
    );
    return JSON.parse(dec.decode(plain));
  } catch {
    return fallback;
  }
}
