import { useEffect, useRef, useCallback } from 'react'

export type WsPixelMsg = { type: 'pixel'; x: number; y: number; color: string }
export type WsResetMsg = { type: 'reset' }
export type WsMsg      = WsPixelMsg | WsResetMsg

interface Handlers {
  onPixel: (msg: WsPixelMsg) => void
  onReset: () => void
  onStatus?: (s: 'connected' | 'disconnected') => void
}

/** VITE_API_URL-ből levezetett WebSocket URL.
 *  pl. http://localhost:3001/api → ws://localhost:3001
 */
function getWsUrl(): string {
  const api = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL
  if (api) {
    return api
      .replace(/\/api\/?$/, '')
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//,  'ws://')
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

export function usePixelSocket({ onPixel, onReset, onStatus }: Handlers) {
  const handlersRef = useRef({ onPixel, onReset, onStatus })
  handlersRef.current = { onPixel, onReset, onStatus }

  const wsRef      = useRef<WebSocket | null>(null)
  const retryRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted  = useRef(false)

  const connect = useCallback(() => {
    if (unmounted.current) return

    const url = getWsUrl()
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      // WebSocket nem elérhető (pl. SSR) — nem próbálkozunk
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      handlersRef.current.onStatus?.('connected')
    }

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data as string) as WsMsg
        if (msg.type === 'pixel') handlersRef.current.onPixel(msg)
        if (msg.type === 'reset') handlersRef.current.onReset()
      } catch {}
    }

    ws.onclose = () => {
      handlersRef.current.onStatus?.('disconnected')
      if (!unmounted.current) {
        retryRef.current = setTimeout(connect, 3000)
      }
    }

    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => {
    unmounted.current = false
    connect()
    return () => {
      unmounted.current = true
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])
}
