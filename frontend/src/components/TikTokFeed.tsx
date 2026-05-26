import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Moment } from '../types'
import { useLikes } from '../hooks/useLikes'

// ── Egy videó slide ──────────────────────────────────────────────────────────
interface SlideProps {
  moment: Moment
  isActive: boolean
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

function VideoSlide({ moment, isActive, onNext, onPrev, isFirst, isLast }: SlideProps) {
  const { liked, toggle: toggleLike } = useLikes(moment.id)
  const thumbUrl     = `https://img.youtube.com/vi/${moment.youtubeId}/maxresdefault.jpg`
  const fallbackThumb = `https://img.youtube.com/vi/${moment.youtubeId}/hqdefault.jpg`
  const [imgSrc, setImgSrc]       = useState(thumbUrl)
  const [iframeReady, setIframeReady] = useState(false)
  const [shareMsg, setShareMsg]   = useState('')

  // iframe loading állapot reset, ha elhagyjuk a slide-ot
  useEffect(() => {
    if (!isActive) setIframeReady(false)
  }, [isActive])

  const isShorts   = moment.platform === 'shorts'
  const embedUrl   = `https://www.youtube.com/embed/${moment.youtubeId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`

  // iframe konténer méretezése: 9:16 Shorts vs 16:9 regular
  const iframeContainerStyle: React.CSSProperties = isShorts
    ? {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(100vw, calc(100dvh * 9 / 16))',
        height: '100%',
        zIndex: 10,
      }
    : {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100%',
        height: 'calc(100vw * 9 / 16)',
        zIndex: 10,
      }

  async function handleShare() {
    const url = `${window.location.origin}/moment/${moment.id}`
    if (navigator.share) {
      try { await navigator.share({ title: moment.title, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setShareMsg('Másolva!')
      setTimeout(() => setShareMsg(''), 2000)
    }
  }

  return (
    <div
      className="relative w-full flex-shrink-0 overflow-hidden bg-black"
      style={{ height: '100dvh', scrollSnapAlign: 'start' }}
    >
      {/* Háttér — elmosott thumbnail (mindig látható) */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{
          backgroundImage: `url(${imgSrc})`,
          filter: 'blur(20px) brightness(0.3)',
          zIndex: 0,
        }}
      />

      {/* Thumbnail — mutatva amíg az iframe nem töltött be */}
      <AnimatePresence>
        {(!isActive || !iframeReady) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 11 }}
          >
            <img
              src={imgSrc}
              alt={moment.title}
              onError={() => setImgSrc(fallbackThumb)}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube iframe — csak aktív slide-on */}
      {isActive && (
        <div style={iframeContainerStyle}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeReady(true)}
            style={{ border: 'none', display: 'block' }}
          />
        </div>
      )}

      {/* Alsó átmenet (szövegek olvashatósága) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none"
        style={{ zIndex: 20 }}
      />

      {/* Oldalsó akció gombok (jobb) */}
      <div
        className="absolute right-3 sm:right-4 bottom-[80px] flex flex-col gap-4 items-center"
        style={{ zIndex: 30 }}
      >
        {/* Like */}
        <motion.button
          onClick={toggleLike}
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.82 }}
        >
          <motion.div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-2xl shadow-lg transition-colors ${
              liked ? 'bg-red-500/50 border border-red-400' : 'bg-black/50 border border-white/20 backdrop-blur-sm'
            }`}
            animate={liked ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {liked ? '❤️' : '🤍'}
          </motion.div>
          <span className="text-white text-[11px] font-medium drop-shadow">
            {liked ? 'Kedvelt' : 'Like'}
          </span>
        </motion.button>

        {/* Megosztás */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <motion.div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-lg"
            whileTap={{ scale: 0.88 }}
          >
            {shareMsg ? '✓' : '🔗'}
          </motion.div>
          <span className="text-white text-[11px] font-medium drop-shadow">
            {shareMsg || 'Megosztás'}
          </span>
        </button>

        {/* YouTube-on nézd */}
        <a
          href={`https://www.youtube.com/watch?v=${moment.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1"
        >
          <motion.div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-700/70 border border-red-500 flex items-center justify-center text-sm shadow-lg"
            whileTap={{ scale: 0.88 }}
          >
            ▶
          </motion.div>
          <span className="text-white text-[11px] font-medium drop-shadow">YouTube</span>
        </a>
      </div>

