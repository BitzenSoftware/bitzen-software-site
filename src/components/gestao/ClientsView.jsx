import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { emptyClient } from '../../lib/gestao/data'
import { AddButton, Button, Empty, Field, Input, Spinner, Textarea } from './ui'

function ClientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { ...emptyClient })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="bg-background border border-accent-purple/30 rounded-xl p-4 flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Razão social / Nome *" className="sm:col-span-2">
          <Input value={form.name} onChange={set('name')} autoFocus required />
        </Field>
        <Field label="Nome fantasia"><Input value={form.trade_name} onChange={set('trade_name')} /></Field>
        <Field label="CNPJ / CPF"><Input value={form.document} onChange={set('document')} /></Field>
        <Field label="Pessoa de contato"><Input value={form.contact_name} onChange={set('contact_name')} /></Field>
        <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="E-mail" className="sm:col-span-2"><Input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Endereço" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} /></Field>
        <Field label="Cidade"><Input value={form.city} onChange={set('city')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="UF"><Input value={form.state} onChange={set('state')} maxLength={20} /></Field>
          <Field label="CEP"><Input value={form.zip} onChange={set('zip')} /></Field>
        </div>
        <Field label="Observações internas" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={set('notes')} />
        </Field>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving || !form.name.trim()} className="flex-1">{saving ? 'Salvando…' : 'Salvar'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
      </div>
    </form>
  )
}

export default function ClientsView() {
  const [clients, setClients] = useState(null)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) setError(error.message)
    setClients(data ?? [])
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!clients || !q) return clients ?? []
    return clients.filter((c) =>
      [c.name, c.trade_name, c.document, c.contact_name, c.email].some((v) => (v || '').toLowerCase().includes(q)),
    )
  }, [clients, search])

  async function handleAdd(data) {
    const { error } = await supabase.from('clients').insert(data)
    if (error) return setError(error.message)
    setAdding(false)
    load()
  }

  async function handleEdit(data) {
    const { id: _id, created_at: _c, ...fields } = data
    const { error } = await supabase.from('clients').update(fields).eq('id', editingId)
    if (error) return setError(error.message)
    setEditingId(null)
    load()
  }

  async function handleDelete(c) {
    if (!window.confirm(`Excluir o cliente "${c.name}"? Os orçamentos dele ficam sem cliente.`)) return
    const { error } = await supabase.from('clients').delete().eq('id', c.id)
    if (error) return setError(error.message)
    load()
  }

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Buscar por nome, CNPJ, contato ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

      {error && <p className="rounded-xl bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm">{error}</p>}

      {clients === null ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <Empty
              title={clients.length ? 'Nenhum resultado' : 'Nenhum cliente ainda'}
              text={clients.length ? 'Tente outro termo de busca.' : 'Cadastre o primeiro cliente para começar a fazer orçamentos.'}
            />
          )}
          {filtered.map((c) =>
            editingId === c.id ? (
              <ClientForm key={c.id} initial={c} onSave={handleEdit} onCancel={() => setEditingId(null)} />
            ) : (
              <div key={c.id} className="flex items-center gap-3 bg-background border border-border rounded-xl px-3 py-2.5">
                <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  <span className="text-xs font-bold text-accent-purple">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <button className="text-left" onClick={() => { setEditingId(c.id); setAdding(false) }}>
                    <p className="text-white text-sm font-medium truncate">{c.name}</p>
                    <p className="text-gray-500 text-xs truncate">{[c.trade_name, c.document, [c.city, c.state].filter(Boolean).join('/')].filter(Boolean).join(' · ') || '—'}</p>
                  </button>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(c.id); setAdding(false) }}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>Excluir</Button>
                </div>
              </div>
            ),
          )}
          {adding ? (
            <ClientForm onSave={handleAdd} onCancel={() => setAdding(false)} />
          ) : (
            <AddButton onClick={() => { setAdding(true); setEditingId(null) }} label="Novo cliente" />
          )}
        </div>
      )}
    </div>
  )
}
