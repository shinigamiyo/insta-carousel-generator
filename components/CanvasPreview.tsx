'use client'

import { useEffect, useRef, useState } from 'react'
import type { CarouselRenderer } from '../lib/useCarouselRenderer'
import type { SlideSource, TextStyleOptions } from '../lib/types'

type CanvasPreviewProps = {
  renderer: CarouselRenderer
  slide?: SlideSource
  text: string
  styleOptions: TextStyleOptions
  onBoxChange?: (value: Partial<Pick<TextStyleOptions, 'textBoxX' | 'textBoxY' | 'textBoxWidth' | 'textBoxHeight'>>) => void
  className?: string
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se'

type DragState = {
  mode: DragMode
  startX: number
  startY: number
  rectWidth: number
  rectHeight: number
  origin: { x: number; y: number; w: number; h: number }
}

export const CanvasPreview = ({ renderer, slide, text, styleOptions, onBoxChange, className }: CanvasPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState<'idle' | 'rendering' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const { dimensions, drawSlide } = renderer

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    setStatus('rendering')
    setErrorMessage(null)

    const render = async () => {
      try {
        await drawSlide(canvas, slide, text)
        if (cancelled) return
        setStatus('idle')
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Ошибка рендера')
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [drawSlide, slide, text])

  useEffect(() => {
    if (!dragState || !onBoxChange) return

    const clampBox = (x: number, y: number, w: number, h: number) => {
      const MIN_W = 0.2
      const MIN_H = 0.15
      let nextX = Math.max(0, x)
      let nextY = Math.max(0, y)
      let nextW = Math.max(MIN_W, w)
      let nextH = Math.max(MIN_H, h)
      if (nextX + nextW > 1) {
        nextW = 1 - nextX
      }
      if (nextY + nextH > 1) {
        nextH = 1 - nextY
      }
      return { nextX, nextY, nextW, nextH }
    }

    const handleMove = (event: PointerEvent) => {
      const dxRatio = (event.clientX - dragState.startX) / dragState.rectWidth
      const dyRatio = (event.clientY - dragState.startY) / dragState.rectHeight

      let x = dragState.origin.x
      let y = dragState.origin.y
      let w = dragState.origin.w
      let h = dragState.origin.h

      switch (dragState.mode) {
        case 'move':
          x += dxRatio
          y += dyRatio
          break
        case 'nw':
          x += dxRatio
          y += dyRatio
          w -= dxRatio
          h -= dyRatio
          break
        case 'ne':
          y += dyRatio
          w += dxRatio
          h -= dyRatio
          break
        case 'sw':
          x += dxRatio
          w -= dxRatio
          h += dyRatio
          break
        case 'se':
          w += dxRatio
          h += dyRatio
          break
        default:
          break
      }

      const { nextX, nextY, nextW, nextH } = clampBox(x, y, w, h)
      onBoxChange({
        textBoxX: nextX,
        textBoxY: nextY,
        textBoxWidth: nextW,
        textBoxHeight: nextH,
      })
    }

    const handleUp = () => {
      setDragState(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragState, onBoxChange])

  const handleStartDrag = (mode: DragMode) => (event: React.PointerEvent) => {
    if (!onBoxChange) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture?.(event.pointerId)
    setDragState({
      mode,
      startX: event.clientX,
      startY: event.clientY,
      rectWidth: rect.width,
      rectHeight: rect.height,
      origin: {
        x: styleOptions.textBoxX,
        y: styleOptions.textBoxY,
        w: styleOptions.textBoxWidth,
        h: styleOptions.textBoxHeight,
      },
    })
  }

  const boxStyle = {
    left: `${styleOptions.textBoxX * 100}%`,
    top: `${styleOptions.textBoxY * 100}%`,
    width: `${styleOptions.textBoxWidth * 100}%`,
    height: `${styleOptions.textBoxHeight * 100}%`,
  }

  return (
    <div className={`relative flex flex-col gap-4 rounded-3xl border border-white/5 bg-midnight-800/70 p-6 shadow-inner ${className ?? ''}`}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/70">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="h-auto w-full"
        />
        {slide && onBoxChange ? (
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
          >
            <div
              className="pointer-events-auto absolute rounded-xl border border-neon-cyan/70 bg-neon-cyan/5 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
              style={boxStyle}
              onPointerDown={handleStartDrag('move')}
            >
              {(['nw', 'ne', 'sw', 'se'] as DragMode[]).map((mode) => (
                <div
                  key={mode}
                  onPointerDown={handleStartDrag(mode)}
                  className={`absolute h-3 w-3 rounded-full border border-neon-cyan/70 bg-neon-cyan/60 shadow-glow ${
                    mode === 'nw'
                      ? '-left-1.5 -top-1.5 cursor-nwse-resize'
                      : mode === 'ne'
                        ? '-right-1.5 -top-1.5 cursor-nesw-resize'
                        : mode === 'sw'
                          ? '-left-1.5 -bottom-1.5 cursor-nesw-resize'
                          : '-right-1.5 -bottom-1.5 cursor-nwse-resize'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
        {status === 'rendering' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm text-sm text-white/80">
            Рендерим...
          </div>
        ) : null}
        {status === 'error' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 p-4 text-center text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Интерактивный предпросмотр</span>
        <span>
          {dimensions.width} × {dimensions.height}px
        </span>
      </div>
    </div>
  )
}
