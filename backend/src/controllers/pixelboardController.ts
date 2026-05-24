import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { pixelEvents } from '../events'

const BOARD_KEY  = 'main'
const BOARD_SIZE = 100

// GET /api/pixelboard
export async function getBoard(_req: Request, res: Response) {
  try {
    const board = await prisma.pixelBoard.findUnique({ where: { key: BOARD_KEY } })
    res.json({ pixels: board?.pixels ?? {}, updatedAt: board?.updatedAt ?? null })
  } catch {
    res.status(500).json({ error: 'Nem sikerült betölteni a boardot' })
  }
}

// POST /api/pixelboard/pixel  — { x, y, color }
export async function placePixel(req: Request, res: Response) {
  const { x, y, color } = req.body

  if (typeof x !== 'number' || typeof y !== 'number' || typeof color !== 'string')
    return res.status(400).json({ error: 'Hiányos adatok' })
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE)
    return res.status(400).json({ error: 'Koordináta határon kívül' })
  if (!/^#[0-9a-fA-F]{6}$/.test(color))
    return res.status(400).json({ error: 'Érvénytelen szín (#RRGGBB)' })

  try {
    const existing = await prisma.pixelBoard.findUnique({ where: { key: BOARD_KEY } })
    const pixels   = (existing?.pixels ?? {}) as Record<string, string>
    pixels[`${x},${y}`] = color

    const board = await prisma.pixelBoard.upsert({
      where:  { key: BOARD_KEY },
      create: { key: BOARD_KEY, pixels },
      update: { pixels },
    })

    // WebSocket broadcast — minden csatlakozott kliensnek
    pixelEvents.emit('pixel', { x, y, color })

    res.json({ success: true, updatedAt: board.updatedAt })
  } catch {
    res.status(500).json({ error: 'Nem sikerült menteni a pixelt' })
  }
}

// DELETE /api/pixelboard  (admin only)
export async function resetBoard(_req: Request, res: Response) {
  try {
    await prisma.pixelBoard.upsert({
      where:  { key: BOARD_KEY },
      create: { key: BOARD_KEY, pixels: {} },
      update: { pixels: {} },
    })
    pixelEvents.emit('reset', {})
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Nem sikerült törölni a boardot' })
  }
}
