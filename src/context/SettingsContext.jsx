import { createContext, useContext, useState, useEffect } from 'react'
import { apps as defaultApps } from '../data/apps'
import { blogPosts as defaultPosts } from '../data/blogPosts'

const DEFAULT_EMAIL = 'contato@bitzensoftware.com'

const DEFAULT_SOCIAL = {
  instagram: 'https://instagram.com/bitzensoftware',
  linkedin: 'https://linkedin.com/company/bitzensoftware',
  twitter: 'https://twitter.com/bitzensoftware',
  github: 'https://github.com/bitzensoftware',
}

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

  const [contactEmail, setContactEmail] = useState(
    () => localStorage.getItem('bitzen_email') || DEFAULT_EMAIL
  )

  const [socialLinks, setSocialLinks] = useState(() => {
    const saved = localStorage.getItem('bitzen_social')
    return saved ? JSON.parse(saved) : DEFAULT_SOCIAL
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

  useEffect(() => {
    localStorage.setItem('bitzen_email', contactEmail)
  }, [contactEmail])

  useEffect(() => {
    localStorage.setItem('bitzen_social', JSON.stringify(socialLinks))
  }, [socialLinks])

  return (
    <SettingsContext.Provider value={{
      logo, setLogo,
      apps, setApps,
      blogPosts, setBlogPosts,
      contactEmail, setContactEmail,
      socialLinks, setSocialLinks,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
