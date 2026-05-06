import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
  const [dbError, setDbError] = useState('')
  const [logo, _setLogo] = useState('')
  const [apps, _setApps] = useState([])
  const [blogPosts, _setBlogPosts] = useState([])
  const [contactEmail, _setContactEmail] = useState(DEFAULT_EMAIL)
  const [socialLinks, _setSocialLinks] = useState(DEFAULT_SOCIAL)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    setDbError('')
    try {
      const [
        { data: settingsData, error: e1 },
        { data: appsData, error: e2 },
        { data: postsData, error: e3 },
      ] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase.from('apps').select('*').order('sort_order'),
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
      ])

      if (e1 || e2 || e3) {
        const msg = (e1 || e2 || e3).message
        setDbError(`Erro de conexão: ${msg}`)
        return
      }

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
      setDbError(`Erro inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function setLogo(url) {
    _setLogo(url)
    const { error } = await supabase.from('settings').upsert({ key: 'logo', value: url })
    if (error) setDbError(`Erro ao salvar logo: ${error.message}`)
  }

  async function setContactEmail(email) {
    _setContactEmail(email)
    const { error } = await supabase.from('settings').upsert({ key: 'contact_email', value: email })
    if (error) setDbError(`Erro ao salvar email: ${error.message}`)
  }

  async function setSocialLinks(links) {
    _setSocialLinks(links)
    const { error } = await supabase.from('settings').upsert({ key: 'social_links', value: links })
    if (error) setDbError(`Erro ao salvar redes sociais: ${error.message}`)
  }

  async function setApps(newApps) {
    _setApps(newApps)
    const { data: current, error: fetchErr } = await supabase.from('apps').select('id')
    if (fetchErr) { setDbError(`Erro ao ler apps: ${fetchErr.message}`); return }

    const currentIds = (current || []).map(a => a.id)
    const newIds = newApps.map(a => String(a.id))
    const toDelete = currentIds.filter(id => !newIds.includes(id))

    if (newApps.length > 0) {
      const { error: upsertErr } = await supabase.from('apps').upsert(
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
      if (upsertErr) { setDbError(`Erro ao salvar apps: ${upsertErr.message}`); return }
    }
    if (toDelete.length > 0) {
      const { error: delErr } = await supabase.from('apps').delete().in('id', toDelete)
      if (delErr) setDbError(`Erro ao remover apps: ${delErr.message}`)
    }
  }

  async function setBlogPosts(newPosts) {
    _setBlogPosts(newPosts)
    const { data: current, error: fetchErr } = await supabase.from('blog_posts').select('id')
    if (fetchErr) { setDbError(`Erro ao ler posts: ${fetchErr.message}`); return }

    const currentIds = (current || []).map(p => p.id)
    const newIds = newPosts.map(p => String(p.id))
    const toDelete = currentIds.filter(id => !newIds.includes(id))

    if (newPosts.length > 0) {
      const { error: upsertErr } = await supabase.from('blog_posts').upsert(
        newPosts.map(p => ({
          id: String(p.id),
          title: p.title,
          date: p.date || '',
          excerpt: p.excerpt || '',
          slug: p.slug || p.title.toLowerCase().replace(/\s+/g, '-'),
        }))
      )
      if (upsertErr) { setDbError(`Erro ao salvar posts: ${upsertErr.message}`); return }
    }
    if (toDelete.length > 0) {
      await supabase.from('blog_posts').delete().in('id', toDelete)
    }
  }

  return (
    <SettingsContext.Provider value={{
      loading, dbError, setDbError,
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
