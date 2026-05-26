import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Moment } from '../types'
import MomentModal from './MomentModal'

interface Props {
  moment: Moment
}

export default function Hero({ moment }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const thumb = moment.thumbnailUrl ||
    `https://img.youtube.com/vi/${moment.youtubeId}/maxresdefault.jpg`

  return (
    <>
      <div className="relative w-full h-[70vh] min-h-[460px] flex items-end overflow-hidden">
        {/* Background image */}
        <img
          src={thumb}
          alt={moment.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => {
            (e.target as HTMLImageElement).src =
              `https://img.youtube.com/vi/${moment.youtubeId}/hqdefault.jpg`
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

        {/* Content */}
        <motion.div
          className="relative z-10 px-8 pb-16 max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="inline-block text-xs font-bold px-2 py-1 rounded mb-3"
            style={{ background: moment.category?.color ?? '#e50914', color: '#fff' }}
          >
            {moment.category?.name ?? 'Kiemelt pillanat'}
          </div>

          <h1 className="text-white text-4xl md:text-5xl font-black leading-tight mb-3">
            {moment.title}
          </h1>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-5 line-clamp-3">
            {moment.description}
          </p>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-400 text-sm">▶ Magyar Péter Hivatalos</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400 text-sm">{moment.year}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded hover:bg-gray-200 transition-colors"
            >
              <span>▶</span> Lejátszás
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-white/20 text-white font-bold px-6 py-2.5 rounded hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <span>ℹ</span> Részletek
            </button>
          </div>
        </motion.div>
      </div>

      {modalOpen && (
        <MomentModal moment={moment} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
