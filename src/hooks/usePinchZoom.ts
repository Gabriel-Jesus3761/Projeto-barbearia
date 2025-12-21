import { useEffect, useRef } from 'react'

type CalendarMode = 'day' | 'week' | 'month' | 'year'

interface UsePinchZoomOptions {
  onZoomIn: () => void
  onZoomOut: () => void
  threshold?: number
  enableMouseWheel?: boolean
}

export function usePinchZoom({ onZoomIn, onZoomOut, threshold = 50, enableMouseWheel = true }: UsePinchZoomOptions) {
  const initialDistance = useRef<number>(0)
  const isProcessing = useRef<boolean>(false)
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let touchStartDistance = 0

    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0

      const touch1 = touches[0]
      const touch2 = touches[1]

      const dx = touch2.clientX - touch1.clientX
      const dy = touch2.clientY - touch1.clientY

      return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchStartDistance = getTouchDistance(e.touches)
        initialDistance.current = touchStartDistance
        isProcessing.current = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && !isProcessing.current) {
        const currentDistance = getTouchDistance(e.touches)
        const delta = currentDistance - initialDistance.current

        // Zoom in (afastar os dedos) - vai para visualização mais detalhada
        if (delta > threshold) {
          onZoomIn()
          isProcessing.current = true
          setTimeout(() => {
            isProcessing.current = false
            initialDistance.current = currentDistance
          }, 300)
        }

        // Zoom out (aproximar os dedos) - vai para visualização mais ampla
        else if (delta < -threshold) {
          onZoomOut()
          isProcessing.current = true
          setTimeout(() => {
            isProcessing.current = false
            initialDistance.current = currentDistance
          }, 300)
        }
      }
    }

    const handleTouchEnd = () => {
      touchStartDistance = 0
      initialDistance.current = 0
      isProcessing.current = false
    }

    // Mouse wheel handler para desktop
    const handleWheel = (e: WheelEvent) => {
      // Só funciona com Shift pressionado
      if (!e.shiftKey || !enableMouseWheel || isProcessing.current) return

      e.preventDefault()

      // Limpar timeout anterior
      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current)
      }

      // Debounce para evitar múltiplas mudanças
      wheelTimeout.current = setTimeout(() => {
        if (e.deltaY < 0) {
          // Scroll up com Shift = Zoom in
          onZoomIn()
        } else if (e.deltaY > 0) {
          // Scroll down com Shift = Zoom out
          onZoomOut()
        }

        isProcessing.current = true
        setTimeout(() => {
          isProcessing.current = false
        }, 300)
      }, 100)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    if (enableMouseWheel) {
      document.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)

      if (enableMouseWheel) {
        document.removeEventListener('wheel', handleWheel)
      }

      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current)
      }
    }
  }, [onZoomIn, onZoomOut, threshold, enableMouseWheel])
}

export function getNextZoomLevel(current: CalendarMode, direction: 'in' | 'out'): CalendarMode {
  const modes: CalendarMode[] = ['year', 'month', 'week', 'day']
  const currentIndex = modes.indexOf(current)

  if (direction === 'in') {
    // Zoom in: year -> month -> week -> day
    return currentIndex < modes.length - 1 ? modes[currentIndex + 1] : current
  } else {
    // Zoom out: day -> week -> month -> year
    return currentIndex > 0 ? modes[currentIndex - 1] : current
  }
}
