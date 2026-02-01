'use client'

import { useCallback, useRef } from 'react'
import type { CanvasAspect, SlideSource, TextStyleOptions } from './types'

const FONT_FALLBACKS: Record<string, string> = {
  'Inter': '"Inter", sans-serif',
  'Poppins': '"Poppins", sans-serif',
  'Roboto': '"Roboto", sans-serif',
  'Montserrat': '"Montserrat", sans-serif',
  'Raleway': '"Raleway", sans-serif',
  'Playfair Display': '"Playfair Display", serif',
  'Manrope': '"Manrope", sans-serif',
  'Space Grotesk': '"Space Grotesk", sans-serif',
  'Lora': '"Lora", serif',
  'DM Sans': '"DM Sans", sans-serif',
  'Oswald': '"Oswald", sans-serif',
  'JetBrains Mono': '"JetBrains Mono", ui-monospace, monospace',
}

const getCanvasFontFamily = (family: string) => FONT_FALLBACKS[family] ?? `"${family}"`

const CANVAS_DIMENSIONS: Record<CanvasAspect, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  vertical: { width: 1080, height: 1350 },
}

type RenderResult = {
  lines: string[]
  fontSize: number
}

const loadImage = (sourceUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Не удалось загрузить изображение'))
    img.src = sourceUrl
  })

const computeCover = (
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) => {
  const canvasRatio = canvasWidth / canvasHeight
  const imageRatio = imageWidth / imageHeight

  let drawWidth = canvasWidth
  let drawHeight = canvasHeight

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight
    drawWidth = (imageWidth / imageHeight) * drawHeight
  } else {
    drawWidth = canvasWidth
    drawHeight = (imageHeight / imageWidth) * drawWidth
  }

  const offsetX = (canvasWidth - drawWidth) / 2
  const offsetY = (canvasHeight - drawHeight) / 2

  return { width: drawWidth, height: drawHeight, offsetX, offsetY }
}

