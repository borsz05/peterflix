import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import momentsRouter from './routes/moments'
import categoriesRouter from './routes/categories'
import searchRouter from './routes/search'
import authRouter from './routes/auth'
import pixelboardRouter from './routes/pixelboard'
import { errorHandler } from './middleware/errorHandler'
import { pixelEvents, PixelEvent } from './events'

const app  = express()
const PORT = process.env.PORT ?? 3001
const isProd = process.env.NODE_ENV === 'production'

// ── Biztonság ────────────────────────────────────────────────────────────────
// Alapvető HTTP security headerek (XSS, clickjacking, sniffing ellen)
app.use(helmet())

// Proxy mögötti valódi IP (Railway, Render stb.)
app.set('trust proxy', 1)

// ── CORS ─────────────────────────────────────────────────────────────────────
// FRONTEND_URL lehet vesszővel elválasztott lista is:
// pl. "https://peterflix.hu,https://peterflix.netlify.app"
// Dev-ben (nincs env) minden origin OK
const allowedOrigins: string[] | boolean = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').flatMap(url => {
      const u = url.trim()
      const bare = u.replace(/^https?:\/\//, '')
      return [u, `https://www.${bare}`, `http://www.${bare}`]
    })
  : true
app.use(cors({ origin: allowedOrigins }))

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Általános API limit: 120 kérés/perc IP-nként
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Túl sok kérés, próbáld újra egy perc múlva.' },
})
app.use('/api', apiLimiter)

app.use(express.json())

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/moments',    momentsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/search',     searchRouter)
app.use('/api/auth',       authRouter)
app.use('/api/pixelboard', pixelboardRouter)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'PéterFlix API', time: new Date().toISOString() })
)

app.use(errorHandler)

// ── HTTP server + WebSocket ───────────────────────────────────────────────────
const httpServer = createServer(app)
const wss        = new WebSocketServer({ server: httpServer })

function broadcast(msg: string) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg)
  })
}

// Pixel elhelyezéskor broadcast → összes kliens azonnal frissül
pixelEvents.on('pixel', (data: PixelEvent) => {
  broadcast(JSON.stringify({ type: 'pixel', ...data }))
})

// Reset broadcast
pixelEvents.on('reset', () => {
  broadcast(JSON.stringify({ type: 'reset' }))
})

wss.on('connection', ws => {
  console.log(`🔌 WS kliens csatlakozott  (összesen: ${wss.clients.size})`)
  ws.on('close', () =>
    console.log(`🔌 WS kliens lecsatlakozott (összesen: ${wss.clients.size})`)
  )
  ws.on('error', () => ws.terminate())
})

httpServer.listen(PORT, () => {
  console.log(`🎬 PéterFlix API fut: http://localhost:${PORT}/api`)
  console.log(`🔌 WebSocket:         ws://localhost:${PORT}`)
})
