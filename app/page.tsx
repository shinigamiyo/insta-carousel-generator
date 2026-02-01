'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { ImageDropzone } from '../components/ImageDropzone'
import { SlidesGallery } from '../components/SlidesGallery'
import { StyleControls } from '../components/StyleControls'
import { CanvasPreview } from '../components/CanvasPreview'
import { baseStyle } from '../lib/presets'
import { useCarouselRenderer } from '../lib/useCarouselRenderer'
import type { CanvasAspect, SlideSource, TextStyleOptions } from '../lib/types'

const MAX_SLIDES = 10
const PLACEHOLDER_TEXT = 'Расскажите историю для этого кадра: выделите инсайт, добавьте выгоду и завершите призывом к действию.'

const aspectOptions: Record<CanvasAspect, { label: string; size: string }> = {
  square: { label: '1:1', size: '1080 × 1080' },
  vertical: { label: '4:5', size: '1080 × 1350' },
}

const createSlideSource = (file: File): SlideSource => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  url: URL.createObjectURL(file),
  name: file.name,
})

const triggerDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
}

const dataUrlToBase64 = (dataUrl: string): string => {
  const comma = dataUrl.indexOf(',')
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
}

type HomePageProps = {
  params?: Promise<Record<string, string | string[]>>
}

