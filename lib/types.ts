export type SlideSource = {
  id: string
  file: File
  url: string
  name: string
}

export type CanvasAspect = 'square' | 'vertical'

export interface TextStyleOptions {
  fontFamily: string
  fontWeight: number
  textColor: string
  backgroundEnabled: boolean
  backgroundColor: string
  backgroundOpacity: number
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
  paddingRatio: number
  lineHeight: number
  maxFontSize: number
  minFontSize: number
  textAlign: CanvasTextAlign
  /** Левая координата текстовой области в долях ширины (0–1) */
  textBoxX: number
  /** Верхняя координата текстовой области в долях высоты (0–1) */
  textBoxY: number
  /** Ширина текстовой области в долях ширины (0–1) */
  textBoxWidth: number
  /** Высота текстовой области в долях высоты (0–1) */
  textBoxHeight: number
  /** Показывать ли дополнительный градиентный оверлей */
  overlayEnabled: boolean
}

export interface StylePreset {
  id: string
  name: string
  description?: string
  options: TextStyleOptions
}
