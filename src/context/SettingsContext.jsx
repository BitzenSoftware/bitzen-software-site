import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
  const [loading, setLoading] = useState(true)
  const [logo, _setLogo] = useState('')
  const [apps, _setApps] = useState(defaultApps)
  const [blogPosts, _setBlogPosts] = useState(defaultPosts)
  const [contactEmail, _setContactEmail] = useState(DEFAULT_EMAIL)
  const [socialLinks, _setSocialLinks] = useState(DEFAULT_SOCIAL)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [{ data: settingsData }, { data: appsData }, { data: postsData }] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase.from('apps').select('*').order('sort_order'),
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
      ])

      if (settingsData?.length) {
        const map = Object.fromEntries(settingsData.map(s => [s.key, s.value]))
        if (map.logo !== undefined) _setLogo(map.logo || '')
        if (map.contact_email) _setContactEmail(map.contact_email)
        if (map.social_links) _setSocialLinks(map.social_links)
      }

      if (appsData?.length) {
        _setApps(appsData.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description || '',
          logo: a.logo || '',
          buyUrl: a.buy_url || '',
          badge: a.badge || 'Web App',
        })))
      }

      if (postsData?.length) {
        _setBlogPosts(postsData.map(p => ({
          id: p.id,
          title: p.title,
          date: p.date || '',
          excerpt: p.excerpt || '',
          slug: p.slug || '',
        })))
      }
    } catch (err) {
      console.error('Supabase load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function setLogo(url) {
    _setLogo(url)
    await supabase.from('settings').upsert({ key: 'logo', value: url })
  }

  async function setContactEmail(email) {
    _setContactEmail(email)
    await supabase.from('settings').upsert({ key: 'contact_email', value: email })
  }

  async function setSocialLinks(links) {
    _setSocialLinks(links)
    await supabase.from('settings').upsert({ key: 'social_links', value: links })
  }

  async function setApps(newApps) {
    _setApps(newApps)
    const { data: current } = await supabase.from('apps').select('id')
    const currentIds = (current || []).map(a => a.id)
    const newIds = newApps.map(a => String(a.id))
    const toDelete = currentIds.filter(id => !newIds.includes(id))

    if (newApps.length > 0) {
      await supabase.from('apps').upsert(
        newApps.map((a, i) => ({
          id: String(a.id),
          name: a.name,
          description: a.description || '',
          logo: a.logo || '',
          buy_url: a.buyUrl || '',
          badge: a.badge || 'Web App',
          sort_order: i,
        }))
      )
    }
    if (toDelete.length > 0) {
      await supabase.from('apps').delete().in('id', toDelete)
    }
  }

  async function setBlogPosts(newPosts) {
    _setBlogPosts(newPosts)
    const { data: current } = await supabase.from('blog_posts').select('id')
    const currentIds = (current || []).map(p => p.id)
    const newIds = newPosts.map(p => String(p.id))
    const toDelete = currentIds.filter(id => !newIds.includes(id))

    if (newPosts.length > 0) {
      await supabase.from('blog_posts').upsert(
        newPosts.map(p => ({
          id: String(p.id),
          title: p.title,
          date: p.date || '',
          excerpt: p.excerpt || '',
          slug: p.slug || p.title.toLowerCase().replace(/\s+/g, '-'),
        }))
      )
    }
    if (toDelete.length > 0) {
      await supabase.from('blog_posts').delete().in('id', toDelete)
    }
  }

  return (
    <SettingsContext.Provider value={{
      loading,
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
