import { EventEmitter } from 'events'

export interface PixelEvent {
  x: number
  y: number
  color: string
}

class PixelEventEmitter extends EventEmitter {}
export const pixelEvents = new PixelEventEmitter()
