import { useState, useEffect } from 'react'
import { Tooltip } from './Tooltip'

interface BaseProps {
  icon: React.ElementType
  label: string
  value: string
  onChange: (val: string) => void
  texttooltip?: string
}

interface InputFieldProps extends BaseProps {
  as?: 'input'
  type?: string
  placeholder?: string
  options?: never // prohibe options en input
}

interface SelectFieldProps extends BaseProps {
  as: 'select'
  options: { value: string; label: string }[]
  type?: never
  placeholder?: never
}

type AnimatedFilterFieldProps = InputFieldProps | SelectFieldProps

export function AnimatedFilterField({
  icon: Icon,
  label,
  value,
  onChange,
  texttooltip,
  as = 'input',
  type = 'text',
  placeholder,
  options,
}: AnimatedFilterFieldProps) {
  const [active, setActive] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1000)
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  const isActive = isMobile || active

  return (
    <div
      onMouseEnter={() => !isMobile && setActive(true)}
      onMouseLeave={() => !isMobile && !value && setActive(false)}
      className="relative sm:w-60 z-40"
    >
      {/* Label */}
      <div
        className={`absolute left-0 flex z-10 items-center gap-2 font-medium cursor-pointer transition-all duration-300
          ${isActive ? '-translate-y-1.5 text-sm text-[#7d4f2b]' : 'translate-y-2 text-lg text-gray-600'}`}
      >
        <div className="flex items-center justify-center bg-[#7d4f2b] border border-white rounded-full p-1 z-40">
          <Icon className="w-4 h-4 stroke-[2.5] text-white" />
        </div>
        <div className="w-fit z-10">{label}</div>
        <div className="z-50">
          {texttooltip && <Tooltip text={texttooltip} responsive />}
        </div>
      </div>

      {/* Render */}
      {as === 'input' ? (
        <input
          type={type}
          value={value}
          onFocus={() => setActive(true)}
          onBlur={() => !value && setActive(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border-b-2 bg-transparent text-sm text-gray-800 outline-none transition-all duration-300
            ${isActive ? 'pt-6 border-[#7d4f2b] opacity-100' : 'border-gray-200 pt-6 opacity-0'}`}
        />
      ) : (
        <select
          value={value}
          onFocus={() => setActive(true)}
          onBlur={() => !value && setActive(false)}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border-b-2 bg-transparent text-sm text-gray-800 outline-none appearance-none transition-all duration-300
            ${isActive ? 'pt-6 border-[#7d4f2b] opacity-100' : 'border-gray-200 pt-6 opacity-0'}`}
        >
          {options?.map((opt, index) => (
            <option key={`${opt.value}-${index}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}