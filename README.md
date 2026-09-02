# Karya Tracker

Web app dua-portal (User Portal & Admin Dashboard) untuk mengumpulkan link karya, dengan
visualisasi konsistensi ala GitHub contribution graph.

Diimplementasikan dari `karya-tracker-prd.md` dengan bahasa visual `FINNOVA_Design_System.md`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit + vite build
npm run preview
npm run smoke    # smoke test Playwright terhadap `npm run preview` (port 4173)
```

Tanpa konfigurasi apa pun, app langsung jalan di **mode demo lokal**: data disimpan di
`localStorage` dengan seed 5 akun (2 admin, 3 kontributor) dan puluhan karya yang tersebar
di 60 hari terakhir — cukup untuk menguji heatmap, leaderboard, dan filter admin.

Akun demo:

| Peran | Email | Password |
|---|---|---|
| Admin | `yassar@karyatracker.test` | `password123` |
| Kontributor | `bagas@karyatracker.test` | `password123` |

Reset data demo ada di halaman **Profil & akun**.

## Beralih ke Firebase

Salin `.env.example` menjadi `.env`, isi keenam `VITE_FIREBASE_*`. Begitu keenamnya terisi,
`initAdapter()` memilih `FirebaseAdapter` (Auth + Firestore) dan SDK Firebase dimuat sebagai
chunk terpisah — di mode demo SDK itu tidak ikut diunduh sama sekali.

```bash
firebase emulators:start          # auth + firestore + functions lokal
firebase deploy --only firestore:rules,functions,hosting
```

## Arsitektur

```
src/
  app/          App shell, router, providers (QueryClient, Auth, ErrorBoundary, Toaster)
  components/
    ui/         Primitif: Button, Field/Input, Badge, Modal, Avatar, states
    shared/     ActivityCalendar, SubmissionCard, LeaderboardList, StatCard, AppShell
  features/
    auth/                 AuthProvider + useAuth
    submissions/          Query/mutation hooks + modal form create/edit
    admin-management/     Hooks invite admin
    notifications/        Indikator in-app untuk admin
  lib/
    data/       Data layer: contract.ts (interface + AppError), mock-adapter, firebase-adapter
    validators/ Skema Zod per entity
    dates.ts    Kalkulasi heatmap, streak, format tanggal
    selectors.ts Leaderboard & baris responden (turunan dari submissions)
  routes/       RequireAuth / RedirectIfAuthed
functions/      Cloud Functions: trigger submission, reminder harian, invite admin
```

### Data layer

Semua akses data lewat satu interface `DataAdapter` (`src/lib/data/contract.ts`) dengan dua
implementasi. Aturan izin PRD bagian 8 ditegakkan di **kedua** adapter, jadi perilaku UI
identik di mode demo maupun Firebase — termasuk larangan admin mengedit submission orang lain.

Otorisasi sebenarnya tetap di server: `firestore.rules`.

### Leaderboard

User biasa tidak boleh membaca submission milik orang lain, jadi ranking **tidak** dihitung
dari koleksi `submissions` di klien. `createSubmission`/`deleteSubmission` di
`firebase-adapter.ts` menaikkan/menurunkan agregat `totalKarya` di dokumen `users/{uid}`
langsung dari klien (di-*guard* `firestore.rules`: owner boleh ubah dokumennya sendiri, admin
boleh koreksi `totalKarya` user lain saat menghapus submission orang lain), dan itulah yang
dibaca `listLeaderboard()`. Sengaja **tidak** lewat Cloud Function supaya leaderboard tetap
jalan penuh di plan Spark (gratis) — lihat komentar di
`functions/src/triggers/on-submission-write.ts` kalau nanti mau mengaktifkan Blaze, supaya
tidak menambah balik logika yang sama di sana (double-count). Di mode demo, agregat yang sama
dihitung langsung dari seed.

Tie-break sesuai FR-06: total sama → yang lebih dulu mencapai total itu ada di atas.

### Kalender aktivitas

Biner sesuai keputusan PRD: satu hari aktif = satu warna, tanpa gradasi intensitas. Setiap sel
punya tooltip dan `aria-label` berisi tanggal + jumlah karya, jadi informasinya tidak hanya
bergantung pada warna (WCAG 2.2 AA).

## Cakupan PRD

Seluruh Must Have terimplementasi: auth (email/password + Google + reset), form submission,
kalender heatmap, histori card dengan tombol "See the Link", edit/hapus milik sendiri,
leaderboard (widget + halaman penuh), admin responden list dengan filter tanggal, detail
responden + moderasi hapus, multi-admin + invite, serta notifikasi (in-app untuk admin,
email lewat Cloud Functions). Should Have (empty state + loading skeleton) dan Could Have
(filter nama/asal di admin) juga masuk.

### Deviasi yang disengaja

| Item PRD | Yang dipakai | Alasan |
|---|---|---|
| Hugeicons Stroke Rounded | `lucide-react` | Design system FINNOVA §6 menyebut Lucide sebagai set yang sah; tersedia sebagai paket stabil. |
| Shadcn UI via CLI | Primitif tulis-tangan di atas Radix (`Dialog`, `Tooltip`) | Menghindari generator; API dan token stylingnya tetap setara dan seluruhnya memakai token FINNOVA. |
| TanStack Table | Tabel HTML biasa | Tabel responden hanya 4 kolom tanpa sorting/virtualisasi; satu dependensi lagi tidak terbayar. |
| Sentry | `console.error` di ErrorBoundary | Butuh DSN; titik pasangnya sudah ditandai di `src/app/providers.tsx`. |

### Belum dikerjakan

Suite test formal PRD bagian 10 belum lengkap. Yang ada: `scripts/smoke.mjs`, skrip Playwright
yang menjalankan alur end-to-end nyata di build produksi — login, buka form, validasi link tak
valid, submit sukses, leaderboard, login admin, filter tanggal, detail responden, admin
management, dan viewport mobile — sambil menggagalkan run kalau ada error console.

Yang belum: unit test Vitest untuk kalkulasi kalender & ranking, dan component test React Testing
Library untuk form Submit Karya & SubmissionCard. Fungsi murni untuk dua kalkulasi itu sudah
diisolasi di `src/lib/dates.ts` dan `src/lib/selectors.ts` supaya siap diuji.

Halaman terima-undangan (`/register?invite=...`) memakai callable `claimAdminInvite` yang sudah
ditulis di `functions/`, tapi belum ada layar khusus untuk menampilkan pesan "undangan
kedaluwarsa" di klien — di mode demo, role dinaikkan otomatis saat register dengan email
yang diundang.
