// LimoFlight V4 — src/context/BrandContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const BrandCtx = createContext(null)

const DEFAULT_BRAND = {
  name:    'LimoFlight',
  tagline: 'Pilot Tour Services',
  logo:    '✈',
  color:   '#C9A84C',
  font:    'Playfair Display',
}

export function BrandProvider({ children }) {
  const [brand, setBrandState] = useState(() => {
    try {
      const saved = localStorage.getItem('lf_brand')
      return saved ? { ...DEFAULT_BRAND, ...JSON.parse(saved) } : DEFAULT_BRAND
    } catch {
      return DEFAULT_BRAND
    }
  })

  // Apply brand color to CSS custom property so components can use var(--brand-color)
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', brand.color)
    document.documentElement.style.setProperty('--brand-font', `'${brand.font}', serif`)
    document.title = brand.name
  }, [brand])

  function setBrand(updater) {
    setBrandState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      localStorage.setItem('lf_brand', JSON.stringify(next))
      return next
    })
  }

  function resetBrand() {
    setBrand(DEFAULT_BRAND)
    localStorage.removeItem('lf_brand')
  }

  return (
    <BrandCtx.Provider value={{ brand, setBrand, resetBrand }}>
      {children}
    </BrandCtx.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandCtx)
  if (!ctx) throw new Error('useBrand must be used inside <BrandProvider>')
  return ctx
}