      {/* Bal alsó — cím overlay */}
      <div
        className="absolute bottom-[72px] left-3 right-[72px] sm:left-4 sm:right-[76px] pr-2"
        style={{ zIndex: 30 }}
      >
        {/* Kategória badge */}
        {moment.category && (
          <div className="mb-2">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{
                background: moment.category.color + '30',
                color: moment.category.color,
                border: `1px solid ${moment.category.color}55`,
              }}
            >
              {moment.category.name}
            </span>
          </div>
        )}

        {/* Cím */}
        <h2 className="text-white font-black text-base sm:text-lg leading-snug drop-shadow-2xl line-clamp-2">
          {moment.title}
        </h2>
      </div>

      {/* Desktop nyíl gombok */}
      <AnimatePresence>
        {!isFirst && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 1, scale: 1.1 }}
            onClick={onPrev}
            className="absolute top-1/2 left-3 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 items-center justify-center text-white"
            style={{ zIndex: 30 }}
          >
            ↑
          </motion.button>
        )}
        {!isLast && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 1, scale: 1.1 }}
            onClick={onNext}
            className="absolute top-1/2 right-[72px] sm:right-[80px] md:right-3 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 items-center justify-center text-white"
            style={{ zIndex: 30 }}
          >
            ↓
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Fő feed ──────────────────────────────────────────────────────────────────
interface TikTokFeedProps {
  moments: Moment[]
}

export default function TikTokFeed({ moments }: TikTokFeedProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs    = useRef<(HTMLDivElement | null)[]>([])

  // IntersectionObserver — aktív slide tracking
  useEffect(() => {
    const slides    = slideRefs.current
    const observers: IntersectionObserver[] = []

    slides.forEach((slide, i) => {
      if (!slide) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setCurrentIdx(i)
          }
        },
        { threshold: 0.5 }
      )
      obs.observe(slide)
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [moments])

  // Navigáció
  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, moments.length - 1))
    slideRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' })
    setCurrentIdx(clamped)
  }, [moments.length])

  // Billentyűzet navigáció (desktop)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); goTo(currentIdx + 1) }
      if (e.key === 'ArrowUp'   || e.key === 'k') { e.preventDefault(); goTo(currentIdx - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIdx, goTo])

  if (moments.length === 0) {
    return (
      <div className="flex items-center justify-center bg-black" style={{ height: '100dvh' }}>
        <div className="text-gray-500 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg">Nincsenek videók</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Feed konténer */}
      <div
        ref={containerRef}
        className="w-full overflow-y-scroll"
        style={{
          height: '100dvh',
          scrollSnapType: 'y mandatory',
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {moments.map((moment, i) => (
          <div
            key={moment.id}
            ref={el => { slideRefs.current[i] = el }}
          >
            <VideoSlide
              moment={moment}
              isActive={i === currentIdx}
              isFirst={i === 0}
              isLast={i === moments.length - 1}
              onNext={() => goTo(i + 1)}
              onPrev={() => goTo(i - 1)}
            />
          </div>
        ))}

        {/* Vége üzenet */}
        <div
          className="flex items-center justify-center bg-black"
          style={{ height: '100dvh', scrollSnapAlign: 'start' }}
        >
          <div className="text-center text-gray-600">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-lg font-medium">Minden videót láttál!</p>
            <button
              onClick={() => goTo(0)}
              className="mt-4 text-[#e50914] text-sm font-semibold hover:underline"
            >
              Vissza az elejére ↑
            </button>
          </div>
        </div>
      </div>

      {/* Jobb oldali haladásjelző (desktop) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-1.5 z-30">
        {moments.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIdx
                ? 'w-2 h-6 bg-white'
                : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </>
  )
}