const hexToRgba = (hex: string, alpha: number) => {
  let normalized = hex.replace('#', '')
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('')
  }

  const bigint = parseInt(normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const fontLoadCache = new Map<string, Promise<void>>()

const ensureFontLoaded = async (family: string, weight: number) => {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  const key = `${family}-${weight}`
  if (!fontLoadCache.has(key)) {
    const loaders = [
      document.fonts.load(`400 1em "${family}"`),
      document.fonts.load(`${weight} 1em "${family}"`),
    ]
    const promise = Promise.all(loaders)
      .then(async () => {
        if ('ready' in document.fonts) {
          try {
            await document.fonts.ready
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => undefined)
    fontLoadCache.set(key, promise)
  }
  await fontLoadCache.get(key)
}

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  options: TextStyleOptions,
): RenderResult => {
  const sanitized = text.trim()
  if (!sanitized) {
    return { lines: [], fontSize: options.maxFontSize }
  }

  const manualLines = sanitized.split(/\n+/)
  let fontSize = options.maxFontSize

  const applyFont = (size: number) => {
    context.font = `${options.fontWeight} ${size}px ${getCanvasFontFamily(options.fontFamily)}`
  }

  while (fontSize >= options.minFontSize) {
    applyFont(fontSize)
    const lines: string[] = []

    for (const manualLine of manualLines) {
      const words = manualLine.split(/\s+/)
      if (!words.filter(Boolean).length) {
        lines.push('')
        continue
      }

      let currentLine = ''
      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word
        const metrics = context.measureText(candidate)

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = candidate
        }
      }

      if (currentLine) {
        lines.push(currentLine)
      }
    }

    const lineHeightPx = fontSize * options.lineHeight
    const textBlockHeight = lines.length * lineHeightPx

    if (textBlockHeight <= maxHeight || fontSize === options.minFontSize) {
      return { lines, fontSize }
    }

    fontSize -= 2
  }

  return { lines: [], fontSize: options.minFontSize }
}

export const useCarouselRenderer = (
  aspect: CanvasAspect,
  options: TextStyleOptions,
) => {
  const imageCache = useRef(new Map<string, HTMLImageElement>())

  const drawSlide = useCallback(
    async (canvas: HTMLCanvasElement, slide: SlideSource | undefined, text: string) => {
      const context = canvas.getContext('2d')
      if (!context) return

      await ensureFontLoaded(options.fontFamily, options.fontWeight)

      const { width, height } = CANVAS_DIMENSIONS[aspect]
      canvas.width = width
      canvas.height = height

      context.clearRect(0, 0, width, height)

      if (!slide) {
        context.fillStyle = '#0f172a'
        context.fillRect(0, 0, width, height)
        context.fillStyle = '#94a3b8'
        context.font = '36px Inter'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('Загрузите изображение', width / 2, height / 2)
        return
      }

      let image = imageCache.current.get(slide.id)
      if (!image) {
        image = await loadImage(slide.url)
        imageCache.current.set(slide.id, image)
      }

      const { width: drawWidth, height: drawHeight, offsetX, offsetY } = computeCover(
        image.naturalWidth,
        image.naturalHeight,
        width,
        height,
      )

      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)

      const textAreaWidth = width * options.textBoxWidth
      const textAreaHeight = height * options.textBoxHeight
      const textAreaX = Math.max(0, Math.min(width - textAreaWidth, width * options.textBoxX))
      const textAreaY = Math.max(0, Math.min(height - textAreaHeight, height * options.textBoxY))
      const horizontalPadding = Math.min(
        textAreaWidth / 2,
        Math.max(textAreaWidth * options.paddingRatio, 24),
      )
      const verticalPadding = Math.min(
        textAreaHeight / 2.5,
        Math.max(textAreaHeight * options.paddingRatio * 0.75, 18),
      )
      const maxWidth = textAreaWidth - horizontalPadding * 2
      const maxHeight = textAreaHeight - verticalPadding * 2

      if (maxWidth <= 0 || maxHeight <= 0) {
        return
      }

      if (!text.trim()) {
        return
      }

      const { lines, fontSize } = wrapText(context, text, maxWidth, maxHeight, options)
      if (!lines.length) {
        return
      }

      if (options.backgroundEnabled) {
        context.fillStyle = hexToRgba(options.backgroundColor, options.backgroundOpacity)
        context.fillRect(textAreaX, textAreaY, textAreaWidth, textAreaHeight)
      } else if (options.overlayEnabled) {
        const baseGradient = context.createLinearGradient(0, textAreaY, 0, textAreaY + textAreaHeight)
        baseGradient.addColorStop(0, 'rgba(4,2,51,0.05)')
        baseGradient.addColorStop(0.45, 'rgba(4,2,51,0.35)')
        baseGradient.addColorStop(1, 'rgba(4,2,51,0.6)')
        context.fillStyle = baseGradient
        context.fillRect(textAreaX, textAreaY, textAreaWidth, textAreaHeight)
      }

      if (options.overlayEnabled) {
        const overlayGradient = context.createLinearGradient(0, textAreaY, 0, textAreaY + textAreaHeight)
        overlayGradient.addColorStop(0, 'rgba(4,2,51,0)')
        overlayGradient.addColorStop(0.65, 'rgba(4,2,51,0.45)')
        overlayGradient.addColorStop(1, 'rgba(4,2,51,0.75)')
        context.fillStyle = overlayGradient
        context.fillRect(textAreaX, textAreaY, textAreaWidth, textAreaHeight)
      }

      context.textAlign = options.textAlign
      context.textBaseline = 'top'
      context.font = `${options.fontWeight} ${fontSize}px ${getCanvasFontFamily(options.fontFamily)}`
      context.fillStyle = options.textColor

      if (options.strokeEnabled) {
        context.lineWidth = options.strokeWidth
        context.strokeStyle = options.strokeColor
        context.lineJoin = 'round'
        context.miterLimit = 2
      }

      const lineHeightPx = fontSize * options.lineHeight
      const textBlockHeight = lines.length * lineHeightPx
      const availableHeight = textAreaHeight - verticalPadding * 2
      const startY = textAreaY + verticalPadding + Math.max(0, (availableHeight - textBlockHeight) / 2)

      const baseX = (() => {
        switch (options.textAlign) {
          case 'left':
            return textAreaX + horizontalPadding
          case 'right':
            return textAreaX + textAreaWidth - horizontalPadding
          default:
            return textAreaX + textAreaWidth / 2
        }
      })()

      lines.forEach((line, index) => {
        const y = startY + index * lineHeightPx
        if (options.strokeEnabled) {
          context.strokeText(line, baseX, y)
        }
        context.fillText(line, baseX, y)
      })
    },
    [aspect, options],
  )

  const exportSlide = useCallback(
    async (slide: SlideSource, text: string, quality = 0.9) => {
      const { width, height } = CANVAS_DIMENSIONS[aspect]
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      await drawSlide(canvas, slide, text)
      return canvas.toDataURL('image/jpeg', quality)
    },
    [aspect, drawSlide],
  )

  return {
    dimensions: CANVAS_DIMENSIONS[aspect],
    drawSlide,
    exportSlide,
  }
}

export type CarouselRenderer = ReturnType<typeof useCarouselRenderer>
