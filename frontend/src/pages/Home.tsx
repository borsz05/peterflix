import { useMoments, useCategories } from '../hooks/useMoments'
import Hero from '../components/Hero'
import MomentRow from '../components/MomentRow'
import LegalFooter from '../components/LegalFooter'
import { motion } from 'framer-motion'

export default function Home() {
  const { moments, loading } = useMoments()
  const { categories } = useCategories()

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-[#0a0a0a]"
        style={{ height: '100dvh' }}
      >
        <div className="text-center">
          <motion.div
            className="text-[#e50914] text-4xl font-black mb-4 tracking-tight"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            PÉTER<span className="text-white">FLIX</span>
          </motion.div>
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#e50914]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Csak a hosszú (regular) videók
  const regular = moments.filter(m => m.platform !== 'shorts')

  // Hero: az első isHero jelölt, vagy a legjobb viral score-ú
  const heroMoment =
    regular.find(m => m.isHero) ??
    [...regular].sort((a, b) => b.viralScore - a.viralScore)[0]

  // Kategóriánként csoportosítás
  const grouped = categories
    .map(cat => ({
      category: cat,
      moments: regular.filter(m => m.category?.id === cat.id),
    }))
    .filter(g => g.moments.length > 0)

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      {/* Hero — TopHeader (fixed 56px) fölé nyúlik */}
      {heroMoment && (
        <Hero moment={heroMoment} />
      )}

      {/* Kategória sorok */}
      <div className="pb-20 md:pb-10">
        {grouped.map(g => (
          <MomentRow
            key={g.category.id}
            title={g.category.name}
            moments={g.moments}
            accentColor={g.category.color}
            forceFormat="regular"
          />
        ))}

        {grouped.length === 0 && (
          <div className="text-gray-500 text-center py-24">
            <div className="text-5xl mb-4">📭</div>
            <p>Még nincsenek videók.</p>
          </div>
        )}
      </div>

      <LegalFooter />
    </div>
  )
}
