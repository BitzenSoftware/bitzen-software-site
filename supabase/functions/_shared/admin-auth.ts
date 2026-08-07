// Two ways to prove admin rights, checked in this order:
//
//   1. A Supabase Auth session whose email is in ADMIN_EMAILS. This is the
//      normal path — the panel signs in and the browser sends the user's JWT.
//   2. The ADMIN_TOKEN secret in x-admin-token. Kept as a break-glass path so a
//      misconfigured auth setup cannot lock the panel out of its own data.
//
// The panel's ADMIN_USER/ADMIN_PASS constants are compiled into the public
// bundle and are deliberately not accepted here.

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function adminEmails(): string[] {
  return (Deno.env.get('ADMIN_EMAILS') || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export type AdminCheck = { ok: true; via: 'session' | 'token'; email?: string } | { ok: false; reason: string }

export async function checkAdmin(req: Request): Promise<AdminCheck> {
  // ── 1. Supabase Auth session ────────────────────────────────────────────
  const auth = req.headers.get('authorization') ?? ''
  const jwt = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const url = Deno.env.get('SUPABASE_URL')

  // The panel sends the anon key as Authorization when nobody is signed in;
  // that is not a session, so skip the lookup in that case.
  if (jwt && url && anonKey && jwt !== anonKey) {
    try {
      const res = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${jwt}` },
      })
      if (res.ok) {
        const user = await res.json()
        const email = String(user?.email || '').toLowerCase()
        const allowed = adminEmails()
        if (email && (allowed.length === 0 || allowed.includes(email))) {
          return { ok: true, via: 'session', email }
        }
        return { ok: false, reason: 'Esta conta não tem permissão de administração.' }
      }
    } catch {
      // fall through to the token path
    }
  }

  // ── 2. Break-glass token ────────────────────────────────────────────────
  const expected = Deno.env.get('ADMIN_TOKEN')
  const got = req.headers.get('x-admin-token') ?? ''
  if (expected && got && constantTimeEquals(got, expected)) {
    return { ok: true, via: 'token' }
  }

  return { ok: false, reason: 'Não autorizado. Faça login no painel.' }
}
