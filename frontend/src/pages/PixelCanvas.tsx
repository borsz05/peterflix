import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { isLoggedIn } from '../lib/api'
import api from '../lib/api'
import { usePixelSocket } from '../hooks/usePixelSocket'

// ── Konstansok ────────────────────────────────────────────────────────────────
const BOARD_SIZE    = 100
const BASE_PX       = 8
const COOLDOWN_MS   = 10_000
const COOLDOWN_KEY  = 'peterflix_pixel_cooldown'
const DEFAULT_COLOR = '#141414'

const PALETTE = [
  '#ffffff', '#e50914', '#ff6b35', '#ffd700',
  '#4ade80', '#22d3ee', '#3b82f6', '#a855f7',
  '#ec4899', '#f97316', '#000000', '#6b7280',
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function sparseToArray(sparse: Record<string, string>): string[] {
  const arr = new Array<string>(BOARD_SIZE * BOARD_SIZE).fill(DEFAULT_COLOR)
  for (const [key, color] of Object.entries(sparse)) {
    const [xs, ys] = key.split(',')
    const x = parseInt(xs), y = parseInt(ys)
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE)
      arr[y * BOARD_SIZE + x] = color
  }
  return arr
}

// ── Fő oldal ──────────────────────────────────────────────────────────────────
export default function PixelCanvas() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const pixelsRef  = useRef<string[]>(new Array(BOARD_SIZE * BOARD_SIZE).fill(DEFAULT_COLOR))

  const [loaded,        setLoaded]        = useState(false)
  const [selectedColor, setSelectedColor] = useState('#e50914')
  const [zoom,          setZoom]          = useState(1)
  const [hoverCoord,    setHoverCoord]    = useState<{ x: number; y: number } | null>(null)
  const [cooldownLeft,  setCooldownLeft]  = useState(0)
  const [drawTick,      setDrawTick]      = useState(0)   // canvas újrarajzolás trigger
  const [justPlaced,    setJustPlaced]    = useState(false)
  const [wsStatus,      setWsStatus]      = useState<'connected' | 'disconnected'>('disconnected')
  const adminLoggedIn = isLoggedIn()

  // Ref-ek a touch handler stale closure elkerüléséhez
  const zoomRef          = useRef(zoom)
  const cooldownLeftRef  = useRef(cooldownLeft)
  const selectedColorRef = useRef(selectedColor)
  useEffect(() => { zoomRef.current = zoom },           [zoom])
  useEffect(() => { cooldownLeftRef.current = cooldownLeft }, [cooldownLeft])
  useEffect(() => { selectedColorRef.current = selectedColor }, [selectedColor])

  const pixelSize = BASE_PX * zoom

  // ── Canvas kirajzolás ──────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = BOARD_SIZE * pixelSize
    canvas.width  = W
    canvas.height = W

    const px = pixelsRef.current
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        ctx.fillStyle = px[y * BOARD_SIZE + x]
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
      }
    }

    if (zoom >= 2) {
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= BOARD_SIZE; i++) {
        ctx.moveTo(i * pixelSize, 0);   ctx.lineTo(i * pixelSize, W)
        ctx.moveTo(0, i * pixelSize);   ctx.lineTo(W, i * pixelSize)
      }
      ctx.stroke()
    }
  }, [pixelSize, zoom])

  useEffect(() => { drawCanvas() }, [drawCanvas, drawTick])

  // ── Board betöltése ────────────────────────────────────────────────────────
  const fetchBoard = useCallback(async () => {
    try {
      const res = await api.get<{ pixels: Record<string, string> }>('/pixelboard')
      pixelsRef.current = sparseToArray(res.data.pixels)
      setDrawTick(t => t + 1)
    } catch {}
  }, [])

  useEffect(() => {
    fetchBoard().finally(() => setLoaded(true))
  }, [fetchBoard])

  // ── WebSocket – valós idejű szinkron ──────────────────────────────────────
  usePixelSocket({
    onPixel: ({ x, y, color }) => {
      const newPx = [...pixelsRef.current]
      newPx[y * BOARD_SIZE + x] = color
      pixelsRef.current = newPx
      setDrawTick(t => t + 1)
    },
    onReset: () => {
      pixelsRef.current = new Array(BOARD_SIZE * BOARD_SIZE).fill(DEFAULT_COLOR)
      setDrawTick(t => t + 1)
    },
    onStatus: setWsStatus,
  })

  // ── Cooldown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0')
      setCooldownLeft(Math.max(0, COOLDOWN_MS - (Date.now() - last)))
    }
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [])

  // ── Koordináta számítás ────────────────────────────────────────────────────
  function getCoord(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const ps   = BASE_PX * zoomRef.current
    return {
      x: Math.max(0, Math.min(BOARD_SIZE - 1, Math.floor((clientX - rect.left) / ps))),
      y: Math.max(0, Math.min(BOARD_SIZE - 1, Math.floor((clientY - rect.top)  / ps))),
    }
  }

  // ── Pixel lehelyezés ───────────────────────────────────────────────────────
  async function placePixel(x: number, y: number, color: string) {
    const idx = y * BOARD_SIZE + x
    if (pixelsRef.current[idx] === color) return

    const newPx = [...pixelsRef.current]
    newPx[idx]  = color
    pixelsRef.current = newPx
    setDrawTick(t => t + 1)

    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
    setCooldownLeft(COOLDOWN_MS)
    setJustPlaced(true)
    setTimeout(() => setJustPlaced(false), 600)

    try { await api.post('/pixelboard/pixel', { x, y, color }) } catch {}
  }

  // ── Mouse events ───────────────────────────────────────────────────────────
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    setHoverCoord(getCoord(e.clientX, e.clientY))
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (cooldownLeftRef.current > 0) return
    const { x, y } = getCoord(e.clientX, e.clientY)
    placePixel(x, y, selectedColorRef.current)
  }

  // ── Touch events — pinch zoom + tap ───────────────────────────────────────
  const pinchRef    = useRef<{ dist: number; startZoom: number } | null>(null)
  const wasPinchRef = useRef(false)

  function pinchDist(t: React.TouchList) {
    return Math.hypot(
      t[1].clientX - t[0].clientX,
      t[1].clientY - t[0].clientY,
    )
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length === 2) {
      wasPinchRef.current = true
      pinchRef.current    = { dist: pinchDist(e.touches), startZoom: zoomRef.current }
    } else {
      wasPinchRef.current = false
      pinchRef.current    = null
    }
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()   // megakadályozza a böngésző zoom/scroll-ját
    if (e.touches.length === 2 && pinchRef.current) {
      const ratio    = pinchDist(e.touches) / pinchRef.current.dist
      const newZoom  = Math.max(1, Math.min(4, Math.round(pinchRef.current.startZoom * ratio)))
      if (newZoom !== zoomRef.current) setZoom(newZoom)
    }
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length < 2) pinchRef.current = null

    // Csak sima tap esetén helyezünk pixelt
    if (!wasPinchRef.current && e.changedTouches.length === 1 && cooldownLeftRef.current === 0) {
      const t       = e.changedTouches[0]
      const { x, y } = getCoord(t.clientX, t.clientY)
      placePixel(x, y, selectedColorRef.current)
    }
  }

  // ── Admin reset ────────────────────────────────────────────────────────────
  async function handleReset() {
    if (!window.confirm('Törlöd a teljes vásznat?')) return
    try { await api.delete('/pixelboard') } catch {}
  }

  const canPlace     = cooldownLeft === 0
  const cooldownSecs = Math.ceil(cooldownLeft / 1000)
  const pct          = ((COOLDOWN_MS - cooldownLeft) / COOLDOWN_MS) * 100

  // ── Paletta renderelés (mobil és desktop közösen) ─────────────────────────
  function PaletteGrid({ fullWidth }: { fullWidth?: boolean }) {
    return (
      <div className={`grid gap-1.5 ${fullWidth ? 'grid-cols-[repeat(13,1fr)]' : 'grid-cols-4'}`}>
        {PALETTE.map(color => (
          <motion.button
            key={color}
            onClick={() => setSelectedColor(color)}
            className="rounded-full border-2 aspect-square"
            style={{
              background:   color,
              borderColor:  selectedColor === color ? '#fff' : 'rgba(255,255,255,0.12)',
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            title={color}
          />
        ))}
        {/* Egyéni szín */}
        <label className="relative cursor-pointer aspect-square" title="Egyéni szín">
          <input
            type="color"
            value={selectedColor}
            onChange={e => setSelectedColor(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
          <motion.div
            className="w-full h-full rounded-full border-2 flex items-center justify-center text-[10px] text-white/60 font-bold"
            style={{
              background:  PALETTE.includes(selectedColor) ? '#2a2a2a' : selectedColor,
              borderColor: !PALETTE.includes(selectedColor) ? '#fff' : 'rgba(255,255,255,0.12)',
            }}
            whileHover={{ scale: 1.2 }}
          >
            ✏
          </motion.div>
        </label>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="pt-14 px-3 sm:px-4 pb-6">

        {/* Fejléc */}
        <div className="mb-3 mt-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            🎨 Pixel<span className="text-[#e50914]">Csata</span>
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Közösségi vászon · {BOARD_SIZE}×{BOARD_SIZE} · valós idejű szinkron
          </p>
        </div>

        {/* ════════════════ MOBIL layout (md alatt) ════════════════ */}
        <div className="md:hidden flex flex-col gap-3">

          {/* Sor 1: státusz + cooldown + zoom + koordináta */}
          <div className="flex flex-wrap items-center gap-2">

            {/* WS státusz */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              wsStatus === 'connected'
                ? 'text-green-400 border-green-500/25 bg-green-500/8'
                : 'text-gray-500 border-white/10'
            }`}>
              {wsStatus === 'connected' ? '🟢 Élő' : '⚪ Offline'}
            </span>

            {/* Cooldown */}
            <motion.span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                canPlace
                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                  : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
              }`}
              animate={justPlaced ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {canPlace ? '✓ Rajzolhatsz!' : `⏳ ${cooldownSecs}mp`}
            </motion.span>

            {/* Zoom */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setZoom(z => Math.max(1, z - 1))}
                disabled={zoom <= 1}
                className="w-7 h-7 rounded bg-white/8 hover:bg-white/15 text-white text-base font-bold transition-colors disabled:opacity-25"
              >−</button>
              <span className="text-gray-300 text-xs font-mono w-6 text-center">{zoom}×</span>
              <button
                onClick={() => setZoom(z => Math.min(4, z + 1))}
                disabled={zoom >= 4}
                className="w-7 h-7 rounded bg-white/8 hover:bg-white/15 text-white text-base font-bold transition-colors disabled:opacity-25"
              >+</button>
            </div>

            {/* Koordináta */}
            {hoverCoord && (
              <span className="text-gray-500 text-[10px] font-mono">
                X:{hoverCoord.x} Y:{hoverCoord.y}
              </span>
            )}
          </div>

          {/* Aktuális szín */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ background: selectedColor }} />
            <span className="text-gray-400 text-xs font-mono">{selectedColor}</span>
          </div>

          {/* Sor 2: paletta — teljes szélességben, 13 oszlop */}
          <PaletteGrid fullWidth />

          {/* Progress bar */}
          {cooldownLeft > 0 && (
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden -mt-1">
              <div className="h-full bg-yellow-400 rounded-full transition-[width]" style={{ width: `${pct}%` }} />
            </div>
          )}

          {/* Canvas — teljes szélességben, pinch zoomolható */}
          <div
            className="overflow-auto rounded-xl border border-white/8 bg-[#0d0d0d] w-full"
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            {!loaded ? (
              <div
                className="flex items-center justify-center text-gray-600 text-sm"
                style={{ width: BOARD_SIZE * pixelSize, height: BOARD_SIZE * pixelSize }}
              >
                ⏳ Betöltés…
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverCoord(null)}
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  display: 'block',
                  cursor: canPlace ? 'crosshair' : 'not-allowed',
                  touchAction: 'none',
                  imageRendering: 'pixelated',
                }}
              />
            )}
          </div>

          {adminLoggedIn && (
            <button
              onClick={handleReset}
              className="text-xs text-red-400 border border-red-500/25 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors w-full"
            >
              🗑 Vászon törlése (admin)
            </button>
          )}
        </div>

        {/* ════════════════ DESKTOP layout (md+) ════════════════ */}
        {/*
          Canvas és sidebar egymás mellett.
          A flex wrapper w-fit, hogy ne legyen felesleges üres hely.
          Ha a canvas nagyobb mint a viewport, a canvas-wrapper scroll-ozható.
        */}
        <div className="hidden md:flex gap-5 items-start w-fit">

          {/* Canvas konténer */}
          <div
            className="overflow-auto rounded-xl border border-white/8 bg-[#0d0d0d] flex-shrink-0"
            style={{ maxHeight: 'calc(100vh - 180px)', maxWidth: 'calc(100vw - 260px)' }}
          >
            {!loaded ? (
              <div
                className="flex items-center justify-center text-gray-600 text-sm"
                style={{ width: BOARD_SIZE * pixelSize, height: BOARD_SIZE * pixelSize }}
              >
                ⏳ Betöltés…
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverCoord(null)}
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  display: 'block',
                  cursor: canPlace ? 'crosshair' : 'not-allowed',
                  touchAction: 'none',
                  imageRendering: 'pixelated',
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-3 w-[200px] flex-shrink-0">

            {/* WS státusz */}
            <div className={`text-xs px-2.5 py-1.5 rounded-full text-center border font-medium ${
              wsStatus === 'connected'
                ? 'text-green-400 border-green-500/25 bg-green-500/8'
                : 'text-gray-500 border-white/10'
            }`}>
              {wsStatus === 'connected' ? '🟢 Valós idejű szinkron' : '⚪ Csatlakozás…'}
            </div>

            {/* Cooldown */}
            <div>
              <motion.div
                className={`px-3 py-2 rounded-xl text-sm font-semibold border text-center ${
                  canPlace
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                }`}
                animate={justPlaced ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {canPlace ? '✓ Rajzolhatsz!' : `⏳ ${cooldownSecs}mp`}
              </motion.div>
              {cooldownLeft > 0 && (
                <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-[width]" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>

            {/* Szín preview */}
            <div>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Szín</p>
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-2 border border-white/8">
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: selectedColor }} />
                <span className="text-gray-400 text-xs font-mono">{selectedColor}</span>
              </div>
            </div>

            {/* Paletta (4 oszlop, sidebar) */}
            <div>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Paletta</p>
              <PaletteGrid />
            </div>

            {/* Zoom */}
            <div>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Zoom</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(z => Math.max(1, z - 1))}
                  disabled={zoom <= 1}
                  className="w-8 h-8 rounded bg-white/8 hover:bg-white/15 text-white flex items-center justify-center font-bold text-lg transition-colors disabled:opacity-25"
                >−</button>
                <span className="text-gray-300 text-sm font-mono flex-1 text-center">{zoom}×</span>
                <button
                  onClick={() => setZoom(z => Math.min(4, z + 1))}
                  disabled={zoom >= 4}
                  className="w-8 h-8 rounded bg-white/8 hover:bg-white/15 text-white flex items-center justify-center font-bold text-lg transition-colors disabled:opacity-25"
                >+</button>
              </div>
            </div>

            {/* Koordináta */}
            <div className="bg-white/5 rounded-lg px-2.5 py-2 border border-white/8 text-xs font-mono text-gray-500 min-h-[34px]">
              {hoverCoord
                ? <><span className="text-gray-300">X:</span> {hoverCoord.x}  <span className="text-gray-300">Y:</span> {hoverCoord.y}</>
                : <span className="text-gray-700">Vidd a kurzort…</span>
              }
            </div>

            {adminLoggedIn && (
              <button
                onClick={handleReset}
                className="text-xs text-red-400 border border-red-500/25 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors text-center"
              >
                🗑 Vászon törlése
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
