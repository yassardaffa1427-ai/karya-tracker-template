import type { AppUser } from '@/types'

/**
 * Admin utama — satu-satunya yang boleh menonaktifkan (menurunkan role) admin lain.
 * Permanen: tidak ada UI untuk memindahkan status ini ke akun lain (keputusan produk).
 * Dicek lewat email (bukan uid) supaya konsisten dan mudah diverifikasi di Firestore
 * Security Rules maupun di klien — lihat isPrimaryAdmin() di firestore.rules.
 */
export const PRIMARY_ADMIN_EMAIL = 'yassardaffa1427@gmail.com'

export function isPrimaryAdmin(user: Pick<AppUser, 'email'> | null | undefined): boolean {
  return (user?.email ?? '').trim().toLowerCase() === PRIMARY_ADMIN_EMAIL
}
