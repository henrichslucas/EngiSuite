const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open('engisuite', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('kv')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

export async function load(key) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = db.transaction('kv').objectStore('kv').get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function save(key, value) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
