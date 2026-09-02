import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:4173'
const OUT = process.env.OUT ?? '.'

const errors = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })

page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`)
})

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log(`  shot -> ${name}.png`)
}

async function login(email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByLabel('Email', { exact: false }).first().fill(email)
  await page.getByLabel('Password', { exact: false }).first().fill('password123')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
}

console.log('1. login page')
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Masuk', { timeout: 10000 })
await shot('01-login')

console.log('2. login as contributor')
await login('bagas@karyatracker.test')
await page.waitForURL(`${BASE}/`, { timeout: 10000 })
await page.waitForSelector('text=Kalender aktivitas', { timeout: 10000 })
await page.waitForTimeout(800)
await shot('02-user-dashboard')

const totalKarya = await page.locator('article', { hasText: 'Total karya' }).first().innerText()
console.log('  stat:', totalKarya.replace(/\n/g, ' | '))

console.log('3. open submit modal via nav')
await page.getByRole('link', { name: 'Submit Karya' }).first().click()
await page.waitForSelector('text=Kirim karya', { timeout: 5000 })
await shot('03-submit-modal')

console.log('4. validation on empty link')
await page.getByRole('textbox', { name: /Link URL karya/ }).fill('asalasal')
await page.getByRole('button', { name: 'Kirim karya' }).click()
await page.waitForSelector('text=Format link tidak valid', { timeout: 5000 })
console.log('  validation message shown')

console.log('5. successful submit')
await page.getByRole('textbox', { name: /Asal/ }).fill('SMAN 3 Surabaya')
await page.getByRole('textbox', { name: /Akun sosmed/ }).fill('https://instagram.com/bagaspr')
await page.getByRole('textbox', { name: /Link URL karya/ }).fill('https://behance.net/gallery/999/uji-coba')
await page.getByRole('button', { name: 'Kirim karya' }).click()
await page.waitForSelector('text=Karya tersimpan', { timeout: 8000 })
await page.waitForTimeout(1200)
const after = await page.locator('article', { hasText: 'Total karya' }).first().innerText()
console.log('  after submit:', after.replace(/\n/g, ' | '))
await shot('04-after-submit')

console.log('6. leaderboard')
await page.getByRole('link', { name: 'Leaderboard' }).first().click()
await page.waitForSelector('text=Peringkat lengkap', { timeout: 8000 })
await page.waitForTimeout(600)
await shot('05-leaderboard')

console.log('7. logout + login as admin')
await page.goto(`${BASE}/profil`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Keluar dari akun/ }).click()
await page.waitForURL(`${BASE}/login`, { timeout: 8000 })
await login('yassar@karyatracker.test')
await page.waitForURL(`${BASE}/admin`, { timeout: 10000 })
await page.waitForSelector('text=Responden', { timeout: 8000 })
await page.waitForTimeout(900)
await shot('06-admin-responden')

const rows = await page.locator('tbody tr').count()
console.log('  responden rows:', rows)

console.log('8. date filter')
await page.getByRole('button', { name: '7 hari' }).click()
await page.waitForTimeout(700)
const rows7 = await page.locator('tbody tr').count()
console.log('  rows after 7-day filter:', rows7)
await shot('07-admin-filter')

console.log('9. detail responden')
await page.getByRole('button', { name: 'Semua' }).click()
await page.waitForTimeout(400)
await page.locator('tbody tr').first().click()
await page.waitForURL(/\/admin\/responden\//, { timeout: 8000 })
await page.waitForSelector('text=Histori submission', { timeout: 8000 })
await page.waitForTimeout(900)
await shot('08-admin-detail')

console.log('10. admin management')
await page.getByRole('link', { name: 'Admin', exact: true }).first().click()
await page.waitForSelector('text=Admin aktif', { timeout: 8000 })
await page.waitForTimeout(700)
await shot('09-admin-management')

console.log('11. mobile viewport')
await page.setViewportSize({ width: 390, height: 844 })
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await shot('10-mobile-admin')

await browser.close()

console.log('\n--- console/page errors ---')
console.log(errors.length ? errors.join('\n') : 'none')
process.exit(errors.length ? 1 : 0)
