'use client'

import { useCallback, useId, useRef, useState } from 'react'

type ImageDropzoneProps = {
  onFiles: (files: File[]) => void
  className?: string
  variant?: 'card' | 'button'
  label?: string
  hint?: string
}

export const ImageDropzone = ({
  onFiles,
  className,
  variant = 'card',
  label,
  hint,
}: ImageDropzoneProps) => {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const valid = Array.from(files).filter((file) => file.type.startsWith('image/'))
      if (valid.length) {
        onFiles(valid)
      }
    },
    [onFiles],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setIsDragging(false)
      processFiles(event.dataTransfer.files)
    },
    [processFiles],
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(event.target.files)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [processFiles],
  )

  const isButton = variant === 'button'
  const buttonLabel = label ?? 'Выбрать изображения'
  const buttonHint = hint ?? 'или перетащите файлы на область'

  return (
    <label
      htmlFor={inputId}
      className={`${
        isButton
          ? `relative inline-flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-[28px] border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:border-white/40 hover:bg-white/14 ${
              isDragging ? 'ring-2 ring-neon-cyan/40' : ''
            }`
          : `neon-border relative block cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-white/8 p-6 transition duration-300 hover:border-neon-cyan/40 hover:bg-white/10 ${
              isDragging ? 'ring-4 ring-neon-cyan/30' : ''
            }`
      } ${className ?? ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      {isButton ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-9-9v12m0-12 3.75 3.75M12 7.5 8.25 11.25" />
            </svg>
            <span>{buttonLabel}</span>
          </div>
          <span className="text-xs font-normal text-white/70">{buttonHint}</span>
        </div>
      ) : (
        <div className="relative space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan/40 via-neon-violet/40 to-neon-magenta/40 shadow-glow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-9 w-9 text-white/80"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-9-9v12m0-12 3.75 3.75M12 7.5 8.25 11.25" />
            </svg>
          </div>
          <div>
            <p className="text-base font-medium tracking-wide text-white/90">Перетащите изображения сюда</p>
            <p className="text-sm text-white/60">или нажмите, чтобы выбрать файлы (JPG, PNG, WebP)</p>
          </div>
        </div>
      )}
    </label>
  )
}
