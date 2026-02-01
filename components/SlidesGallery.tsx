'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { SlideSource } from '../lib/types'

type SlidesGalleryProps = {
  slides: SlideSource[]
  activeId?: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onReorder: (reordered: SlideSource[]) => void
  className?: string
}

export const SlidesGallery = ({ slides, activeId, onSelect, onRemove, onReorder, className }: SlidesGalleryProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return
    setDropTargetIndex(index)
  }

  const handleDragLeave = () => {
    setDropTargetIndex(null)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    setDropTargetIndex(null)
    setDraggedIndex(null)
    if (draggedIndex === null || draggedIndex === toIndex) return
    const reordered = [...slides]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(toIndex, 0, removed)
    onReorder(reordered)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  if (!slides.length) {
    return (
      <div className="rounded-3xl border border-[#5E55F0]/35 bg-[#04044A]/70 p-6 text-sm text-[#C9D4FF]">
        Загрузите изображения, чтобы построить карусель. Минимум 3 — максимум 10 файлов.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#8FA7FF]/80">Перетащите слайды, чтобы изменить порядок в карусели.</p>
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-3 ${className ?? ''}`}>
        {slides.map((slide, index) => {
          const isActive = slide.id === activeId
          const isDragging = draggedIndex === index
          const isDropTarget = dropTargetIndex === index && draggedIndex !== index
          return (
            <div
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative cursor-grab overflow-hidden rounded-3xl border border-[#5E55F0]/30 bg-[#04043A]/70 transition duration-300 active:cursor-grabbing ${
                isActive ? 'ring-2 ring-[#8FA7FF]/70 shadow-[0_15px_45px_-30px_rgba(143,167,255,0.9)]' : 'hover:border-[#EB9EFF]/50'
              } ${isDragging ? 'opacity-50 scale-95' : ''} ${isDropTarget ? 'ring-2 ring-[#EB9EFF]/70 ring-offset-2 ring-offset-[#04044A]' : ''}`}
            >
              <button type="button" className="block w-full" onClick={() => onSelect(slide.id)}>
                <Image
                  src={slide.url}
                  alt={slide.name || `Slide ${index + 1}`}
                  width={320}
                  height={320}
                  className="h-32 w-full object-cover pointer-events-none select-none"
                  unoptimized
                  draggable={false}
                />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                <span className="font-medium tracking-wide flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[10px]" aria-hidden>
                    ⋮⋮
                  </span>
                  Слайд {String(index + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/80 transition hover:bg-red-500/80 hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemove(slide.id)
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
