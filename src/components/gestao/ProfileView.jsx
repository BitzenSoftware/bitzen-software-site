import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useCompanyProfile } from '../../lib/gestao/data'
import { Button, Card, Field, Input, Select, Spinner, Textarea } from './ui'

export default function ProfileView() {
  const { profile, loading, save } = useCompanyProfile()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)
  const fileRef = useRef()

  useEffect(() => { if (profile) setForm(profile) }, [profile])

  if (loading || !form) return <Spinner />

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: k === 'default_validity_days' ? Number(e.target.value) : e.target.value }))

  async function submit(next = form) {
    setSaving(true)
    setMsg(null)
    try {
      await save(next)
      setMsg({ ok: true, text: 'Perfil salvo.' })
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogo(file) {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return setMsg({ ok: false, text: 'Use um logo em PNG ou JPG. O gerador de PDF não aceita SVG nem WebP.' })
    }
    if (file.size > 2 * 1024 * 1024) return setMsg({ ok: false, text: 'O logo deve ter no máximo 2 MB.' })
    setUploading(true)
    setMsg(null)
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${userId}/logo-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true, contentType: file.type })
    setUploading(false)
    if (error) return setMsg({ ok: false, text: error.message })
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    const next = { ...form, logo_url: data.publicUrl }
    setForm(next)
    submit(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">Estes dados formam o timbre dos seus orçamentos e propostas em PDF.</p>
        <Button onClick={() => submit()} disabled={saving}>{saving ? 'Salvando…' : 'Salvar perfil'}</Button>
      </div>

      {msg && (
        <p className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
          {msg.text}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="text-white text-sm font-semibold mb-4">Identidade visual</h3>
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-background p-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-gray-600 text-sm">Sem logo</span>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <label className="flex-1">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              <span
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {uploading ? 'Enviando…' : form.logo_url ? 'Trocar logo' : 'Enviar logo'}
              </span>
            </label>
            {form.logo_url && (
              <Button variant="danger" onClick={() => { const next = { ...form, logo_url: null }; setForm(next); submit(next) }}>Remover</Button>
            )}
          </div>
          <p className="mt-2 text-gray-600 text-xs">PNG com fundo transparente fica melhor. Máximo 2 MB.</p>

          <div className="mt-5">
            <Field label="Cor de destaque do documento">
              <div className="flex items-center gap-3">
                <input type="color" value={form.brand_color} onChange={set('brand_color')} className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-background p-1" />
                <Input value={form.brand_color} onChange={set('brand_color')} className="font-mono" />
              </div>
            </Field>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-white text-sm font-semibold mb-4">Dados da empresa</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome da empresa"><Input value={form.company_name} onChange={set('company_name')} /></Field>
            <Field label="Razão social"><Input value={form.legal_name} onChange={set('legal_name')} /></Field>
            <Field label="CNPJ"><Input value={form.document} onChange={set('document')} /></Field>
            <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} /></Field>
            <Field label="E-mail"><Input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Site"><Input value={form.website} onChange={set('website')} /></Field>
            <Field label="Endereço" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} /></Field>
            <Field label="Cidade"><Input value={form.city} onChange={set('city')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="UF"><Input value={form.state} onChange={set('state')} /></Field>
              <Field label="CEP"><Input value={form.zip} onChange={set('zip')} /></Field>
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <h3 className="text-white text-sm font-semibold mb-4">Padrões dos documentos</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Moeda">
              <Select value={form.currency} onChange={set('currency')}>
                <option value="BRL">Real (R$)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar (US$)</option>
              </Select>
            </Field>
            <Field label="Validade padrão (dias)">
              <Input type="number" min={1} value={form.default_validity_days} onChange={set('default_validity_days')} />
            </Field>
            <div />
            <Field label="Condições comerciais padrão" className="sm:col-span-3" hint="Entra automaticamente em cada orçamento novo. Pode ser alterado em cada documento.">
              <Textarea rows={4} value={form.default_terms} onChange={set('default_terms')} placeholder="Ex.: Pagamento 50% na aprovação e 50% na entrega. Prazo de execução a combinar." />
            </Field>
            <Field label="Dados para pagamento" className="sm:col-span-3" hint="Banco, agência, conta, PIX. Aparece no fim do documento.">
              <Textarea rows={3} value={form.bank_info} onChange={set('bank_info')} />
            </Field>
          </div>
        </Card>
      </div>
    </div>
  )
}
