"use client"

import { useState, useEffect, useRef, type RefObject } from "react"

interface InViewOptions {
  threshold?: number
  rootMargin?: string
  root?: Element | null
}

// Usando um tipo genérico T que estende HTMLElement
export function useInView<T extends HTMLElement>(
  options: InViewOptions = {},
): {
  ref: RefObject<T>
  inView: boolean
} {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || "0px",
        root: options.root || null,
      },
    )

    observer.observe(ref.current)

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [options.threshold, options.rootMargin, options.root])

  return { ref, inView: isIntersecting }
}
