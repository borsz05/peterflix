import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Moment } from '../types'
import MomentModal from './MomentModal'
import { useLikes } from '../hooks/useLikes'

interface Props {
  moment: Moment
  rank?: number          // trending számhoz
  rowFormat?: 'shorts' | 'regular'  // a sor domináns formátuma
}

// ── Shorts (portré 9:16) kártya ──────────────────────────────────────────────
function ShortsCard({ moment, onClick }: { moment: Moment; onClick: () => void; }) {
  const { liked, toggle } = useLikes(moment.id)
  const thumb = moment.thumbnailUrl ||
    `https://img.youtube.com/vi/${moment.youtubeId}/mqdefault.jpg`

  return (
    <motion.div
      className="relative flex-shrink-0 w-28 sm:w-32 cursor-pointer rounded-lg overflow-hidden group"
      style={{ aspectRatio: '9/16' }}
      whileHover={{ scale: 1.06, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {/* Thumbnail (középre vágva, portré) */}
      <img
        src={thumb}
        alt={moment.title}
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={e => {
          (e.target as HTMLImageElement).src =
            'https://placehold.co/128x228/1a1a1a/555?text=Shorts'
        }}
      />

      {/* Állandó alap-gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      {/* SHORTS badge */}
      <div className="absolute top-1.5 left-1.5 bg-[#e50914] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide">
        SHORTS
      </div>

      {/* Like gomb */}
      <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
        <motion.button
          className={`text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity ${liked ? 'opacity-100' : ''}`}
          onClick={e => { e.stopPropagation(); toggle() }}
          whileTap={{ scale: 0.8 }}
        >
          {liked ? '❤️' : '🤍'}
        </motion.button>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-black text-sm font-bold shadow-lg">
          ▶
        </div>
      </div>

      {/* Alsó szöveg */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{moment.title}</p>
      </div>
    </motion.div>
  )
}

// ── Regular (fekvő 16:9) kártya ──────────────────────────────────────────────
function RegularCard({ moment, rank, onClick }: { moment: Moment; rank?: number; onClick: () => void }) {
  const thumb = moment.thumbnailUrl ||
    `https://img.youtube.com/vi/${moment.youtubeId}/mqdefault.jpg`

  return (
    <motion.div
      className="relative flex-shrink-0 w-40 sm:w-48 md:w-52 cursor-pointer rounded overflow-hidden group"
      whileHover={{ scale: 1.08, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {/* Rank szám (trending) */}
      {rank !== undefined && (
        <div
          className="absolute -left-2 bottom-8 z-20 font-black text-gray-600 select-none"
          style={{ fontSize: '4rem', lineHeight: 1, WebkitTextStroke: '2px #333' }}
        >
          {rank}
        </div>
      )}

      {/* Thumbnail */}
      <img
        src={thumb}
        alt={moment.title}
        className="w-full h-[90px] sm:h-[100px] md:h-[116px] object-cover"
        onError={e => {
          (e.target as HTMLImageElement).src =
            'https://placehold.co/208x116/1a1a1a/555?text=PéterFlix'
        }}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
        <button className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center mb-1.5 text-xs font-bold hover:bg-gray-200">
          ▶
        </button>
        <p className="text-white text-xs font-semibold line-clamp-1">{moment.title}</p>
      </div>

    </motion.div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function MomentCard({ moment, rank, rowFormat }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  // Ha a sor domináns formátuma meg van adva, ahhoz alkalmazkodunk
  // Ha nincs, a videó saját platformját használjuk
  const effectiveFormat = rowFormat ?? moment.platform

  return (
    <>
      {effectiveFormat === 'shorts' ? (
        <ShortsCard moment={moment} onClick={() => setModalOpen(true)} />
      ) : (
        <RegularCard moment={moment} rank={rank} onClick={() => setModalOpen(true)} />
      )}

      {modalOpen && (
        <MomentModal moment={moment} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
