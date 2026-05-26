import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Shorts from './pages/Shorts'
import Home from './pages/Home'
import Category from './pages/Category'
import MomentPage from './pages/Moment'
import Admin from './pages/Admin'
import PixelCanvas from './pages/PixelCanvas'
import BottomNav from './components/BottomNav'

// ── Admin titkos URL ─────────────────────────────────────────────────────────
const ADMIN_PATH =
  (import.meta as { env?: Record<string, string> }).env?.VITE_ADMIN_PATH ?? '/pf-studio'

// ── Top header ────────────────────────────────────────────────────────────────
// Desktop: 3 menüpont (Főoldal, Shorts, Pixelart)
// Mobil: csak logó — a navigációt a BottomNav kezeli
function TopHeader() {
  const { pathname } = useLocation()

  const skipTopHeader =
    pathname === ADMIN_PATH ||
    pathname.startsWith('/category/') ||
    pathname.startsWith('/moment/')

  if (skipTopHeader) return null

  const isFeedPage = pathname === '/' || pathname === '/videos'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
      style={{
        background: isFeedPage
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)'
          : 'rgba(10,10,10,0.95)',
        backdropFilter: isFeedPage ? 'none' : 'blur(20px)',
        borderBottom: isFeedPage ? 'none' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex-shrink-0">
        <span className="text-lg font-black tracking-tight select-none">
          <span className="text-[#e50914]">PÉTER</span>
          <span className="text-white">FLIX</span>
        </span>
      </Link>

      {/* Desktop navigáció — 3 menüpont */}
      <nav className="hidden md:flex items-center gap-6 text-sm">
        <Link
          to="/"
          className={`transition-colors ${
            pathname === '/' ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
          }`}
        >
          📱 Shorts
        </Link>
        <Link
          to="/videos"
          className={`transition-colors ${
            pathname === '/videos' ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
          }`}
        >
          🎬 Videók
        </Link>
        <Link
          to="/pixel"
          className={`transition-colors ${
            pathname.startsWith('/pixel') ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
          }`}
        >
          🎨 Pixelart
        </Link>
      </nav>

      {/* Jobb oldali spacer (szimmetria) */}
      <div className="hidden md:block" style={{ width: 40 }} />
      {/* Mobilon nem kell — BottomNav kezeli */}
      <div className="md:hidden" style={{ width: 8 }} />
    </header>
  )
}

// ── Bottom nav wrapper ────────────────────────────────────────────────────────
function BottomNavWrapper() {
  const { pathname } = useLocation()
  if (pathname === ADMIN_PATH) return null
  return <BottomNav />
}

// ── Oldal fade-in wrapper ────────────────────────────────────────────────────
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  )
}

// ── Belső layout ─────────────────────────────────────────────────────────────
function AppLayout() {
  return (
    <div className="bg-black" style={{ minHeight: '100dvh' }}>
      <TopHeader />

      <Routes>
        {/* Főoldal — Shorts TikTok feed */}
        <Route path="/" element={<Shorts />} />

        {/* Videók — Netflix-stílusú, hosszú videók */}
        <Route path="/videos" element={<Home />} />

        {/* Pixelart */}
        <Route path="/pixel" element={
          <PageWrapper><PixelCanvas /></PageWrapper>
        } />

        {/* Kategória és pillanatnézet — saját Navbar-ral */}
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/moment/:id" element={<MomentPage />} />

        {/* Admin — titkos URL */}
        <Route path={ADMIN_PATH} element={<Admin />} />
      </Routes>

      <BottomNavWrapper />
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
