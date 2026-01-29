"use client"

import { useEffect, useRef } from "react"

export default function ReloadControl() {
  const lastHiddenAt = useRef<number | null>(null)

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt.current = Date.now()
      } else {
        if (lastHiddenAt.current && Date.now() - lastHiddenAt.current > 5 * 60 * 1000) {
          location.reload()
        }
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [])

  return (
    <button
      type="button"
      onClick={() => location.reload()}
      className="fixed bottom-4 right-4 z-[100] rounded-full bg-black text-white px-4 py-2 shadow-lg hover:opacity-90 focus:outline-none"
      aria-label="Reload page"
      title="Reload"
    >
      Reload
    </button>
  )
}
