import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { isLoggedIn, logout } from '../lib/api'
import SearchBar from './SearchBar'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLoggedIn(isLoggedIn())
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleLogout() {
    logout()
    setLoggedIn(false)
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-6 ${
          scrolled || menuOpen ? 'bg-[#0a0a0a]' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex-shrink-0" onClick={() => setMenuOpen(false)}>
          <span className="text-xl sm:text-2xl font-black text-[#e50914] tracking-tight">
            PÉTER<span className="text-white">FLIX</span>
          </span>
        </Link>

        {/* Desktop nav linkek — 3 menüpont */}
        <div className="hidden md:flex items-center gap-5 text-sm text-gray-300">
          <Link to="/" className="hover:text-white transition-colors">📱 Shorts</Link>
          <Link to="/videos" className="hover:text-white transition-colors">🎬 Videók</Link>
          <Link to="/pixel" className="hover:text-white transition-colors">🎨 Pixelart</Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search — desktop */}
        <div className="hidden sm:block">
          <SearchBar />
        </div>

        {/* Admin link — desktop */}
        <div className="hidden sm:flex items-center">
          {loggedIn ? (
            <div className="flex items-center gap-3 text-sm">
              <Link to="/admin" className="text-gray-300 hover:text-white transition-colors">Admin</Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
                Kilépés
              </button>
            </div>
          ) : (
            <Link to="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
              Bejelentkezés
            </Link>
          )}
        </div>

        {/* Hamburger — csak mobilon (category/moment oldalakon) */}
        <button
          className="sm:hidden flex flex-col gap-1.5 w-6 h-5 justify-center items-end ml-1"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Menü"
        >
          <motion.span
            className="block h-0.5 bg-white rounded"
            animate={{ width: '100%', rotate: menuOpen ? 45 : 0, y: menuOpen ? 8 : 0 }}
            style={{ width: '100%' }}
          />
          <motion.span
            className="block h-0.5 bg-white rounded"
            animate={{ opacity: menuOpen ? 0 : 1, width: '75%' }}
            style={{ width: '75%' }}
          />
          <motion.span
            className="block h-0.5 bg-white rounded"
            animate={{ width: '100%', rotate: menuOpen ? -45 : 0, y: menuOpen ? -8 : 0 }}
            style={{ width: '100%' }}
          />
        </button>
      </nav>

      {/* Mobile legördülő menü */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed top-[48px] left-0 right-0 z-40 bg-[#0a0a0a] border-t border-white/10 px-4 py-4 sm:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Keresés */}
            <div className="mb-4">
              <SearchBar />
            </div>

            {/* Linkek — 3 menüpont */}
            <nav className="flex flex-col gap-3 text-sm">
              {[
                { to: '/', label: '📱 Shorts' },
                { to: '/videos', label: '🎬 Videók' },
                { to: '/pixel', label: '🎨 Pixelart' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-200 hover:text-white py-1.5 border-b border-white/5 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Admin */}
              <div className="pt-2">
                {loggedIn ? (
                  <div className="flex gap-4">
                    <Link to="/admin" className="text-gray-400 hover:text-white transition-colors"
                      onClick={() => setMenuOpen(false)}>Admin</Link>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors">
                      Kilépés
                    </button>
                  </div>
                ) : (
                  <Link to="/admin" className="text-gray-500 hover:text-white transition-colors text-xs"
                    onClick={() => setMenuOpen(false)}>
                    Admin bejelentkezés
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
