import { useState, useRef, useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'
import { supabase } from '../lib/supabase'
import AgentChat from './AgentChat'
import AgentPipeline from './AgentPipeline'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'bitzen@1987Admin'

const SOCIAL_LABELS = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  github: 'GitHub',
}

const emptyApp = { name: '', description: '', logo: '', buyUrl: '', badge: 'Web App' }
const emptyPost = { title: '', date: new Date().toISOString().slice(0, 10), excerpt: '' }

// ── Upload de imagem ─────────────────────────────────────────────────────────

function ImageUpload({ value, onChange, label, small, storageFolder = 'misc' }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${storageFolder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      onChange(data.publicUrl)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => onChange(ev.target.result)
      reader.readAsDataURL(file)
      setUploadError('Storage indisponível — usando base64')
    }
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${small ? 'w-10 h-10' : 'w-20 h-20'} rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer`}
        onClick={() => !uploading && ref.current.click()}
      >
        {uploading ? (
          <div className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
        ) : value ? (
          <img src={value} alt={label} className="w-full h-full object-contain p-1" />
        ) : (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => !uploading && ref.current.click()} className="text-xs text-accent-blue hover:underline text-left">
          {uploading ? 'Enviando...' : value ? 'Trocar imagem' : `Selecionar ${label}`}
        </button>
        {value && !uploading && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:underline text-left">Remover</button>
        )}
        {uploadError && <p className="text-xs text-yellow-500">{uploadError}</p>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Form helpers ─────────────────────────────────────────────────────────────

function Field({ label, textarea, ...props }) {
  const cls = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
  return (
    <div>
      <label className="block text-gray-400 text-xs font-medium mb-1.5">{label}</label>
      {textarea
        ? <textarea rows={2} className={cls + ' resize-none'} {...props} />
        : <input className={cls} {...props} />}
    </div>
  )
}

function FormButtons({ onCancel }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity">Salvar</button>
      <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-400 bg-surface border border-border hover:text-white transition-colors">Cancelar</button>
    </div>
  )
}

function AppForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? emptyApp)
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="bg-background border border-accent-purple/30 rounded-xl p-4 flex flex-col gap-3">
      <div>
        <label className="block text-gray-400 text-xs font-medium mb-1.5">Logo do App</label>
        <ImageUpload small value={form.logo} onChange={(v) => setForm((p) => ({ ...p, logo: v }))} label="logo" storageFolder="apps" />
      </div>
      <Field label="Nome do App" name="name" value={form.name} onChange={set} placeholder="Ex: FinanceiroApp" required />
      <Field label="Descrição" name="description" value={form.description} onChange={set} placeholder="Breve descrição..." required textarea />
      <Field label="Link de Compra (URL)" name="buyUrl" type="url" value={form.buyUrl} onChange={set} placeholder="https://..." required />
      <FormButtons onCancel={onCancel} />
    </form>
  )
}

function PostForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? emptyPost)
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="bg-background border border-accent-purple/30 rounded-xl p-4 flex flex-col gap-3">
      <Field label="Título" name="title" value={form.title} onChange={set} placeholder="Título da postagem" required />
      <Field label="Data" name="date" type="date" value={form.date} onChange={set} required />
      <Field label="Resumo" name="excerpt" value={form.excerpt} onChange={set} placeholder="Breve descrição do post..." required textarea />
      <FormButtons onCancel={onCancel} />
    </form>
  )
}

const emptyEbook = { title: '', description: '', price: '', platform: 'hotmart', buyUrl: '', cover: '' }

function EbookForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? emptyEbook)
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="bg-background border border-accent-purple/30 rounded-xl p-4 flex flex-col gap-3">
      <div>
        <label className="block text-gray-400 text-xs font-medium mb-1.5">Capa do Ebook</label>
        <ImageUpload small value={form.cover} onChange={(v) => setForm((p) => ({ ...p, cover: v }))} label="capa" storageFolder="ebooks" />
      </div>
      <Field label="Título" name="title" value={form.title} onChange={set} placeholder="Ex: Guia de Gestão de Clínicas" required />
      <Field label="Descrição" name="description" value={form.description} onChange={set} placeholder="Breve descrição do conteúdo..." textarea />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço" name="price" value={form.price} onChange={set} placeholder="Ex: R$ 47,00" />
        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5">Plataforma</label>
          <select name="platform" value={form.platform} onChange={set}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-purple/60 transition-colors">
            <option value="hotmart">Hotmart</option>
            <option value="kiwify">Kiwify</option>
          </select>
        </div>
      </div>
      <Field label="Link de compra (URL)" name="buyUrl" type="url" value={form.buyUrl} onChange={set} placeholder="https://pay.hotmart.com/..." required />
      <FormButtons onCancel={onCancel} />
    </form>
  )
}

function ItemRow({ logo, initial, title, subtitle, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-3 py-2.5">
      {logo !== undefined && (
        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
          {logo
            ? <img src={logo} alt={title} className="w-full h-full object-contain p-1" />
            : <span className="text-xs font-bold text-accent-purple">{initial}</span>}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{title}</p>
        <p className="text-gray-500 text-xs truncate">{subtitle}</p>
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-accent-blue transition-colors rounded-lg hover:bg-surface" title="Editar">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-surface" title="Remover">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function AddButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      className="w-full py-3 rounded-xl text-sm font-medium text-gray-500 border border-dashed border-border hover:border-accent-purple/50 hover:text-accent-purple transition-all duration-200 flex items-center justify-center gap-2 mt-1">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  )
}

// ── Login ────────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }) {
  const [form, setForm] = useState({ user: '', pass: '' })
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (form.user === ADMIN_USER && form.pass === ADMIN_PASS) {
      sessionStorage.setItem('bitzen_auth', '1')
      onSuccess()
    } else {
      setError(true)
      setForm((p) => ({ ...p, pass: '' }))
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/30 mb-6">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-white text-xl font-bold text-center mb-1">Painel Admin</h2>
      <p className="text-gray-500 text-sm text-center mb-6">Acesso restrito à equipe Bitzen</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5">Usuário</label>
          <input type="text" autoComplete="username" required value={form.user}
            onChange={(e) => setForm((p) => ({ ...p, user: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
            placeholder="Digite seu usuário" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5">Senha</label>
          <input type="password" autoComplete="current-password" required value={form.pass}
            onChange={(e) => setForm((p) => ({ ...p, pass: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
            placeholder="••••••••" />
        </div>
        {error && (
          <p className="text-red-400 text-xs text-center bg-red-400/10 border border-red-400/20 rounded-lg py-2">
            Usuário ou senha incorretos
          </p>
        )}
        <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity mt-1">
          Acessar painel
        </button>
      </form>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

const AGENT_LIST = [
  { id: 'agendafacil', name: 'Agenda Fácil', desc: 'Especialista em agendamento para clínicas', color: 'from-blue-500 to-cyan-400', group: 'produto' },
  { id: 'clockly', name: 'Clockly', desc: 'Ponto eletrônico, RH e folha de pagamento', color: 'from-indigo-500 to-purple-600', group: 'produto' },
  { id: 'ritmowork', name: 'RitmoWork', desc: 'Gestão de projetos e produtividade', color: 'from-violet-500 to-purple-500', group: 'produto' },
  { id: 'vinculo', name: 'Vínculo', desc: 'Prontuário eletrônico TCC para psicólogos', color: 'from-teal-500 to-emerald-400', group: 'produto' },
  { id: 'pesquisador', name: 'Pesquisador', desc: 'Analisa mercado, concorrentes e tendências', color: 'from-amber-500 to-orange-500', group: 'funcional' },
  { id: 'copywriter', name: 'Copywriter', desc: 'Cria posts e conteúdo de marketing', color: 'from-pink-500 to-rose-500', group: 'funcional' },
  { id: 'revisor', name: 'Revisor', desc: 'Revê e melhora conteúdos criados', color: 'from-green-500 to-teal-500', group: 'funcional' },
  { id: 'gerente', name: 'Gerente', desc: 'Aprova ou devolve conteúdos para revisão', color: 'from-red-500 to-orange-600', group: 'funcional' },
]

export default function SettingsPanel() {
  const { logo, setLogo, apps, setApps, blogPosts, setBlogPosts, ebooks, setEbooks, contactEmail, setContactEmail, socialLinks, setSocialLinks, dbError, setDbError, loading } = useSettings()

  const [open, setOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('bitzen_auth') === '1')
  const [section, setSection] = useState('overview')
  const [linkedinGroups, setLinkedinGroups] = useState([])
  const [newGroup, setNewGroup] = useState({ id: '', name: '' })
  const [agentChatId, setAgentChatId] = useState(null)
  const [pipelineOpen, setPipelineOpen] = useState(false)

  const [addingApp, setAddingApp] = useState(false)
  const [editingAppId, setEditingAppId] = useState(null)
  const [addingPost, setAddingPost] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [aiPostModal, setAiPostModal] = useState(false)
  const [aiPostTopic, setAiPostTopic] = useState('')
  const [aiPostProduct, setAiPostProduct] = useState('')
  const [aiPostGenerating, setAiPostGenerating] = useState(false)
  const [aiPostPreview, setAiPostPreview] = useState(null)
  const [aiPostSaving, setAiPostSaving] = useState(false)
  const [aiPostAdjustInput, setAiPostAdjustInput] = useState('')
  const [aiPostAdjusting, setAiPostAdjusting] = useState(false)
  const [addingEbook, setAddingEbook] = useState(false)
  const [editingEbookId, setEditingEbookId] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [linkedinPosts, setLinkedinPosts] = useState([])
  const [statsFrom, setStatsFrom] = useState('')
  const [statsTo, setStatsTo] = useState('')
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsFetched, setStatsFetched] = useState(false)

  useEffect(() => {
    if (open && authenticated) {
      loadTestimonials()
      loadLinkedinGroups()
    }
  }, [open, authenticated])

  async function loadLinkedinGroups() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'linkedin_groups').maybeSingle()
    if (data?.value) { try { setLinkedinGroups(JSON.parse(data.value)) } catch {} }
  }

  async function saveLinkedinGroups(groups) {
    setLinkedinGroups(groups)
    const val = JSON.stringify(groups)
    const { data } = await supabase.from('settings').select('id').eq('key', 'linkedin_groups').maybeSingle()
    if (data) await supabase.from('settings').update({ value: val }).eq('key', 'linkedin_groups')
    else await supabase.from('settings').insert({ key: 'linkedin_groups', value: val })
  }

  function addLinkedinGroup() {
    const id = newGroup.id.trim().replace(/\D/g, '')
    const name = newGroup.name.trim()
    if (!id || !name) return
    saveLinkedinGroups([...linkedinGroups, { id, name }])
    setNewGroup({ id: '', name: '' })
  }

  function removeLinkedinGroup(id) {
    saveLinkedinGroups(linkedinGroups.filter(g => g.id !== id))
  }

  async function loadLinkedinStats(from, to) {
    setLoadingStats(true)
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-stats', {
        body: { from: from || undefined, to: to || undefined },
      })
      if (!error && data?.posts) setLinkedinPosts(data.posts)
    } finally {
      setLoadingStats(false)
      setStatsFetched(true)
    }
  }

  async function loadTestimonials() {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
    setTestimonials(data || [])
  }

  async function approveTestimonial(id) {
    await supabase.from('testimonials').update({ approved: true }).eq('id', id)
    setTestimonials(p => p.map(t => t.id === id ? { ...t, approved: true } : t))
  }

  async function deleteTestimonial(id) {
    if (!window.confirm('Remover este comentário?')) return
    await supabase.from('testimonials').delete().eq('id', id)
    setTestimonials(p => p.filter(t => t.id !== id))
  }

  function closePanel() {
    setOpen(false)
    setAddingApp(false)
    setEditingAppId(null)
    setAddingPost(false)
    setEditingPostId(null)
    setAgentChatId(null)
  }

  function logout() {
    sessionStorage.removeItem('bitzen_auth')
    setAuthenticated(false)
    closePanel()
  }

  function handleAddApp(data) { setApps([...apps, { ...data, id: Date.now() }]); setAddingApp(false) }
  function handleEditApp(data) { setApps(apps.map((a) => a.id === editingAppId ? { ...data, id: editingAppId } : a)); setEditingAppId(null) }
  function handleDeleteApp(id) { if (window.confirm('Remover este app?')) setApps(apps.filter((a) => a.id !== id)) }

  function handleAddPost(data) { setBlogPosts([{ ...data, id: Date.now() }, ...blogPosts]); setAddingPost(false) }
  function handleEditPost(data) { setBlogPosts(blogPosts.map((x) => x.id === editingPostId ? { ...data, id: editingPostId } : x)); setEditingPostId(null) }
  function handleDeletePost(id) { if (window.confirm('Remover esta postagem?')) setBlogPosts(blogPosts.filter((x) => x.id !== id)) }

  async function generateAiPost() {
    if (!aiPostTopic.trim()) return
    setAiPostGenerating(true)
    setAiPostPreview(null)
    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          role: 'blogwriter',
          product: aiPostProduct || undefined,
          messages: [{ role: 'user', content: `Cria um artigo de blog sobre: ${aiPostTopic}` }],
        },
      })
      if (error) throw error
      const raw = data?.content ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Resposta inválida da IA')
      const parsed = JSON.parse(jsonMatch[0])
      setAiPostPreview(parsed)
    } catch (e) {
      alert('Erro ao gerar post: ' + e.message)
    } finally {
      setAiPostGenerating(false)
    }
  }

  async function publishAiPost() {
    if (!aiPostPreview) return
    setAiPostSaving(true)
    try {
      const newPost = {
        id: Date.now(),
        title: aiPostPreview.title,
        titleEn: aiPostPreview.title_en,
        date: new Date().toISOString().slice(0, 10),
        excerpt: aiPostPreview.excerpt,
        excerptEn: aiPostPreview.excerpt_en,
        slug: aiPostPreview.slug,
      }
      await setBlogPosts([newPost, ...blogPosts])
      setAiPostModal(false)
      setAiPostTopic('')
      setAiPostProduct('')
      setAiPostPreview(null)
    } catch (e) {
      alert('Erro ao publicar: ' + e.message)
    } finally {
      setAiPostSaving(false)
    }
  }

  async function adjustAiPost() {
    if (!aiPostAdjustInput.trim() || aiPostAdjusting || !aiPostPreview) return
    const msg = aiPostAdjustInput.trim()
    setAiPostAdjustInput('')
    setAiPostAdjusting(true)
    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          role: 'blogwriter',
          product: aiPostProduct || undefined,
          messages: [{
            role: 'user',
            content: `Post actual em PT:\nTítulo: ${aiPostPreview.title}\nTexto: ${aiPostPreview.excerpt}\n\nPost actual em EN:\nTitle: ${aiPostPreview.title_en}\nText: ${aiPostPreview.excerpt_en}\n\nAjuste pedido: "${msg}"\n\nAplica APENAS o ajuste pedido e devolve o JSON completo com os 5 campos actualizados (title, title_en, excerpt, excerpt_en, slug).`,
          }],
        },
      })
      if (error) throw error
      const raw = data?.content ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Resposta inválida')
      setAiPostPreview(JSON.parse(jsonMatch[0]))
    } catch (e) {
      alert('Erro ao ajustar: ' + e.message)
    } finally {
      setAiPostAdjusting(false)
    }
  }

  function handleAddEbook(data) { setEbooks([...(ebooks || []), { ...data, id: Date.now() }]); setAddingEbook(false) }
  function handleEditEbook(data) { setEbooks((ebooks || []).map((x) => x.id === editingEbookId ? { ...data, id: editingEbookId } : x)); setEditingEbookId(null) }
  function handleDeleteEbook(id) { if (window.confirm('Remover este ebook?')) setEbooks((ebooks || []).filter((x) => x.id !== id)) }

  const pending = testimonials.filter(t => !t.approved)
  const approved = testimonials.filter(t => t.approved)

  function getAgentLogo(agentId) {
    return apps.find(a => a.name.toLowerCase().replace(/\s/g, '').startsWith(agentId.replace('agendafacil', 'agenda')))?.logo
  }

  const NAV = [
    { id: 'overview', label: 'Visão Geral', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'apps', label: 'Produtos', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { id: 'agents', label: 'Agentes IA', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" /></svg> },
    { id: 'blog', label: 'Blog', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
    { id: 'ebooks', label: 'Ebooks', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { id: 'linkedin', label: 'Publicações', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
    { id: 'comments', label: 'Comentários', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { id: 'config', label: 'Configurações', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ]

  const currentNav = NAV.find(n => n.id === section)

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-2 right-4 z-[60] w-10 h-10 rounded-full bg-surface border border-border text-gray-400 hover:text-white hover:border-accent-purple/60 shadow-lg shadow-black/30 transition-all duration-200 flex items-center justify-center group"
        aria-label="Painel Admin"
        title="Painel Admin"
      >
        <span className="group-hover:rotate-45 transition-transform duration-300 block">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
      </button>

      {/* Login modal */}
      {open && !authenticated && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-8">
            <button onClick={closePanel} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <LoginForm onSuccess={() => setAuthenticated(true)} />
          </div>
        </div>
      )}

      {/* Full-screen admin panel */}
      {open && authenticated && (
        <div className="fixed inset-0 z-[60] flex bg-background">

          {/* Sidebar */}
          <div className="w-56 bg-surface border-r border-border flex flex-col flex-shrink-0">
            <div className="px-5 py-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                {logo
                  ? <img src={logo} alt="logo" className="h-8 object-contain max-w-[80px]" />
                  : <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center"><span className="text-white font-bold text-xs">B</span></div>
                }
                <div>
                  <p className="text-white text-sm font-semibold leading-none">Bitzen</p>
                  <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
              {NAV.map(item => (
                <button key={item.id} onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    section === item.id
                      ? 'bg-accent-purple/15 text-accent-purple'
                      : 'text-gray-400 hover:text-white hover:bg-border'
                  }`}>
                  <span className={section === item.id ? 'text-accent-purple' : 'text-gray-500'}>{item.icon}</span>
                  {item.label}
                  {item.id === 'comments' && pending.length > 0 && (
                    <span className="ml-auto bg-yellow-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {pending.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-border flex flex-col gap-1">
              <div className={`flex items-center gap-2 px-3 py-1.5 ${dbError ? 'text-red-400' : 'text-green-400'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dbError ? 'bg-red-400' : 'bg-green-400'}`} />
                <span className="text-xs truncate">{dbError || 'Supabase conectado'}</span>
              </div>
              <button onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-border transition-all duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{currentNav?.icon}</span>
                <h2 className="text-white font-semibold">{currentNav?.label}</h2>
              </div>
              <button onClick={closePanel}
                className="p-2 text-gray-500 hover:text-white hover:bg-border transition-colors rounded-lg"
                title="Fechar painel">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Section content */}
            <div className="flex-1 overflow-y-auto">

              {/* Visão Geral */}
              {section === 'overview' && (
                <div className="p-6 max-w-4xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Produtos', value: apps.length, color: 'from-blue-500 to-cyan-400', target: 'apps' },
                      { label: 'Posts', value: blogPosts.length, color: 'from-violet-500 to-purple-500', target: 'blog' },
                      { label: 'Aprovados', value: approved.length, color: 'from-green-500 to-emerald-400', target: 'comments' },
                      { label: 'Pendentes', value: pending.length, color: 'from-yellow-500 to-orange-400', target: 'comments' },
                    ].map(stat => (
                      <button key={stat.label} onClick={() => setSection(stat.target)}
                        className="bg-surface border border-border rounded-2xl p-5 text-left hover:border-accent-purple/40 transition-colors group">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                          <span className="text-white font-bold text-lg">{stat.value}</span>
                        </div>
                        <p className="text-white text-sm font-medium">{stat.label}</p>
                        <p className="text-gray-600 text-xs mt-0.5 group-hover:text-gray-400 transition-colors">Ver todos →</p>
                      </button>
                    ))}
                  </div>

                  {/* Pipeline */}
                  <button onClick={() => setPipelineOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-500/20 border border-purple-500/30 rounded-2xl p-4 text-left hover:border-purple-400/60 transition-colors group flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">Pipeline Completo</p>
                      <p className="text-gray-400 text-xs">Pesquisador → Copywriter → Revisor → Gerente — automático</p>
                    </div>
                    <svg className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <h3 className="text-white text-sm font-semibold mb-3">Especialistas por produto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {AGENT_LIST.filter(a => a.group === 'produto').map(agent => {
                      const agentLogo = getAgentLogo(agent.id)
                      return (
                        <button key={agent.id} onClick={() => setAgentChatId(agent.id)}
                          className="bg-surface border border-border rounded-2xl p-4 text-left hover:border-accent-purple/40 transition-colors group flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                            {agentLogo
                              ? <img src={agentLogo} alt={agent.name} className="w-full h-full object-contain p-1" />
                              : <span className="text-white text-sm font-bold">{agent.name.charAt(0)}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{agent.name}</p>
                            <p className="text-gray-500 text-xs truncate">{agent.desc}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-600 group-hover:text-accent-purple transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )
                    })}
                  </div>
                  <h3 className="text-white text-sm font-semibold mb-3">Agentes funcionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AGENT_LIST.filter(a => a.group === 'funcional').map(agent => (
                      <button key={agent.id} onClick={() => setAgentChatId(agent.id)}
                        className="bg-surface border border-border rounded-2xl p-4 text-left hover:border-accent-purple/40 transition-colors group flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-sm font-bold">{agent.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{agent.name}</p>
                          <p className="text-gray-500 text-xs truncate">{agent.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-accent-purple transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos */}
              {section === 'apps' && (
                <div className="p-6 max-w-2xl">
                  <div className="flex flex-col gap-2">
                    {apps.map((app) =>
                      editingAppId === app.id ? (
                        <AppForm key={app.id} initial={app} onSave={handleEditApp} onCancel={() => setEditingAppId(null)} />
                      ) : (
                        <ItemRow
                          key={app.id}
                          logo={app.logo}
                          initial={app.name.charAt(0)}
                          title={app.name}
                          subtitle={app.description}
                          onEdit={() => { setEditingAppId(app.id); setAddingApp(false) }}
                          onDelete={() => handleDeleteApp(app.id)}
                        />
                      )
                    )}
                    {addingApp ? (
                      <AppForm onSave={handleAddApp} onCancel={() => setAddingApp(false)} />
                    ) : (
                      <AddButton onClick={() => { setAddingApp(true); setEditingAppId(null) }} label="Adicionar Produto" />
                    )}
                  </div>
                </div>
              )}

              {/* Agentes IA */}
              {section === 'agents' && (
                <div className="p-6 max-w-2xl">
                  <p className="text-gray-500 text-sm mb-5">Converse com cada agente e exporte planos em PDF.</p>

                  <button onClick={() => setPipelineOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-500/20 border border-purple-500/30 rounded-2xl p-5 text-left hover:border-purple-400/60 transition-colors group flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">Pipeline Completo</p>
                      <p className="text-gray-400 text-sm mt-0.5">Os 4 agentes trabalham em sequência automaticamente</p>
                    </div>
                    <svg className="w-4 h-4 text-purple-400 group-hover:text-purple-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Especialistas por produto</p>
                  <div className="flex flex-col gap-3 mb-6">
                    {AGENT_LIST.filter(a => a.group === 'produto').map(agent => {
                      const agentLogo = getAgentLogo(agent.id)
                      return (
                        <div key={agent.id} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                            {agentLogo
                              ? <img src={agentLogo} alt={agent.name} className="w-full h-full object-contain p-1" />
                              : <span className="text-white text-base font-bold">{agent.name.charAt(0)}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold">{agent.name}</p>
                            <p className="text-gray-500 text-sm mt-0.5">{agent.desc}</p>
                          </div>
                          <button
                            onClick={() => setAgentChatId(agent.id)}
                            className={`px-4 py-2 bg-gradient-to-r ${agent.color} rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0`}
                          >
                            Consultar
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Agentes funcionais</p>
                  <div className="flex flex-col gap-3">
                    {AGENT_LIST.filter(a => a.group === 'funcional').map(agent => (
                      <div key={agent.id} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-base font-bold">{agent.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold">{agent.name}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{agent.desc}</p>
                        </div>
                        <button
                          onClick={() => setAgentChatId(agent.id)}
                          className={`px-4 py-2 bg-gradient-to-r ${agent.color} rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0`}
                        >
                          Consultar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blog */}
              {section === 'blog' && (
                <div className="p-6 max-w-2xl">
                  {/* Botão Gerar com IA */}
                  <button
                    onClick={() => { setAiPostModal(true); setAiPostPreview(null); setAiPostTopic(''); setAiPostProduct('') }}
                    className="w-full mb-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Gerar Post com IA (PT + EN)
                  </button>

                  <div className="flex flex-col gap-2">
                    {blogPosts.map((post) =>
                      editingPostId === post.id ? (
                        <PostForm key={post.id} initial={post} onSave={handleEditPost} onCancel={() => setEditingPostId(null)} />
                      ) : (
                        <ItemRow
                          key={post.id}
                          title={post.title}
                          subtitle={post.date}
                          onEdit={() => { setEditingPostId(post.id); setAddingPost(false) }}
                          onDelete={() => handleDeletePost(post.id)}
                        />
                      )
                    )}
                    {addingPost ? (
                      <PostForm onSave={handleAddPost} onCancel={() => setAddingPost(false)} />
                    ) : (
                      <AddButton onClick={() => { setAddingPost(true); setEditingPostId(null) }} label="Adicionar Postagem" />
                    )}
                  </div>
                </div>
              )}

              {/* Modal — Gerar Post com IA */}
              {aiPostModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !aiPostGenerating && !aiPostSaving && setAiPostModal(false)} />
                  <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0 bg-gradient-to-r from-purple-600/10 to-orange-500/10">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">Gerar Post com IA</p>
                        <p className="text-gray-400 text-xs">Português + Inglês, pronto para publicar</p>
                      </div>
                      <button onClick={() => setAiPostModal(false)} disabled={aiPostGenerating || aiPostSaving} className="text-gray-500 hover:text-white disabled:opacity-40">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>

                    <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5" style={{ maxHeight: '60vh' }}>
                      {/* Form */}
                      {!aiPostPreview && (
                        <>
                          <div>
                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Tema ou título do artigo *</label>
                            <textarea
                              value={aiPostTopic}
                              onChange={e => setAiPostTopic(e.target.value)}
                              rows={3}
                              placeholder='Ex: "Como o ponto electrónico reduz erros de folha de pagamento" ou "5 erros comuns na gestão de RH"'
                              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs font-medium mb-1.5">Produto relacionado (opcional)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: '', label: 'Genérico', color: 'from-gray-500 to-gray-600' },
                                { id: 'agendafacil', label: 'AgendaFácil', color: 'from-blue-500 to-cyan-400' },
                                { id: 'clockly', label: 'Clockly', color: 'from-indigo-500 to-purple-600' },
                                { id: 'ritmowork', label: 'RitmoWork', color: 'from-violet-500 to-purple-500' },
                                { id: 'vinculo', label: 'Vínculo', color: 'from-teal-500 to-emerald-400' },
                              ].map(p => (
                                <button key={p.id} onClick={() => setAiPostProduct(p.id)}
                                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                                    aiPostProduct === p.id
                                      ? `bg-gradient-to-r ${p.color} text-white border-transparent`
                                      : 'bg-background border-border text-gray-400 hover:text-white'
                                  }`}>
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={generateAiPost}
                            disabled={!aiPostTopic.trim() || aiPostGenerating}
                            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                          >
                            {aiPostGenerating
                              ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>A gerar...</>
                              : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Gerar Post</>
                            }
                          </button>
                        </>
                      )}

                      {/* Preview */}
                      {aiPostPreview && (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Post gerado com sucesso
                          </div>

                          {/* PT */}
                          <div className="bg-background rounded-xl p-4 border border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">🇧🇷 PT</span>
                            </div>
                            <p className="text-white font-semibold text-sm mb-2">{aiPostPreview.title}</p>
                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{aiPostPreview.excerpt}</p>
                          </div>

                          {/* EN */}
                          <div className="bg-background rounded-xl p-4 border border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">🇺🇸 EN</span>
                            </div>
                            <p className="text-white font-semibold text-sm mb-2">{aiPostPreview.title_en}</p>
                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{aiPostPreview.excerpt_en}</p>
                          </div>

                          <p className="text-gray-600 text-xs">Slug: <span className="text-gray-400">{aiPostPreview.slug}</span></p>
                        </div>
                      )}
                    </div>

                    {/* Footer fixo — sempre visível */}
                    {aiPostPreview && (
                      <div className="border-t border-border px-6 py-4 flex flex-col gap-3 flex-shrink-0 bg-surface">
                        <div>
                          <p className="text-gray-400 text-xs font-medium mb-2">Pedir ajustes ao post</p>
                          <div className="flex gap-2">
                            <input
                              value={aiPostAdjustInput}
                              onChange={e => setAiPostAdjustInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); adjustAiPost() } }}
                              placeholder='Ex: "Muda o título para 2025" ou "Torna o tom mais informal"'
                              disabled={aiPostAdjusting}
                              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 disabled:opacity-50"
                            />
                            <button
                              onClick={adjustAiPost}
                              disabled={!aiPostAdjustInput.trim() || aiPostAdjusting}
                              className="px-3 py-2 bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              {aiPostAdjusting
                                ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                : '✏️'}
                              {aiPostAdjusting ? 'A ajustar...' : 'Ajustar'}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setAiPostPreview(null)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-background border border-border hover:text-white transition-colors">
                            Gerar novamente
                          </button>
                          <button onClick={publishAiPost} disabled={aiPostSaving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                            {aiPostSaving
                              ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>A publicar...</>
                              : '✅ Publicar no Blog'
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ebooks */}
              {section === 'ebooks' && (
                <div className="p-6 max-w-2xl">
                  <p className="text-gray-500 text-sm mb-5">Ebooks vendidos na Hotmart ou Kiwify — aparecerão na seção Ebooks da landing page.</p>
                  <div className="flex flex-col gap-2">
                    {(ebooks || []).map((ebook) =>
                      editingEbookId === ebook.id ? (
                        <EbookForm key={ebook.id} initial={ebook} onSave={handleEditEbook} onCancel={() => setEditingEbookId(null)} />
                      ) : (
                        <div key={ebook.id} className="flex items-center gap-3 bg-background border border-border rounded-xl px-3 py-2.5">
                          <div className="w-9 h-12 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                            {ebook.cover
                              ? <img src={ebook.cover} alt={ebook.title} className="w-full h-full object-cover" />
                              : <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{ebook.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${ebook.platform === 'kiwify' ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-orange-500/15 text-orange-400 border-orange-500/20'}`}>
                                {ebook.platform === 'kiwify' ? 'Kiwify' : 'Hotmart'}
                              </span>
                              {ebook.price && <span className="text-gray-500 text-xs">{ebook.price}</span>}
                            </div>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            <button onClick={() => { setEditingEbookId(ebook.id); setAddingEbook(false) }} className="p-1.5 text-gray-500 hover:text-accent-blue transition-colors rounded-lg hover:bg-surface">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteEbook(ebook.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-surface">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      )
                    )}
                    {addingEbook ? (
                      <EbookForm onSave={handleAddEbook} onCancel={() => setAddingEbook(false)} />
                    ) : (
                      <AddButton onClick={() => { setAddingEbook(true); setEditingEbookId(null) }} label="Adicionar Ebook" />
                    )}
                  </div>
                </div>
              )}

              {/* Publicações LinkedIn */}
              {section === 'linkedin' && (
                <div className="p-6 max-w-4xl">
                  {/* Date filter */}
                  <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
                    <h3 className="text-white text-sm font-semibold mb-4">Filtro por período</h3>
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-gray-400 text-xs font-medium mb-1.5">De</label>
                        <input
                          type="date"
                          value={statsFrom}
                          onChange={e => setStatsFrom(e.target.value)}
                          className="bg-background border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent-purple/60 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs font-medium mb-1.5">Até</label>
                        <input
                          type="date"
                          value={statsTo}
                          onChange={e => setStatsTo(e.target.value)}
                          className="bg-background border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent-purple/60 transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => loadLinkedinStats(statsFrom, statsTo)}
                        disabled={loadingStats}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0077B5] hover:bg-[#006097] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {loadingStats && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
                        {loadingStats ? 'Buscando...' : 'Buscar'}
                      </button>
                      {!statsFetched && (
                        <button
                          onClick={() => loadLinkedinStats('', '')}
                          disabled={loadingStats}
                          className="px-4 py-2.5 rounded-xl text-sm text-gray-400 border border-border hover:text-white hover:border-accent-purple/40 transition-colors"
                        >
                          Ver todos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Posts table */}
                  {statsFetched && (
                    linkedinPosts.length === 0 ? (
                      <div className="text-center py-16 text-gray-600">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        <p className="text-sm">Nenhuma publicação encontrada no período</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* Summary row */}
                        <div className="grid grid-cols-3 gap-3 mb-2">
                          {[
                            { label: 'Total de posts', value: linkedinPosts.length, icon: '📄' },
                            { label: 'Total de likes', value: linkedinPosts.reduce((s, p) => s + (p.likes || 0), 0), icon: '👍' },
                            { label: 'Total de comentários', value: linkedinPosts.reduce((s, p) => s + (p.comments || 0), 0), icon: '💬' },
                          ].map(stat => (
                            <div key={stat.label} className="bg-surface border border-border rounded-xl p-4 text-center">
                              <p className="text-2xl mb-1">{stat.icon}</p>
                              <p className="text-white font-bold text-xl">{stat.value}</p>
                              <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Post rows */}
                        {linkedinPosts.map(post => {
                          const agent = AGENT_LIST.find(a => a.id === post.agent_id)
                          const date = post.published_at
                            ? new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'
                          return (
                            <div key={post.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent?.color ?? 'from-gray-600 to-gray-500'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                  <span className="text-white text-xs font-bold">{(agent?.name ?? post.agent_id ?? '?').charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm leading-relaxed line-clamp-2">{post.text_preview}</p>
                                  <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span className="text-gray-500 text-xs">{date}</span>
                                    {post.destination && (
                                      <span className="text-xs bg-[#0077B5]/15 text-[#0ea5e9] px-2 py-0.5 rounded-full">
                                        {post.destination === 'feed' ? 'Feed pessoal' : post.destination}
                                      </span>
                                    )}
                                    {agent && (
                                      <span className="text-xs text-gray-600">{agent.name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-4 pt-1 border-t border-border/60">
                                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                  <span>{post.likes ?? 0} likes</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                  <span>{post.comments ?? 0} comentários</span>
                                </div>
                                {(post.likes === 0 && post.comments === 0) && (
                                  <span className="text-gray-700 text-xs ml-auto">stats não disponíveis — requer r_member_social</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  )}

                  {!statsFetched && !loadingStats && (
                    <div className="text-center py-16 text-gray-600">
                      <p className="text-sm">Selecione um período e clique em Buscar, ou clique em "Ver todos".</p>
                    </div>
                  )}
                </div>
              )}

              {/* Comentários */}
              {section === 'comments' && (
                <div className="p-6 max-w-2xl">
                  {pending.length > 0 && (
                    <div className="mb-6">
                      <p className="text-yellow-500 text-sm font-semibold mb-3">Aguardando aprovação ({pending.length})</p>
                      <div className="flex flex-col gap-2">
                        {pending.map(t => (
                          <div key={t.id} className="bg-surface border border-yellow-500/20 rounded-xl px-4 py-3">
                            <p className="text-white text-sm font-medium">{t.name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{t.message}</p>
                            <div className="flex gap-3 mt-2">
                              <button onClick={() => approveTestimonial(t.id)} className="text-xs text-green-400 hover:underline">Aprovar</button>
                              <button onClick={() => deleteTestimonial(t.id)} className="text-xs text-red-400 hover:underline">Remover</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {approved.length > 0 && (
                    <div>
                      <p className="text-green-500 text-sm font-semibold mb-3">Publicados ({approved.length})</p>
                      <div className="flex flex-col gap-2">
                        {approved.map(t => (
                          <div key={t.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{t.name}</p>
                              <p className="text-gray-500 text-xs truncate">{t.message}</p>
                            </div>
                            <button onClick={() => deleteTestimonial(t.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg flex-shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {testimonials.length === 0 && (
                    <p className="text-gray-600 text-sm">Ainda sem comentários de visitantes.</p>
                  )}
                </div>
              )}

              {/* Configurações */}
              {section === 'config' && (
                <div className="p-6 max-w-xl flex flex-col gap-8">
                  <div>
                    <h3 className="text-white text-sm font-semibold mb-3">Logo da Empresa</h3>
                    <ImageUpload value={logo} onChange={setLogo} label="logo da empresa" storageFolder="logos" />
                    <p className="text-gray-600 text-xs mt-2">PNG ou SVG com fundo transparente.</p>
                  </div>
                  <div className="border-t border-border" />
                  <div>
                    <h3 className="text-white text-sm font-semibold mb-3">Email de Contato</h3>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contato@suaempresa.com"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
                    />
                  </div>
                  <div className="border-t border-border" />

                  {/* LinkedIn Groups */}
                  <div>
                    <h3 className="text-white text-sm font-semibold mb-1">Grupos LinkedIn</h3>
                    <p className="text-gray-600 text-xs mb-3">
                      Encontre o ID do grupo na URL: linkedin.com/groups/<span className="text-accent-purple">ID</span>
                    </p>
                    <div className="flex flex-col gap-2 mb-3">
                      {linkedinGroups.map(g => (
                        <div key={g.id} className="flex items-center gap-3 bg-background border border-border rounded-xl px-3 py-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0077B5]/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-[#0ea5e9]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{g.name}</p>
                            <p className="text-gray-500 text-xs">ID: {g.id}</p>
                          </div>
                          <button onClick={() => removeLinkedinGroup(g.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="bg-background border border-border rounded-xl p-3 flex flex-col gap-2">
                      <input value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                        placeholder="Nome do grupo (ex: SaaS Brasil)"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors" />
                      <input value={newGroup.id} onChange={e => setNewGroup(p => ({ ...p, id: e.target.value }))}
                        placeholder="ID do grupo (só números)"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors" />
                      <button onClick={addLinkedinGroup} disabled={!newGroup.id.trim() || !newGroup.name.trim()}
                        className="w-full py-2 rounded-lg text-sm font-semibold text-white bg-[#0077B5] hover:bg-[#006097] transition-colors disabled:opacity-40">
                        Adicionar grupo
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border" />
                  <div>
                    <h3 className="text-white text-sm font-semibold mb-3">Redes Sociais</h3>
                    <div className="flex flex-col gap-3">
                      {Object.entries(SOCIAL_LABELS).map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-gray-400 text-xs font-medium mb-1.5">{label}</label>
                          <input
                            type="url"
                            value={socialLinks[key] || ''}
                            onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                            placeholder={`https://${key}.com/suapagina`}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-600 text-xs mt-2">Deixe em branco para ocultar o ícone.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* AgentChat modal */}
      {agentChatId && (
        <AgentChat
          agentId={agentChatId}
          agentLogo={getAgentLogo(agentChatId)}
          onClose={() => setAgentChatId(null)}
        />
      )}

      {/* Pipeline modal */}
      {pipelineOpen && (
        <AgentPipeline onClose={() => setPipelineOpen(false)} />
      )}
    </>
  )
}
