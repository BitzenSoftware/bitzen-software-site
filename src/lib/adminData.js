// Admin writes no longer go through the anon key — RLS blocks them. They are
// proxied by the admin-data edge function, which checks ADMIN_TOKEN server-side.
// Public writes (submitting a testimonial, a comment, a like) still go direct.

const SB_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const SB_KEY = (import.meta.env.VITE_SUPABASE_KEY || '').trim()

export const ADMIN_TOKEN_KEY = 'bitzen_admin_token'

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export class AdminAuthError extends Error {
  constructor() {
    super('Token de administração ausente ou inválido. Abra "Skills dos Agentes" e informe o token.')
    this.name = 'AdminAuthError'
  }
}

async function call(payload) {
  const token = getAdminToken()
  if (!token) throw new AdminAuthError()

  const res = await fetch(`${SB_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status === 401) throw new AdminAuthError()
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json.data
}

export const adminData = {
  upsert: (table, rows) => call({ table, action: 'upsert', rows }),
  update: (table, patch, match) => call({ table, action: 'update', patch, match }),
  remove: (table, match) => call({ table, action: 'delete', match }),
}
