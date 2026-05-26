import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Moment } from '../types'
import { useLikes } from '../hooks/useLikes'

interface Props {
  moment: Moment
  onClose: () => void
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

const YT_CHANNEL = 'Magyar Péter Hivatalos'
const YT_CHANNEL_URL = 'https://www.youtube.com/@magyarPeter'

// ── Share gombok ──────────────────────────────────────────────────────────────
function ShareButtons({ moment }: { moment: Moment }) {
  const [copied, setCopied] = useState(false)

  const momentUrl  = `${window.location.origin}/moment/${moment.id}`
  const tweetText  = `„${moment.title}" — péterflix.hu #PéterFlix #MagyarPéter`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(momentUrl)}`

  async function copyLink() {
    await navigator.clipboard.writeText(momentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/8">
      <p className="text-gray-500 text-xs mb-2.5 uppercase tracking-wide font-medium">Megosztás</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-black border border-white/15 hover:border-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
        >
          <span className="font-black text-sm">𝕏</span> Tweet
        </a>
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
  const { liked, toggle: toggleLike } = useLikes(moment.id)
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
              {/* Cím + like */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-white text-lg sm:text-xl font-bold leading-tight flex-1 min-w-0 pr-2">
                  {moment.title}
                </h2>
                <motion.button
                  onClick={toggleLike}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    liked
                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                      : 'bg-white/8 border-white/15 text-gray-300 hover:border-white/30 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span>{liked ? '❤️' : '🤍'}</span>
                  <span>{liked ? 'Kedvelt' : 'Kedvelés'}</span>
                </motion.button>
              </div>

              {/* Meta: csatorna + alapadatok */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm">
                {/* Csatorna */}
                <a
                  href={YT_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#e50914] hover:text-red-400 transition-colors font-medium"
                >
                  <span className="text-xs">▶</span>
                  <span>{YT_CHANNEL}</span>
                </a>
                <span className="text-gray-700">·</span>
                <span className="text-gray-400">{moment.year}</span>
                {moment.duration > 0 && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-gray-400">{formatDuration(moment.duration)}</span>
                  </>
                )}
                {moment.category && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: moment.category.color + '22', color: moment.category.color }}
                    >
                      {moment.category.name}
                    </span>
                  </>
                )}
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
