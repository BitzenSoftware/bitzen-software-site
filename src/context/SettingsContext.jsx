import { createContext, useContext, useState, useEffect } from 'react'
import { apps as defaultApps } from '../data/apps'
import { blogPosts as defaultPosts } from '../data/blogPosts'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [logo, setLogo] = useState(() => localStorage.getItem('bitzen_logo') || '')

  const [apps, setApps] = useState(() => {
    const saved = localStorage.getItem('bitzen_apps')
    return saved ? JSON.parse(saved) : defaultApps
  })

  const [blogPosts, setBlogPosts] = useState(() => {
    const saved = localStorage.getItem('bitzen_posts')
    return saved ? JSON.parse(saved) : defaultPosts
  })

  useEffect(() => {
    if (logo) localStorage.setItem('bitzen_logo', logo)
    else localStorage.removeItem('bitzen_logo')
  }, [logo])

  useEffect(() => {
    localStorage.setItem('bitzen_apps', JSON.stringify(apps))
  }, [apps])

  useEffect(() => {
    localStorage.setItem('bitzen_posts', JSON.stringify(blogPosts))
  }, [blogPosts])

  return (
    <SettingsContext.Provider value={{ logo, setLogo, apps, setApps, blogPosts, setBlogPosts }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
