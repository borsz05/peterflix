import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Moment } from '../types'
import MomentModal from './MomentModal'

interface Props {
  moments: Moment[]  // top 10, már viralScore szerint rendezve
}

function TrendingCard({ moment, rank }: { moment: Moment; rank: number }) {
  const [modalOpen, setModalOpen] = useState(false)
  const thumb = moment.thumbnailUrl ||
    `https://img.youtube.com/vi/${moment.youtubeId}/mqdefault.jpg`

  // Rank szín: top 3 arany/ezüst/bronz, többi szürke
  const rankColor =
    rank === 1 ? '#FFD700' :
    rank === 2 ? '#C0C0C0' :
    rank === 3 ? '#CD7F32' :
    '#4b5563'

  return (
    <>
      <motion.div
        className="relative flex-shrink-0 flex items-end cursor-pointer group"
        style={{ width: moment.platform === 'shorts' ? '5.5rem' : '11rem' }}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        transition={{ duration: 0.2 }}
        onClick={() => setModalOpen(true)}
      >
        {/* Nagy rank szám a bal oldalon */}
        <div
          className="absolute -left-1 bottom-0 z-10 font-black select-none leading-none"
          style={{
            fontSize: rank <= 9 ? '5rem' : '4rem',
            color: 'transparent',
            WebkitTextStroke: `2px ${rankColor}`,
            opacity: rank <= 3 ? 1 : 0.6,
            bottom: '-4px',
            left: rank <= 9 ? '-14px' : '-18px',
          }}
        >
          {rank}
        </div>

        {/* Kártya kép */}
        <div
          className={`relative ml-6 rounded-lg overflow-hidden w-full ${
            moment.platform === 'shorts' ? '' : ''
          }`}
          style={{ aspectRatio: moment.platform === 'shorts' ? '9/16' : '16/9' }}
        >
          <img
            src={thumb}
            alt={moment.title}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/160x90/1a1a1a/555?text=PéterFlix'
            }}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-black font-bold shadow-lg text-sm">
              ▶
            </div>
          </div>

          {/* Alap info */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-white text-[10px] sm:text-xs font-semibold line-clamp-2 leading-tight">
              {moment.title}
            </p>
          </div>

          {/* Top 3 crown */}
          {rank <= 3 && (
            <div className="absolute top-1.5 right-1.5 text-base leading-none">
              {rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}
            </div>
          )}
        </div>
      </motion.div>

      {modalOpen && (
        <MomentModal moment={moment} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}

export default function TrendingRow({ moments }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!rowRef.current) return
    rowRef.current.scrollBy({ left: dir === 'right' ? 500 : -500, behavior: 'smooth' })
  }

  if (moments.length === 0) return null

  return (
    <section className="mb-8 sm:mb-10">
      {/* Fejléc */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 mb-3 sm:mb-4">
        <span className="text-xl sm:text-2xl">🔥</span>
        <h2 className="text-white font-black text-lg sm:text-xl">Legjobb pillanatok</h2>
        <span className="text-[#e50914] text-xs font-bold bg-[#e50914]/15 px-2 py-0.5 rounded-full ml-1">
          TOP {moments.length}
        </span>
      </div>

      {/* Sor */}
      <div className="relative group/row">
        {/* Bal chevron */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-[#0a0a0a] to-transparent
                     items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex"
        >
          <span className="text-white text-xl font-bold">‹</span>
        </button>

        <div
          ref={rowRef}
          className="flex items-end gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-8 pt-4 pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {moments.map((m, i) => (
            <TrendingCard key={m.id} moment={m} rank={i + 1} />
          ))}
        </div>

        {/* Jobb chevron */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent
                     items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex"
        >
          <span className="text-white text-xl font-bold">›</span>
        </button>
      </div>
    </section>
  )
}
