'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('StudentIQ ServiceWorker registered successfully:', registration.scope)
          })
          .catch((err) => {
            console.warn('StudentIQ ServiceWorker registration failed:', err)
          })
      })
    }
  }, [])

  return null
}
