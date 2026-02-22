'use client'

import { getCIALabel } from '@/lib/utils'

interface CIASliderProps {
  label: string
  name: string
  value: number
  onChange: (value: number) => void
  description?: string
}

const levelColors = ['', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
const levelBg = ['', 'text-green-400', 'text-lime-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']

export default function CIASlider({ label, name, value, onChange, description }: CIASliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className={`text-sm font-semibold ${levelBg[value]}`}>
          {value} — {getCIALabel(value)}
        </span>
      </div>
      {description && <p className="text-xs text-slate-500 mb-2">{description}</p>}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all duration-200 ${i <= value ? levelColors[value] : 'bg-slate-700'}`}
            />
          ))}
        </div>
        <input
          type="range"
          name={name}
          min={1}
          max={5}
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#6270f5' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-0.5">
        <span>Very Low</span>
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
        <span>Very High</span>
      </div>
    </div>
  )
}
