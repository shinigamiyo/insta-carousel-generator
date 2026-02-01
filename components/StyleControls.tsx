'use client'

import type { TextStyleOptions } from '../lib/types'

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Manrope', label: 'Manrope' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Lora', label: 'Lora' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
]

const textAlignOptions: Array<{ value: CanvasTextAlign; label: string }> = [
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'По центру' },
  { value: 'right', label: 'Справа' },
]

type StyleControlsProps = {
  options: TextStyleOptions
  onChange: (value: TextStyleOptions) => void
}

export const StyleControls = ({ options, onChange }: StyleControlsProps) => {
  const setValue = <K extends keyof TextStyleOptions>(key: K, rawValue: TextStyleOptions[K]) => {
    let value = rawValue
    if (key === 'fontWeight') {
      const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue)
      const clamped = Math.min(700, Math.max(400, Math.round(numeric / 100) * 100))
      value = clamped as TextStyleOptions[K]
    }
    if (key === 'textBoxX' || key === 'textBoxY' || key === 'textBoxWidth' || key === 'textBoxHeight') {
      const MIN_W = 0.2
      const MIN_H = 0.15
      const next = { ...options, [key]: value } as TextStyleOptions
      next.textBoxWidth = Math.max(MIN_W, Math.min(1, next.textBoxWidth))
      next.textBoxHeight = Math.max(MIN_H, Math.min(1, next.textBoxHeight))
      next.textBoxX = Math.max(0, Math.min(1 - next.textBoxWidth, next.textBoxX))
      next.textBoxY = Math.max(0, Math.min(1 - next.textBoxHeight, next.textBoxY))
      onChange(next)
      return
    }
    onChange({ ...options, [key]: value })
  }

  return (
    <div className="grid gap-5 rounded-3xl border border-[#5E55F0]/35 bg-[#04044A]/75 p-6">
      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/60">Шрифт</label>
        <select
          className="rounded-2xl border border-white/10 bg-midnight-800/80 px-3 py-2 text-sm text-white/90 focus:border-neon-cyan/60 focus:outline-none"
          value={options.fontFamily}
          onChange={(event) => setValue('fontFamily', event.target.value)}
        >
          {fontOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/60">Жирность</label>
        <input
          type="range"
          min={400}
          max={700}
          step={100}
          value={Math.round(options.fontWeight / 100) * 100}
          onChange={(event) => setValue('fontWeight', Number(event.target.value))}
        />
        <span className="text-xs text-white/50">{Math.round(options.fontWeight / 100) * 100}</span>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/60">
          Цвет текста
          <input
            type="color"
            value={options.textColor}
            onChange={(event) => setValue('textColor', event.target.value)}
            className="h-8 w-16 rounded-xl border border-white/10"
          />
        </label>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/60">
          Фоновая плашка
          <input
            type="checkbox"
            checked={options.backgroundEnabled}
            onChange={(event) => setValue('backgroundEnabled', event.target.checked)}
            className="h-5 w-5 accent-neon-cyan"
          />
        </label>
        {options.backgroundEnabled ? (
          <div className="grid gap-3 rounded-2xl border border-white/5 bg-midnight-800/60 p-3 text-xs text-white/60">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-widest">Цвет</span>
              <input
                type="color"
                value={options.backgroundColor}
                onChange={(event) => setValue('backgroundColor', event.target.value)}
                className="h-7 w-16 rounded-xl border border-white/10"
              />
            </div>
            <label className="grid gap-1">
              <span className="uppercase tracking-widest">Прозрачность</span>
              <input
                type="range"
                min={10}
                max={95}
                value={Math.round(options.backgroundOpacity * 100)}
                onChange={(event) => setValue('backgroundOpacity', Number(event.target.value) / 100)}
              />
              <span>{Math.round(options.backgroundOpacity * 100)}%</span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/60">
          Градиентный оверлей
          <input
            type="checkbox"
            checked={options.overlayEnabled}
            onChange={(event) => setValue('overlayEnabled', event.target.checked)}
            className="h-5 w-5 accent-neon-violet"
          />
        </label>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/60">
          Обводка
          <input
            type="checkbox"
            checked={options.strokeEnabled}
            onChange={(event) => setValue('strokeEnabled', event.target.checked)}
            className="h-5 w-5 accent-neon-violet"
          />
        </label>
        {options.strokeEnabled ? (
          <div className="grid gap-3 rounded-2xl border border-white/5 bg-midnight-800/60 p-3 text-xs text-white/60">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-widest">Цвет</span>
              <input
                type="color"
                value={options.strokeColor}
                onChange={(event) => setValue('strokeColor', event.target.value)}
                className="h-7 w-16 rounded-xl border border-white/10"
              />
            </div>
            <label className="grid gap-1">
              <span className="uppercase tracking-widest">Толщина</span>
              <input
                type="range"
                min={1}
                max={12}
                value={options.strokeWidth}
                onChange={(event) => setValue('strokeWidth', Number(event.target.value))}
              />
              <span>{options.strokeWidth}px</span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/60">Отступы внутри блока</label>
        <input
          type="range"
          min={4}
          max={20}
          value={Math.round(options.paddingRatio * 100)}
          onChange={(event) => setValue('paddingRatio', Number(event.target.value) / 100)}
        />
        <span className="text-xs text-white/50">{Math.round(options.paddingRatio * 100)}%</span>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/60">Межстрочный интервал</label>
        <input
          type="range"
          min={100}
          max={160}
          value={Math.round(options.lineHeight * 100)}
          onChange={(event) => setValue('lineHeight', Number(event.target.value) / 100)}
        />
        <span className="text-xs text-white/50">{options.lineHeight.toFixed(2)}</span>
      </div>

      <div className="grid gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Выравнивание</span>
        <div className="grid grid-cols-3 gap-2">
          {textAlignOptions.map((option) => {
            const isActive = option.value === options.textAlign
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('textAlign', option.value)}
                className={`rounded-2xl px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-gradient-to-br from-neon-cyan/35 via-neon-violet/35 to-neon-magenta/35 text-white shadow-glow'
                    : 'border border-white/5 bg-midnight-800/60 text-white/70 hover:border-neon-cyan/40 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Текстовая область</span>
        <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
          <label className="grid gap-1">
            <span className="uppercase tracking-widest">X (по ширине)</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(options.textBoxX * 100)}
              onChange={(event) => setValue('textBoxX', Number(event.target.value) / 100)}
            />
            <span>{Math.round(options.textBoxX * 100)}%</span>
          </label>
          <label className="grid gap-1">
            <span className="uppercase tracking-widest">Y (по высоте)</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(options.textBoxY * 100)}
              onChange={(event) => setValue('textBoxY', Number(event.target.value) / 100)}
            />
            <span>{Math.round(options.textBoxY * 100)}%</span>
          </label>
          <label className="grid gap-1">
            <span className="uppercase tracking-widest">Ширина</span>
            <input
              type="range"
              min={30}
              max={100}
              value={Math.round(options.textBoxWidth * 100)}
              onChange={(event) => setValue('textBoxWidth', Number(event.target.value) / 100)}
            />
            <span>{Math.round(options.textBoxWidth * 100)}%</span>
          </label>
          <label className="grid gap-1">
            <span className="uppercase tracking-widest">Высота</span>
            <input
              type="range"
              min={15}
              max={80}
              value={Math.round(options.textBoxHeight * 100)}
              onChange={(event) => setValue('textBoxHeight', Number(event.target.value) / 100)}
            />
            <span>{Math.round(options.textBoxHeight * 100)}%</span>
          </label>
        </div>
        <p className="text-[11px] text-white/50">Можно двигать и тянуть рамку прямо в предпросмотре.</p>
      </div>
    </div>
  )
}

export default StyleControls
