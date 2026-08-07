// Admin writes no longer go through the anon key — RLS blocks them. They are
// proxied by the admin-data edge function, which authorises the caller from
// their Supabase Auth session. Public writes (submitting a testimonial, a
// comment, a like) still go direct.

import { supabase } from './supabase'

const SB_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const SB_KEY = (import.meta.env.VITE_SUPABASE_KEY || '').trim()

// Break-glass only: lets the panel work if auth is misconfigured. Normal
// operation uses the signed-in session and needs no token at all.
export const ADMIN_TOKEN_KEY = 'bitzen_admin_token'

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export class AdminAuthError extends Error {
  constructor(message) {
    super(message || 'Sessão de administração expirada. Faça login novamente no painel.')
    this.name = 'AdminAuthError'
  }
}

// Session JWT when signed in, anon key otherwise. The edge function tells the
// two apart and rejects the anon key.
export async function adminHeaders() {
  const { data } = await supabase.auth.getSession()
  const jwt = data?.session?.access_token
  const token = getAdminToken()
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${jwt || SB_KEY}`,
    'Content-Type': 'application/json',
    ...(token ? { 'x-admin-token': token } : {}),
  }
}

async function call(payload) {
  const res = await fetch(`${SB_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: await adminHeaders(),
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status === 401) throw new AdminAuthError(json.error)
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json.data
}

export const adminData = {
  upsert: (table, rows) => call({ table, action: 'upsert', rows }),
  update: (table, patch, match) => call({ table, action: 'update', patch, match }),
  remove: (table, match) => call({ table, action: 'delete', match }),
}
