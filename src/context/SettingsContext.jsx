import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { adminData } from '../lib/adminData'

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
  const [ebooks, _setEbooks] = useState([])
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
        { data: ebooksData, error: e4 },
      ] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase.from('apps').select('*').order('sort_order'),
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('ebooks').select('*').order('sort_order'),
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
          descriptionEn: a.description_en || '',
          logo: a.logo || '',
          buyUrl: a.buy_url || '',
          badge: a.badge || 'Web App',
        })))
      }

      if (postsData?.length) {
        _setBlogPosts(postsData.map(p => ({
          id: p.id,
          title: p.title,
          titleEn: p.title_en || '',
          date: p.date || '',
          excerpt: p.excerpt || '',
          excerptEn: p.excerpt_en || '',
          slug: p.slug || '',
          likesCount: p.likes_count || 0,
        })))
      }

      if (ebooksData?.length) {
        _setEbooks(ebooksData.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description || '',
          price: e.price || '',
          platform: e.platform || 'hotmart',
          buyUrl: e.buy_url || '',
          cover: e.cover || '',
        })))
      }
    } catch (err) {
      setDbError(`Erro inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Writes go through adminData (the admin-data edge function). RLS no longer
  // lets the anon key write to these tables, so a missing admin token surfaces
  // here as an error rather than a silent no-op.
  async function saveSetting(key, value, label) {
    try {
      await adminData.upsert('settings', { key, value })
    } catch (e) {
      setDbError(`Erro ao salvar ${label}: ${e.message}`)
    }
  }

  async function setLogo(url) {
    _setLogo(url)
    await saveSetting('logo', url, 'logo')
  }

  async function setContactEmail(email) {
    _setContactEmail(email)
    await saveSetting('contact_email', email, 'email')
  }

  async function setSocialLinks(links) {
    _setSocialLinks(links)
    await saveSetting('social_links', links, 'redes sociais')
  }

  // Replace the whole collection: upsert what remains, delete what's gone.
  async function syncCollection(table, label, items, toRow) {
    const { data: current, error: fetchErr } = await supabase.from(table).select('id')
    if (fetchErr) { setDbError(`Erro ao ler ${label}: ${fetchErr.message}`); return }

    const newIds = items.map(i => String(i.id))
    const toDelete = (current || []).map(r => r.id).filter(id => !newIds.includes(id))

    try {
      if (items.length > 0) await adminData.upsert(table, items.map(toRow))
      if (toDelete.length > 0) await adminData.remove(table, { id: toDelete })
    } catch (e) {
      setDbError(`Erro ao salvar ${label}: ${e.message}`)
    }
  }

  async function setApps(newApps) {
    _setApps(newApps)
    await syncCollection('apps', 'apps', newApps, (a, i) => ({
      id: String(a.id),
      name: a.name,
      description: a.description || '',
      description_en: a.descriptionEn || '',
      logo: a.logo || '',
      buy_url: a.buyUrl || '',
      badge: a.badge || 'Web App',
      sort_order: i,
    }))
  }

  async function setBlogPosts(newPosts) {
    _setBlogPosts(newPosts)
    await syncCollection('blog_posts', 'posts', newPosts, p => ({
      id: String(p.id),
      title: p.title,
      title_en: p.titleEn || '',
      date: p.date || '',
      excerpt: p.excerpt || '',
      excerpt_en: p.excerptEn || '',
      slug: p.slug || p.title.toLowerCase().replace(/\s+/g, '-'),
    }))
  }

  async function setEbooks(newEbooks) {
    _setEbooks(newEbooks)
    await syncCollection('ebooks', 'ebooks', newEbooks, (e, i) => ({
      id: String(e.id),
      title: e.title,
      description: e.description || '',
      price: e.price || '',
      platform: e.platform || 'hotmart',
      buy_url: e.buyUrl || '',
      cover: e.cover || '',
      sort_order: i,
    }))
  }

  return (
    <SettingsContext.Provider value={{
      loading, dbError, setDbError,
      logo, setLogo,
      apps, setApps,
      blogPosts, setBlogPosts,
      ebooks, setEbooks,
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
