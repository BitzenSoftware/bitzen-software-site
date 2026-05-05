import { useState, useRef, useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'
import { supabase } from '../lib/supabase'

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

// ── Ícone de engrenagem ─────────────────────────────────────────────────────

function IconSettings({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-gradient-to-b from-accent-purple to-accent-blue" />
      {children}
    </h3>
  )
}

// ── Upload de imagem via Supabase Storage ───────────────────────────────────

function ImageUpload({ value, onChange, label, small, storageFolder = 'misc' }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${storageFolder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${small ? 'w-10 h-10' : 'w-20 h-20'} rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer relative`}
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
          <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:underline text-left">
            Remover
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Formulário de App ───────────────────────────────────────────────────────

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

// ── Formulário de Post ──────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────────

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
      <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity">
        Salvar
      </button>
      <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-400 bg-surface border border-border hover:text-white transition-colors">
        Cancelar
      </button>
    </div>
  )
}

// ── Login ───────────────────────────────────────────────────────────────────

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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-white text-xl font-bold text-center mb-1">Área restrita</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Faça login para acessar as configurações</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Painel principal ────────────────────────────────────────────────────────

export default function SettingsPanel() {
  const { logo, setLogo, apps, setApps, blogPosts, setBlogPosts, contactEmail, setContactEmail, socialLinks, setSocialLinks } = useSettings()

  const [open, setOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('bitzen_auth') === '1')

  const [addingApp, setAddingApp] = useState(false)
  const [editingAppId, setEditingAppId] = useState(null)
  const [addingPost, setAddingPost] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)

  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    if (open && authenticated) loadTestimonials()
  }, [open, authenticated])

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
  }

  function logout() {
    sessionStorage.removeItem('bitzen_auth')
    setAuthenticated(false)
    closePanel()
  }

  function handleAddApp(data) {
    setApps([...apps, { ...data, id: Date.now() }])
    setAddingApp(false)
  }
  function handleEditApp(data) {
    setApps(apps.map((a) => a.id === editingAppId ? { ...data, id: editingAppId } : a))
    setEditingAppId(null)
  }
  function handleDeleteApp(id) {
    if (window.confirm('Remover este app?')) setApps(apps.filter((a) => a.id !== id))
  }

  function handleAddPost(data) {
    setBlogPosts([{ ...data, id: Date.now() }, ...blogPosts])
    setAddingPost(false)
  }
  function handleEditPost(data) {
    setBlogPosts(blogPosts.map((x) => x.id === editingPostId ? { ...data, id: editingPostId } : x))
    setEditingPostId(null)
  }
  function handleDeletePost(id) {
    if (window.confirm('Remover esta postagem?')) setBlogPosts(blogPosts.filter((x) => x.id !== id))
  }

  const pending = testimonials.filter(t => !t.approved)
  const approved = testimonials.filter(t => t.approved)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-2 right-4 z-[60] w-10 h-10 rounded-full bg-surface border border-border text-gray-400 hover:text-white hover:border-accent-purple/60 shadow-lg shadow-black/30 transition-all duration-200 flex items-center justify-center group"
        aria-label="Configurações"
        title="Configurações do site"
      >
        <span className="group-hover:rotate-45 transition-transform duration-300 block">
          <IconSettings className="w-4 h-4" />
        </span>
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closePanel} />}

      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-accent-purple"><IconSettings /></span>
            <h2 className="text-white font-semibold">Configurações do Site</h2>
          </div>
          <div className="flex items-center gap-1">
            {authenticated && (
              <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-border text-xs" title="Sair">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
            <button onClick={closePanel} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-border" aria-label="Fechar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!authenticated ? (
          <LoginForm onSuccess={() => setAuthenticated(true)} />
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-7">

            {/* Logo */}
            <div>
              <SectionTitle>Logo da Empresa</SectionTitle>
              <ImageUpload value={logo} onChange={setLogo} label="logo da empresa" storageFolder="logos" />
              <p className="text-gray-600 text-xs mt-2">PNG ou SVG com fundo transparente.</p>
            </div>

            <div className="border-t border-border" />

            {/* Apps */}
            <div>
              <SectionTitle>Apps cadastrados ({apps.length})</SectionTitle>
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
                  <AddButton onClick={() => { setAddingApp(true); setEditingAppId(null) }} label="Adicionar App" />
                )}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Email */}
            <div>
              <SectionTitle>Email de Contato</SectionTitle>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contato@suaempresa.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
              />
            </div>

            <div className="border-t border-border" />

            {/* Redes sociais */}
            <div>
              <SectionTitle>Redes Sociais</SectionTitle>
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

            <div className="border-t border-border" />

            {/* Blog */}
            <div>
              <SectionTitle>Blog & Novidades ({blogPosts.length})</SectionTitle>
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

            <div className="border-t border-border" />

            {/* Testemunhos */}
            <div>
              <SectionTitle>Comentários ({testimonials.length})</SectionTitle>

              {pending.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-yellow-500 font-medium mb-2">Aguardando aprovação ({pending.length})</p>
                  <div className="flex flex-col gap-2">
                    {pending.map(t => (
                      <div key={t.id} className="bg-background border border-yellow-500/20 rounded-xl px-3 py-2.5">
                        <p className="text-white text-sm font-medium">{t.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{t.message}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => approveTestimonial(t.id)}
                            className="text-xs text-green-400 hover:underline">Aprovar</button>
                          <button onClick={() => deleteTestimonial(t.id)}
                            className="text-xs text-red-400 hover:underline">Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {approved.length > 0 && (
                <div>
                  <p className="text-xs text-green-500 font-medium mb-2">Publicados ({approved.length})</p>
                  <div className="flex flex-col gap-2">
                    {approved.map(t => (
                      <div key={t.id} className="flex items-center gap-3 bg-background border border-border rounded-xl px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{t.name}</p>
                          <p className="text-gray-500 text-xs truncate">{t.message}</p>
                        </div>
                        <button onClick={() => deleteTestimonial(t.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-surface flex-shrink-0">
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
                <p className="text-gray-600 text-xs">Ainda sem comentários de visitantes.</p>
              )}
            </div>

          </div>
        )}

        <div className="px-5 py-3 border-t border-border flex-shrink-0">
          <p className="text-gray-600 text-xs text-center">
            {authenticated ? 'As alterações são salvas no Supabase' : 'Bitzen Software — Painel administrativo'}
          </p>
        </div>
      </div>
    </>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────────────────

function ItemRow({ logo, initial, title, subtitle, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-3 py-2.5">
      {(logo !== undefined) && (
        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
          {logo ? (
            <img src={logo} alt={title} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-xs font-bold text-accent-purple">{initial}</span>
          )}
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
