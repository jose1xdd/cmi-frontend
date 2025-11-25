"use client"
import { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { HelpCircle } from "lucide-react"

export function Tooltip({
  text,
  color = "#7d4f2b",
  responsive = false,
}: {
  text: string
  color?: string
  responsive?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [portal, setPortal] = useState<Element | null>(null)

  useEffect(() => {
    setPortal(document.body)
  }, [])

  const handleEnter = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setCoords({ top: rect.bottom + window.scrollY, left: rect.left + rect.width / 2 })
    setVisible(true)
  }

  const handleLeave = () => setVisible(false)

  return (
    <>
      <div
        ref={ref}
        className="inline-block ml-1"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onTouchStart={handleEnter}
        onTouchEnd={handleLeave}
      >
        <HelpCircle
          className="w-4 h-4 cursor-pointer scale-105 hover:scale-125 transition-transform duration-300"
          style={{ color }}
        />
      </div>

      {portal &&
        visible &&
        createPortal(
          <div
            className={`absolute z-[9999] bg-black text-white text-xs rounded px-3 py-2 shadow-md whitespace-normal
              transform -translate-x-1/2 translate-y-2 transition-opacity duration-150 opacity-100
              ${responsive ? "max-w-[80vw] sm:max-w-xs break-words" : "min-w-[200px] max-w-xs"}`}
            style={{ top: coords.top, left: coords.left, position: "absolute" }}
          >
            {text}
          </div>,
          portal
        )}
    </>
  )
}
