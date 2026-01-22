import { useRef, useState, useEffect, useCallback } from 'react'
import './Knob.css'

interface KnobProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label?: string
  disabled?: boolean
  danger?: boolean
}

export const Knob = ({ value, min, max, onChange, label, disabled, danger }: KnobProps) => {
  const knobRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ y: number; startValue: number } | null>(null)
  const valueRef = useRef(value)
  
  // Keep valueRef in sync with value prop
  valueRef.current = value

  // Convert value to rotation angle (-135° to 135°, 270° total range)
  const valueToAngle = (val: number) => {
    const normalized = (val - min) / (max - min)
    return -135 + normalized * 270
  }

  const angle = valueToAngle(value)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { y: e.clientY, startValue: value }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || disabled) return
    
    const deltaY = dragStartRef.current.y - e.clientY
    const sensitivity = (max - min) / 150 // pixels to traverse full range
    const newValue = Math.round(
      Math.min(max, Math.max(min, dragStartRef.current.startValue + deltaY * sensitivity))
    )
    
    if (newValue !== value) {
      onChange(newValue)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    dragStartRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  // Use non-passive wheel listener to allow preventDefault
  const handleWheel = useCallback((e: WheelEvent) => {
    if (disabled) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    const newValue = Math.min(max, Math.max(min, valueRef.current + delta))
    onChange(newValue)
  }, [disabled, min, max, onChange])

  useEffect(() => {
    const knobElement = knobRef.current
    if (!knobElement) return

    knobElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      knobElement.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  return (
    <div className={`knob-container ${disabled ? 'disabled' : ''} ${danger ? 'danger' : ''}`}>
      {label && <span className="knob-label">{label}</span>}
      <div
        ref={knobRef}
        className={`knob ${isDragging ? 'dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Outer ring with tick marks */}
        <div className="knob-ring">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className="knob-tick"
              style={{ transform: `rotate(${-135 + i * 27}deg)` }}
            />
          ))}
        </div>
        
        {/* Main knob body */}
        <div 
          className="knob-body"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="knob-indicator" />
        </div>
        
        {/* Glow effect */}
        <div className="knob-glow" />
      </div>
      <span className="knob-value">{value}</span>
    </div>
  )
}
