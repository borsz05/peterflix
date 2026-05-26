import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Moment } from '../types'

interface Props {
  moment: Moment
  onClose: () => void
}

const YT_CHANNEL = 'Magyar Péter Hivatalos'
const YT_CHANNEL_URL = 'https://www.youtube.com/@magyarPeter'

// ── Share gombok ──────────────────────────────────────────────────────────────
function ShareButtons({ moment }: { moment: Moment }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const momentUrl = `${window.location.origin}/moment/${moment.id}`
    await navigator.clipboard.writeText(momentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/8">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
        >
          {copied ? <><span>✓</span> Másolva!</> : <><span>🔗</span> Link másolása</>}
        </button>
        <a
          href={`https://www.youtube.com/watch?v=${moment.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#e50914]/15 hover:bg-[#e50914]/25 text-[#e50914] text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
        >
          <span>▶</span> YouTube
        </a>
      </div>
    </div>
  )
}

// ── Fő modal ──────────────────────────────────────────────────────────────────
export default function MomentModal({ moment, onClose }: Props) {
  const isShorts = moment.platform === 'shorts'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

        {/* Tartalom */}
        <div className="relative min-h-full flex items-start justify-center p-4 pt-20 pb-8">
          <motion.div
            className={`relative w-full bg-[#141414] rounded-2xl shadow-2xl ${
              isShorts ? 'max-w-sm' : 'max-w-2xl'
            }`}
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280, mass: 0.8 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Bezárás */}
            <motion.button
              onClick={onClose}
              className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white text-sm font-bold transition-colors shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Bezárás (Esc)"
            >
              ✕
            </motion.button>

            {/* Video player */}
            <div className="overflow-hidden rounded-t-2xl">
              {isShorts ? (
                <div className="flex justify-center bg-black">
                  <div
                    className="relative"
                    style={{
                      height: 'min(52vh, calc((100vw - 2rem) * 16 / 9))',
                      aspectRatio: '9 / 16',
                    }}
                  >
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${moment.youtubeId}?rel=0&autoplay=1`}
                      title={moment.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${moment.youtubeId}?rel=0&autoplay=1`}
                    title={moment.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="p-4 sm:p-5">
              {/* Cím */}
              <h2 className="text-white text-lg sm:text-xl font-bold leading-tight">
                {moment.title}
              </h2>

              {/* Csatorna */}
              <div className="mt-2">
                <a
                  href={YT_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#e50914] hover:text-red-400 transition-colors text-sm font-medium"
                >
                  <span className="text-xs">▶</span>
                  <span>{YT_CHANNEL}</span>
                </a>
              </div>

              {/* Share */}
              <ShareButtons moment={moment} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
