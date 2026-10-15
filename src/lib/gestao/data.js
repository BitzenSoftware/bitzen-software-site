import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

export const emptyClient = {
  name: '',
  trade_name: '',
  document: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  notes: '',
  currency: 'BRL',
  hourly_rate: 0,
}

export function emptyCompanyProfile(userId) {
  return {
    user_id: userId,
    company_name: '',
    legal_name: '',
    document: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    logo_url: null,
    brand_color: '#6c3de8',
    currency: 'BRL',
    default_validity_days: 15,
    default_terms: '',
    bank_info: '',
  }
}

export const KIND_LABEL = { orcamento: 'Orçamento', proposta: 'Proposta comercial' }
export const STATUS_LABEL = { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', recusado: 'Recusado' }

export async function loadQuote(id) {
  const { data: quote, error } = await supabase.from('quotes').select('*').eq('id', id).single()
  if (error) throw error
  const { data: items, error: e2 } = await supabase
    .from('quote_items')
    .select('id, position, title, description, hours, amount')
    .eq('quote_id', id)
    .order('position')
  if (e2) throw e2
  let client = null
  if (quote.client_id) {
    const { data } = await supabase.from('clients').select('*').eq('id', quote.client_id).maybeSingle()
    client = data
  }
  const norm = (items ?? []).map((i) => ({ ...i, hours: Number(i.hours), amount: Number(i.amount) }))
  return { quote: { ...quote, discount: Number(quote.discount) }, items: norm, client }
}

/** Salva o cabeçalho e substitui todos os itens. Devolve o id do orçamento. */
export async function saveQuote(id, fields, items) {
  let quoteId = id
  if (quoteId) {
    const { error } = await supabase.from('quotes').update(fields).eq('id', quoteId)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('quotes').insert(fields).select('id').single()
    if (error) throw error
    quoteId = data.id
  }

  const { error: delErr } = await supabase.from('quote_items').delete().eq('quote_id', quoteId)
  if (delErr) throw delErr

  const rows = items
    .filter((i) => i.title.trim() || i.description.trim() || i.amount || i.hours)
    .map((i, idx) => ({
      quote_id: quoteId,
      position: idx,
      title: i.title,
      description: i.description,
      hours: Number(i.hours) || 0,
      amount: Number(i.amount) || 0,
    }))
  if (rows.length) {
    const { error } = await supabase.from('quote_items').insert(rows)
    if (error) throw error
  }
  return quoteId
}

export async function duplicateQuote(id) {
  const { quote, items } = await loadQuote(id)
  const { id: _i, number: _n, created_at: _c, updated_at: _u, ...fields } = quote
  return saveQuote(
    undefined,
    { ...fields, status: 'rascunho', title: fields.title ? `${fields.title} (cópia)` : '' },
    items,
  )
}

/** Perfil da empresa usado no timbre dos documentos PDF — uma linha por utilizador autenticado. */
export function useCompanyProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase.from('company_profiles').select('*').eq('user_id', userId).maybeSingle()
    setProfile(data ?? emptyCompanyProfile(userId))
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function save(next) {
    const { updated_at: _u, ...row } = next
    const { error } = await supabase.from('company_profiles').upsert(row)
    if (error) throw error
    await reload()
  }

  return { profile, loading, reload, save }
}
