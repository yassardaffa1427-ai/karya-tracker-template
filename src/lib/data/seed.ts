import { addDays, formatISO, subDays } from 'date-fns'
import type { AdminInvite, AppUser, Submission } from '@/types'

export interface MockDatabase {
  users: AppUser[]
  passwords: Record<string, string>
  submissions: Submission[]
  invites: AdminInvite[]
}

const iso = (date: Date) => formatISO(date)

interface SeedPerson {
  id: string
  name: string
  email: string
  origin: string
  role: 'user' | 'admin'
  social: string
  /** Offset hari ke belakang tempat orang ini submit karya. */
  offsets: number[]
}

const PEOPLE: SeedPerson[] = [
  {
    id: 'user-yassar',
    name: 'Yassar Daffa',
    email: 'yassar@karyatracker.test',
    origin: 'SMK Telkom Malang',
    role: 'admin',
    social: 'https://instagram.com/yassar.dev',
    offsets: [0, 1, 2, 3, 6, 9, 14, 21],
  },
  {
    id: 'user-nadia',
    name: 'Nadia Rahmawati',
    email: 'nadia@karyatracker.test',
    origin: 'Universitas Brawijaya',
    role: 'admin',
    social: 'https://instagram.com/nadia.rw',
    offsets: [1, 4, 8, 15, 23, 31],
  },
  {
    id: 'user-bagas',
    name: 'Bagas Pratama',
    email: 'bagas@karyatracker.test',
    origin: 'SMAN 3 Surabaya',
    role: 'user',
    social: 'https://tiktok.com/@bagaspr',
    offsets: [0, 1, 2, 4, 5, 11, 18, 26, 39, 52],
  },
  {
    id: 'user-salsa',
    name: 'Salsabila Putri',
    email: 'salsa@karyatracker.test',
    origin: 'Politeknik Negeri Bandung',
    role: 'user',
    social: 'https://instagram.com/salsa.design',
    offsets: [2, 3, 7, 12, 19, 28, 44],
  },
  {
    id: 'user-reza',
    name: 'Reza Alfarizi',
    email: 'reza@karyatracker.test',
    origin: 'Universitas Indonesia',
    role: 'user',
    social: 'https://youtube.com/@rezaalfarizi',
    offsets: [5, 13, 20, 33, 47],
  },
]

const WORK_TITLES = [
  'poster-kampanye-literasi',
  'motion-graphic-opening',
  'artikel-riset-ai',
  'ilustrasi-digital-nusantara',
  'video-dokumenter-pendek',
  'ui-case-study-mobile',
  'fotografi-jalanan',
  'komik-strip-edukasi',
  'podcast-episode-kreatif',
  'zine-desain-lokal',
]

export function createSeedDatabase(now = new Date()): MockDatabase {
  const users: AppUser[] = []
  const submissions: Submission[] = []
  const passwords: Record<string, string> = {}

  PEOPLE.forEach((person, personIndex) => {
    users.push({
      id: person.id,
      name: person.name,
      email: person.email,
      authProvider: 'password',
      role: person.role,
      photoUrl: null,
      createdAt: iso(subDays(now, 70)),
    })
    passwords[person.email] = 'password123'

    person.offsets.forEach((offset, index) => {
      const createdAt = subDays(now, offset)
      createdAt.setHours(9 + ((personIndex + index) % 10), (index * 7) % 60, 0, 0)
      const slug = WORK_TITLES[(personIndex + index) % WORK_TITLES.length]
      submissions.push({
        id: `seed-${person.id}-${index}`,
        userId: person.id,
        name: person.name,
        origin: person.origin,
        socialAccountUrl: person.social,
        linkUrl: `https://behance.net/gallery/${1000 + personIndex * 37 + index}/${slug}`,
        createdAt: iso(createdAt),
        updatedAt: iso(createdAt),
      })
    })
  })

  const invites: AdminInvite[] = [
    {
      id: 'invite-seed-1',
      invitedEmail: 'kandidat.admin@karyatracker.test',
      invitedBy: 'user-yassar',
      invitedByName: 'Yassar Daffa',
      status: 'pending',
      createdAt: iso(subDays(now, 2)),
      expiresAt: iso(addDays(subDays(now, 2), 7)),
    },
    {
      id: 'invite-seed-2',
      invitedEmail: 'nadia@karyatracker.test',
      invitedBy: 'user-yassar',
      invitedByName: 'Yassar Daffa',
      status: 'accepted',
      createdAt: iso(subDays(now, 40)),
      expiresAt: iso(addDays(subDays(now, 40), 7)),
    },
    {
      id: 'invite-seed-3',
      invitedEmail: 'kadaluarsa@karyatracker.test',
      invitedBy: 'user-nadia',
      invitedByName: 'Nadia Rahmawati',
      status: 'expired',
      createdAt: iso(subDays(now, 30)),
      expiresAt: iso(subDays(now, 23)),
    },
  ]

  return { users, passwords, submissions, invites }
}

export const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'yassar@karyatracker.test', password: 'password123' },
  { label: 'Kontributor', email: 'bagas@karyatracker.test', password: 'password123' },
]