export default function HomePage(props: HomePageProps) {
  // Next 15: params асинхронный — разворачиваем через use(), иначе dev overlay при перечислении props выдаёт ошибку
  React.use(props.params ?? Promise.resolve({}))
  const [slides, setSlides] = useState<SlideSource[]>([])
  const [activeSlideId, setActiveSlideId] = useState<string | undefined>()
  const [slideTexts, setSlideTexts] = useState<Record<string, string>>({})
  const [aspect, setAspect] = useState<CanvasAspect>('square')
  const [styleOptions, setStyleOptions] = useState<TextStyleOptions>(baseStyle)
  const [isExporting, setIsExporting] = useState(false)
  const [exportHint, setExportHint] = useState<string | null>(null)
  const slidesCacheRef = useRef<SlideSource[]>([])

  const renderer = useCarouselRenderer(aspect, styleOptions)

  useEffect(() => {
    slidesCacheRef.current = slides
  }, [slides])

  // Отзываем blob URL только при размонтировании страницы. Не отзываем при изменении
  // slides (добавление/перестановка), иначе те же URL ещё используются в галерее и превью.
  useEffect(() => {
    return () => {
      slidesCacheRef.current.forEach((slide) => {
        try {
          URL.revokeObjectURL(slide.url)
        } catch {
          // URL уже отозван (например, при удалении слайда) — игнорируем
        }
      })
    }
  }, [])

  const handleAddSlides = useCallback((files: File[]) => {
    if (!files.length) return
    const remainingSlots = MAX_SLIDES - slidesCacheRef.current.length
    if (remainingSlots <= 0) {
      setExportHint('Достигнут максимум — 10 слайдов')
      return
    }

    const limitedFiles = files.slice(0, remainingSlots)
    const newSlides = limitedFiles.map(createSlideSource)

    setSlides((current) => [...current, ...newSlides])
    setSlideTexts((current) => {
      const next = { ...current }
      const isFirstUpload = slidesCacheRef.current.length === 0 && Object.keys(current).length === 0
      newSlides.forEach((slide, index) => {
        next[slide.id] = isFirstUpload && index === 0 ? PLACEHOLDER_TEXT : ''
      })
      return next
    })
    setActiveSlideId((prev) => newSlides[newSlides.length - 1]?.id ?? prev ?? slidesCacheRef.current[0]?.id)
  }, [])

  const handleRemoveSlide = useCallback((id: string) => {
    setSlides((current) => {
      const slide = current.find((item) => item.id === id)
      if (slide) URL.revokeObjectURL(slide.url)
      return current.filter((item) => item.id !== id)
    })
    setSlideTexts((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  const handleReorderSlides = useCallback((reordered: SlideSource[]) => {
    setSlides(reordered)
  }, [])

  useEffect(() => {
    if (!slides.length) {
      setActiveSlideId(undefined)
      return
    }

    if (!activeSlideId || !slides.some((slide) => slide.id === activeSlideId)) {
      setActiveSlideId(slides[0].id)
    }
  }, [slides, activeSlideId])

  const activeSlide = useMemo(() => slides.find((slide) => slide.id === activeSlideId), [slides, activeSlideId])
  const activeText = activeSlide ? slideTexts[activeSlide.id] ?? '' : ''

  const handleTextChange = useCallback(
    (value: string) => {
      if (!activeSlideId) return
      setSlideTexts((current) => ({ ...current, [activeSlideId]: value }))
    },
    [activeSlideId],
  )

  const handleStyleChange = useCallback((options: TextStyleOptions) => {
    setStyleOptions(options)
  }, [])

  const handleBoxChange = useCallback(
    (value: Partial<Pick<TextStyleOptions, 'textBoxX' | 'textBoxY' | 'textBoxWidth' | 'textBoxHeight'>>) => {
      setStyleOptions((current) => ({ ...current, ...value }))
    },
    [],
  )

  const handleDownloadCurrent = useCallback(async () => {
    if (!activeSlide) return
    try {
      setIsExporting(true)
      setExportHint('Экспортируем выбранный слайд...')
      const dataUrl = await renderer.exportSlide(activeSlide, activeText, 0.98)
      triggerDownload(dataUrl, `${activeSlide.name || 'slide'}.jpg`)
      setExportHint('Слайд сохранён')
    } catch (error) {
      setExportHint(error instanceof Error ? error.message : 'Не удалось экспортировать слайд')
    } finally {
      setIsExporting(false)
    }
  }, [activeSlide, activeText, renderer])

  const handleDownloadAll = useCallback(async () => {
    if (!slides.length) return
    try {
      setIsExporting(true)
      setExportHint('Готовим серию к скачиванию...')
      const zip = new JSZip()
      for (const [index, slide] of slides.entries()) {
        const text = slideTexts[slide.id] ?? ''
        const dataUrl = await renderer.exportSlide(slide, text, 0.98)
        const base64 = dataUrlToBase64(dataUrl)
        zip.file(`slide_${String(index + 1).padStart(2, '0')}.jpg`, base64, { base64: true })
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, 'carousel.zip')
      URL.revokeObjectURL(url)
      setExportHint('Все слайды сохранены в carousel.zip')
    } catch (error) {
      setExportHint(error instanceof Error ? error.message : 'Не удалось экспортировать карусель')
    } finally {
      setIsExporting(false)
    }
  }, [renderer, slideTexts, slides])

  return (
    <main className="relative min-h-screen bg-[#020224]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="pointer-events-none absolute inset-0 bg-neon-grid opacity-70" />
        <div className="pointer-events-none absolute top-[40%] left-1/2 h-96 w-[180%] -translate-x-1/2 bg-gradient-to-b from-transparent via-transparent to-[#020224] transition-opacity duration-300 md:hidden" />
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-12 sm:gap-10 sm:px-6 pb-16 lg:px-10">
        <header className="space-y-4 sm:space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5E55F0]/40 bg-[#5E55F0]/15 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-[#8FA7FF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EB9EFF] shadow-glow" />
              BOLSHAKOV_AI
            </div>
            <a
              href="https://t.me/bolshakov_vibecoding"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Автор приложения — Telegram @bolshakov_vibecoding"
              className="inline-flex items-center gap-2 rounded-full border border-[#0088CC]/50 bg-[#0088CC]/15 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5AC8FA] transition hover:border-[#0088CC]/70 hover:bg-[#0088CC]/25 hover:text-[#7DD3FC]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.1.154.234.17.332.015.098.034.321.019.495z" />
              </svg>
              Автор приложения
            </a>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Генератор Insta-каруселей
              </h1>
              <p className="max-w-xl text-sm text-[#B8C4FF]">
                
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {(Object.keys(aspectOptions) as CanvasAspect[]).map((mode) => {
                const isActive = mode === aspect
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAspect(mode)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                      isActive
                        ? 'border-[#8FA7FF]/60 bg-gradient-to-br from-[#5E55F0]/40 via-[#8FA7FF]/35 to-[#EB9EFF]/35 text-white shadow-glow'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-[#8FA7FF]/40 hover:text-white'
                    }`}
                  >
                    <span className="block text-base font-semibold">{aspectOptions[mode].label}</span>
                    <span className="text-[10px] text-white/60">{aspectOptions[mode].size}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
          <section className="relative flex flex-col gap-5 rounded-[32px] border border-[#5E55F0]/35 bg-[#04044A]/70 p-4 shadow-[0_45px_100px_-60px_rgba(11,18,99,0.85)] backdrop-blur sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -top-20 -left-24 hidden h-64 w-64 rounded-full bg-[#5E55F0]/30 blur-3xl md:block" aria-hidden />
            <div className="pointer-events-none absolute -bottom-24 right-[-80px] hidden h-72 w-72 rounded-full bg-[#EB9EFF]/30 blur-[120px] md:block" aria-hidden />
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8FA7FF]">Шаг 1</span>
              <h2 className="text-lg font-semibold text-white">Выберите изображения</h2>
              <p className="text-xs text-[#C9D4FF]">Нажмите кнопку или перетащите файлы; превью появится ниже сразу после загрузки.</p>
            </div>

            <ImageDropzone onFiles={handleAddSlides} variant="button" className="w-full" label="Добавить изображения" hint="или перетащите файлы" />

            <CanvasPreview
              renderer={renderer}
              slide={activeSlide}
              text={activeText}
              styleOptions={styleOptions}
              onBoxChange={handleBoxChange}
              className="min-h-[260px] border-[#5E55F0]/30 bg-[#04043A]/90 shadow-inner sm:min-h-[320px]"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDownloadCurrent}
                disabled={!activeSlide || isExporting}
                className="rounded-[28px] border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isExporting ? 'Экспорт...' : 'Скачать текущий слайд'}
              </button>
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={!slides.length || isExporting}
                className="rounded-[28px] border border-white/20 bg-transparent px-4 py-3 text-sm font-semibold text-white/85 backdrop-blur transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isExporting ? 'Экспорт...' : 'Скачать всю серию'}
              </button>
            </div>
            {exportHint ? <p className="text-xs text-[#C9D4FF]">{exportHint}</p> : null}

            <SlidesGallery
              slides={slides}
              activeId={activeSlideId}
              onSelect={setActiveSlideId}
              onRemove={handleRemoveSlide}
              onReorder={handleReorderSlides}
              className="grid-cols-2 sm:grid-cols-3"
            />
          </section>

          <div className="mt-4 flex flex-col gap-6 lg:mt-0">
            <section className="relative space-y-4 rounded-[28px] border border-[#5E55F0]/35 bg-[#04044A]/75 p-4 shadow-[0_30px_80px_-58px_rgba(9,16,93,0.9)] backdrop-blur sm:p-6 lg:p-8">
              <div className="pointer-events-none absolute -right-24 top-[-60px] hidden h-56 w-56 rounded-full bg-[#8FA7FF]/25 blur-[90px] md:block" aria-hidden />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8FA7FF]">Шаг 2</span>
                  <h2 className="text-lg font-semibold text-white">Текст для выбранного кадра</h2>
                  <p className="text-xs text-[#C9D4FF]">Текст сохраняется для каждого слайда отдельно.</p>
                </div>
                <span className="rounded-full border border-[#5E55F0]/40 bg-[#5E55F0]/20 px-3 py-1 text-[11px] text-[#E3E7FF]">
                  {activeSlide ? `Слайд ${String(slides.indexOf(activeSlide) + 1).padStart(2, '0')}` : 'Нет слайда'}
                </span>
              </div>

              {activeSlide ? (
                <textarea
                  value={activeText}
                  onChange={(event) => handleTextChange(event.target.value)}
                  rows={4}
                  className="scroll-gradient w-full rounded-3xl border border-[#5E55F0]/35 bg-[#030336]/85 px-3 py-3 text-sm text-white/90 shadow-inner focus:border-[#8FA7FF]/60 focus:outline-none sm:px-4 sm:py-4"
                  placeholder="Напишите текст для выбранного кадра..."
                />
              ) : (
                <div className="rounded-3xl border border-[#5E55F0]/35 bg-[#030336]/70 px-4 py-6 text-center text-sm text-[#C9D4FF]">
                  Добавьте и выберите слайд, чтобы редактировать текст.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-[#5E55F0]/35 bg-[#04044A]/80 p-4 shadow-[0_30px_80px_-58px_rgba(9,16,93,0.9)] backdrop-blur sm:p-6 lg:p-8">
              <div className="mb-5 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8FA7FF]">Шаг 3</span>
                <h2 className="text-lg font-semibold text-white">Продвинутая стилизация</h2>
                <p className="text-xs text-[#C9D4FF]">Настройте шрифты, фон, позиционирование текста.</p>
              </div>
              <StyleControls options={styleOptions} onChange={handleStyleChange} />
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
