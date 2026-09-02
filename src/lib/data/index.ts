import type { DataAdapter } from './contract'
import { hasFirebaseConfig } from './config'
import { MockAdapter } from './mock-adapter'

let instance: DataAdapter | null = null

/**
 * Dipanggil sekali saat bootstrap (lihat main.tsx).
 * Firebase dipakai begitu keenam env VITE_FIREBASE_* terisi; kalau belum, app
 * tetap jalan penuh di atas adapter mock berbasis localStorage. SDK Firebase
 * di-import dinamis supaya tidak ikut ke bundle utama saat mode demo.
 */
export async function initAdapter(): Promise<DataAdapter> {
  if (instance) return instance

  if (hasFirebaseConfig()) {
    const { FirebaseAdapter } = await import('./firebase-adapter')
    instance = new FirebaseAdapter()
  } else {
    instance = new MockAdapter()
  }

  return instance
}

export function getAdapter(): DataAdapter {
  if (!instance) throw new Error('Data adapter belum diinisialisasi — panggil initAdapter() dulu.')
  return instance
}

export const isMockMode = () => getAdapter().kind === 'mock'

export * from './contract'
export { hasFirebaseConfig } from './config'
export { DEMO_ACCOUNTS } from './seed'
export { resetMockDatabase } from './mock-adapter'
