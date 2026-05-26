// prisma/add-regulars.ts
// Biztonságos produkciós script — csak a regular (hosszú) videókat cseréli.
// A shorts és a kategóriák érintetlenek maradnak.
//
// Futtasd:  npx tsx prisma/add-regulars.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Kategóriák lekérése (slug alapján — biztonságos)
  const cats = await prisma.category.findMany()
  const bySlug = Object.fromEntries(cats.map(c => [c.slug, c.id]))

  if (cats.length === 0) {
    console.error('❌ Nincsenek kategóriák az adatbázisban. Futtasd előbb a seed-et.')
    process.exit(1)
  }

  console.log(`📁 Kategóriák: ${cats.map(c => c.slug).join(', ')}`)

  // Meglévő regular videók törlése (csak platform='regular')
  const deleted = await prisma.moment.deleteMany({ where: { platform: 'regular' } })
  console.log(`🗑  ${deleted.count} korábbi regular videó törölve`)

  // Az 5 új hosszú videó
  const regulars = [
    {
      title: 'Első paritános',
      description: '',
      youtubeId: '8cJulnczg2E',
      platform: 'regular' as const,
      duration: 1800, year: 2025, viralScore: 88, viewCount: 0, isHero: true,
      tags: ['paritás', 'politika'],
      categoryId: bySlug['nagy-pillanatok'],
    },
    {
      title: 'Tamburazenekar',
      description: '',
      youtubeId: 'g_PkVzi5zLY',
      platform: 'regular' as const,
      duration: 1200, year: 2025, viralScore: 85, viewCount: 0, isHero: false,
      tags: ['zene', 'kultúra', 'vicces'],
      categoryId: bySlug['abszolut-filmszinhaz'],
    },
    {
      title: 'Első miniszterelnöki interjú',
      description: '',
      youtubeId: 'inhHAcQvQGo',
      platform: 'regular' as const,
      duration: 3600, year: 2026, viralScore: 95, viewCount: 0, isHero: false,
      tags: ['interjú', 'miniszterelnök', 'ikonikus'],
      categoryId: bySlug['nagy-pillanatok'],
    },
    {
      title: 'Gdanski túra',
      description: '',
      youtubeId: 'wu6FzXsSUz4',
      platform: 'regular' as const,
      duration: 2400, year: 2025, viralScore: 82, viewCount: 0, isHero: false,
      tags: ['gdansk', 'lengyelország', 'diplomácia'],
      categoryId: bySlug['brusszel-diplomacia'],
    },
    {
      title: 'Belügyipalota',
      description: '',
      youtubeId: 'Hql0QnwXNtc',
      platform: 'regular' as const,
      duration: 2100, year: 2026, viralScore: 90, viewCount: 0, isHero: false,
      tags: ['belügy', 'palota', 'átvétel'],
      categoryId: bySlug['nagy-pillanatok'],
    },
    {
      title: 'Puritán európai minisztérium',
      description: '',
      youtubeId: '21p4cIfEdaU',
      platform: 'regular' as const,
      duration: 1500, year: 2026, viralScore: 87, viewCount: 0, isHero: false,
      tags: ['minisztérium', 'puritán', 'európa', 'brüsszel'],
      categoryId: bySlug['brusszel-diplomacia'],
    },
    {
      title: 'Az elvek',
      description: '',
      youtubeId: 'wJOuH8U4w9Q',
      platform: 'regular' as const,
      duration: 2700, year: 2025, viralScore: 91, viewCount: 0, isHero: false,
      tags: ['elvek', 'politika', 'program'],
      categoryId: bySlug['abszolut-filmszinhaz'],
    },
    {
      title: 'Telexes interjú',
      description: '',
      youtubeId: 'W1lwsxFuBgg',
      platform: 'regular' as const,
      duration: 3000, year: 2025, viralScore: 89, viewCount: 0, isHero: false,
      tags: ['telex', 'interjú', 'sajtó'],
      categoryId: bySlug['abszolut-filmszinhaz'],
    },
  ]

  for (const m of regulars) {
    if (!m.categoryId) {
      console.warn(`⚠ Kategória nem található, kihagyva: ${m.title}`)
      continue
    }
    await prisma.moment.create({ data: m })
    console.log(`✅ ${m.title}`)
  }

  console.log(`\n🎬 ${regulars.length} hosszú videó hozzáadva!`)
  console.log('📱 Shorts érintetlenek.')
}

main()
  .catch(e => { console.error('❌ Hiba:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
