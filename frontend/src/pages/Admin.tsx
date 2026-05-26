import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { login, isLoggedIn, getMoments, createMoment, updateMoment, deleteMoment } from '../lib/api'
import { useCategories } from '../hooks/useMoments'
import type { Moment } from '../types'

// ── Login form ──────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      onLogin()
    } catch {
      setError('Hibás e-mail cím vagy jelszó.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#141414] rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-2xl font-black text-[#e50914]">PÉTER<span className="text-white">FLIX</span></span>
          <p className="text-gray-400 text-sm mt-1">Admin bejelentkezés</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#333] text-white rounded px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            required
          />
          <input
            type="password"
            placeholder="Jelszó"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#333] text-white rounded px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e50914] text-white font-bold py-2.5 rounded hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Bejelentkezés…' : 'Bejelentkezés'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Inline szerkeszthető sor ────────────────────────────────────────────────

function MomentRow({
  moment,
  onUpdate,
  onDelete,
}: {
  moment: Moment
  onUpdate: (id: string, updated: Moment) => void
  onDelete: (id: string) => void
}) {
  const [editingField, setEditingField] = useState<'title' | 'youtubeId' | null>(null)
  const [titleVal, setTitleVal]         = useState(moment.title)
  const [ytIdVal, setYtIdVal]           = useState(moment.youtubeId)
  const [saving, setSaving]             = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingField) inputRef.current?.focus()
  }, [editingField])

  async function save(field: 'title' | 'youtubeId') {
    const val = field === 'title' ? titleVal.trim() : ytIdVal.trim()
    if (!val) { cancelEdit(); return }
    setSaving(true)
    try {
      const updated = await updateMoment(moment.id, { [field]: val })
      onUpdate(moment.id, updated)
    } catch {
      // visszaállítjuk az eredetit hiba esetén
      if (field === 'title') setTitleVal(moment.title)
      else setYtIdVal(moment.youtubeId)
    } finally {
      setSaving(false)
      setEditingField(null)
    }
  }

  function cancelEdit() {
    setTitleVal(moment.title)
    setYtIdVal(moment.youtubeId)
    setEditingField(null)
  }

  function handleKeyDown(e: React.KeyboardEvent, field: 'title' | 'youtubeId') {
    if (e.key === 'Enter') { e.preventDefault(); save(field) }
    if (e.key === 'Escape') cancelEdit()
  }

  const isPlaceholder = moment.title.includes('szerkesztendő')

  return (
    <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
      isPlaceholder ? 'bg-yellow-500/5 border border-yellow-500/15' : 'bg-[#141414]'
    }`}>
      {/* Thumbnail */}
      <img
        src={`https://img.youtube.com/vi/${ytIdVal}/default.jpg`}
        className="w-16 h-9 object-cover rounded flex-shrink-0 bg-[#222]"
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">

        {/* Cím — kattintásra szerkeszthető */}
        {editingField === 'title' ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'title')}
              onBlur={() => save('title')}
              disabled={saving}
              className="flex-1 bg-[#222] text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#e50914] min-w-0"
            />
            <button onClick={() => save('title')} disabled={saving}
              className="text-green-400 text-xs hover:text-green-300 flex-shrink-0">
              {saving ? '…' : '✓'}
            </button>
            <button onClick={cancelEdit} className="text-gray-500 text-xs hover:text-gray-300 flex-shrink-0">✕</button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 group text-left w-full"
            onClick={() => setEditingField('title')}
            title="Kattints a cím szerkesztéséhez"
          >
            <p className={`text-sm font-medium truncate ${isPlaceholder ? 'text-yellow-400' : 'text-white'}`}>
              {titleVal}
            </p>
            <span className="text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✏</span>
          </button>
        )}

        {/* YouTube ID — kattintásra szerkeszthető */}
        <div className="flex items-center gap-2 flex-wrap">
          {editingField === 'youtubeId' ? (
            <div className="flex items-center gap-2">
              <input
                ref={editingField === 'youtubeId' ? inputRef : undefined}
                value={ytIdVal}
                onChange={e => setYtIdVal(e.target.value)}
                onKeyDown={e => handleKeyDown(e, 'youtubeId')}
                onBlur={() => save('youtubeId')}
                disabled={saving}
                placeholder="YouTube ID"
                className="w-36 bg-[#222] text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#e50914] font-mono"
              />
              <button onClick={() => save('youtubeId')} disabled={saving}
                className="text-green-400 text-xs hover:text-green-300 flex-shrink-0">
                {saving ? '…' : '✓'}
              </button>
              <button onClick={cancelEdit} className="text-gray-500 text-xs hover:text-gray-300 flex-shrink-0">✕</button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1 group"
              onClick={() => setEditingField('youtubeId')}
              title="Kattints a YouTube ID szerkesztéséhez"
            >
              <span className="text-gray-600 text-xs font-mono">{ytIdVal}</span>
              <span className="text-gray-700 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✏</span>
            </button>
          )}

          <span className="text-gray-700 text-xs">·</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
            moment.platform === 'shorts'
              ? 'bg-[#e50914]/15 text-[#e50914]'
              : 'bg-blue-500/15 text-blue-400'
          }`}>
            {moment.platform === 'shorts' ? '📱 shorts' : '🎬 regular'}
          </span>
          <span className="text-gray-600 text-xs">{moment.category?.name}</span>
        </div>
      </div>

      {/* Törlés */}
      <button
        onClick={() => onDelete(moment.id)}
        className="text-gray-600 hover:text-red-400 transition-colors text-sm flex-shrink-0 px-1"
        title="Törlés"
      >
        🗑
      </button>
    </div>
  )
}

// ── Admin dashboard ─────────────────────────────────────────────────────────

interface NewMomentForm {
  title: string
  description: string
  youtubeId: string
  platform: 'shorts' | 'regular'
  year: string
  duration: string
  viralScore: string
  isHero: boolean
  categoryId: string
  tags: string
}

const EMPTY_FORM: NewMomentForm = {
  title: '', description: '', youtubeId: '', platform: 'shorts',
  year: String(new Date().getFullYear()),
  duration: '60', viralScore: '75', isHero: false, categoryId: '', tags: ''
}

function Dashboard() {
  const [moments, setMoments] = useState<Moment[]>([])
  const [form, setForm]       = useState<NewMomentForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter]   = useState<'all' | 'shorts' | 'regular' | 'placeholder'>('all')
  const { categories } = useCategories()

  useEffect(() => {
    getMoments().then(setMoments).catch(console.error)
  }, [])

  function setField(field: keyof NewMomentForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        duration: Number(form.duration),
        viralScore: Number(form.viralScore),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      const created = await createMoment(payload)
      setMoments(prev => [created, ...prev])
      setForm(EMPTY_FORM)
      setMessage('✅ Sikeresen hozzáadva!')
    } catch {
      setMessage('❌ Hiba történt.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleUpdate(id: string, updated: Moment) {
    setMoments(prev => prev.map(m => m.id === id ? updated : m))
  }

  async function handleDelete(id: string) {
    if (!confirm('Biztosan törlöd?')) return
    await deleteMoment(id)
    setMoments(prev => prev.filter(m => m.id !== id))
  }

  const filtered = moments.filter(m => {
    if (filter === 'shorts') return m.platform === 'shorts'
    if (filter === 'regular') return m.platform === 'regular'
    if (filter === 'placeholder') return m.title.includes('szerkesztendő')
    return true
  })

  const placeholderCount = moments.filter(m => m.title.includes('szerkesztendő')).length

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 pb-16 max-w-4xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-2">Admin panel</h1>
        <p className="text-gray-500 text-sm mb-8">
          A listában a <span className="text-yellow-400">cím</span> és a <span className="text-gray-400 font-mono">YouTube ID</span> közvetlenül szerkeszthető — kattints rájuk.
        </p>

        {/* Add form */}
        <div className="bg-[#141414] rounded-xl p-6 mb-10">
          <h2 className="text-white font-semibold mb-4">Új videó hozzáadása</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="admin-input md:col-span-2" placeholder="Cím*" value={form.title}
              onChange={e => setField('title', e.target.value)} required />
            <textarea className="admin-input md:col-span-2 h-16 resize-none" placeholder="Leírás (elhagyható)"
              value={form.description} onChange={e => setField('description', e.target.value)} />
            <input className="admin-input" placeholder="YouTube ID (pl. dQw4w9WgXcQ)*" value={form.youtubeId}
              onChange={e => setField('youtubeId', e.target.value)} required />
            <select className="admin-input" value={form.platform}
              onChange={e => setField('platform', e.target.value)}>
              <option value="shorts">📱 Shorts (9:16)</option>
              <option value="regular">🎬 Regular (16:9)</option>
            </select>
            <select className="admin-input" value={form.categoryId}
              onChange={e => setField('categoryId', e.target.value)} required>
              <option value="">Kategória*</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="admin-input" type="number" placeholder="Év" value={form.year}
              onChange={e => setField('year', e.target.value)} />
            <input className="admin-input" type="number" placeholder="Időtartam (mp)" value={form.duration}
              onChange={e => setField('duration', e.target.value)} />
            <input className="admin-input" type="number" min="0" max="100" placeholder="Virális pont (0-100)"
              value={form.viralScore} onChange={e => setField('viralScore', e.target.value)} />
            <input className="admin-input" placeholder="Tagek (vesszővel)" value={form.tags}
              onChange={e => setField('tags', e.target.value)} />
            <label className="flex items-center gap-2 text-gray-300 text-sm">
              <input type="checkbox" checked={form.isHero}
                onChange={e => setField('isHero', e.target.checked)} className="accent-[#e50914]" />
              Hero (főoldalon kiemelt)
            </label>
            <div className="md:col-span-2 flex items-center gap-4">
              <button type="submit" disabled={submitting}
                className="bg-[#e50914] text-white font-bold px-6 py-2 rounded hover:bg-red-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Mentés…' : 'Hozzáadás'}
              </button>
              {message && <span className="text-sm">{message}</span>}
            </div>
          </form>
        </div>

        {/* Szűrők */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-white font-semibold">Videók ({moments.length})</span>
          <div className="flex gap-1.5 ml-2">
            {(['all', 'shorts', 'regular', 'placeholder'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filter === f
                    ? 'bg-white text-black font-semibold'
                    : 'bg-white/8 text-gray-400 hover:text-white'
                }`}
              >
                {f === 'all' && `Összes (${moments.length})`}
                {f === 'shorts' && `📱 Shorts (${moments.filter(m => m.platform === 'shorts').length})`}
                {f === 'regular' && `🎬 Regular (${moments.filter(m => m.platform === 'regular').length})`}
                {f === 'placeholder' && `⚠ Szerkesztendő (${placeholderCount})`}
              </button>
            ))}
          </div>
        </div>

        {placeholderCount > 0 && (
          <div className="mb-4 bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-4 py-3 text-yellow-400 text-sm">
            ⚠ <strong>{placeholderCount} videónak</strong> még nincs neve — kattints a sárga cím szövegre a szerkesztéshez!
          </div>
        )}

        {/* Lista */}
        <div className="space-y-2">
          {filtered.map(m => (
            <MomentRow
              key={m.id}
              moment={m}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-8">Nincs videó ebben a szűrőben.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(isLoggedIn())
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />
  return <Dashboard />
}
