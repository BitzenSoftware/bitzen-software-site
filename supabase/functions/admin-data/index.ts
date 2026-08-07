import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Write proxy for the admin panel. The anon key can no longer write to these
// tables (see migration 20260806b), so the panel routes writes here and this
// function performs them with the service role after checking ADMIN_TOKEN.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Explicit allowlist: an attacker with the token still cannot reach a table we
// did not intend to expose (auth schema, agent tables, arbitrary SQL).
const WRITABLE = new Set(['settings', 'apps', 'blog_posts', 'ebooks', 'testimonials', 'post_comments'])

const SB_URL = () => Deno.env.get('SUPABASE_URL')!
const SB_KEY = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function authorized(req: Request): boolean {
  const expected = Deno.env.get('ADMIN_TOKEN')
  if (!expected) return false
  const got = req.headers.get('x-admin-token') ?? ''
  if (got.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não suportado' }, { status: 405, headers: CORS })
  }
  if (!authorized(req)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401, headers: CORS })
  }

  try {
    // { table, action: 'upsert' | 'update' | 'delete', rows?, patch?, match? }
    const { table, action, rows, patch, match } = await req.json()

    if (!WRITABLE.has(table)) {
      return Response.json({ error: `Tabela não permitida: ${table}` }, { status: 400, headers: CORS })
    }

    const base = `${SB_URL()}/rest/v1/${table}`
    const headers = {
      apikey: SB_KEY(),
      Authorization: `Bearer ${SB_KEY()}`,
      'Content-Type': 'application/json',
    }

    // match becomes PostgREST filters: { id: 'x' } -> ?id=eq.x
    // An array value becomes an IN filter: { id: ['a','b'] } -> ?id=in.(a,b)
    const filters = Object.entries(match || {})
      .map(([k, v]) =>
        Array.isArray(v)
          ? `${encodeURIComponent(k)}=in.(${v.map((x) => encodeURIComponent(String(x))).join(',')})`
          : `${encodeURIComponent(k)}=eq.${encodeURIComponent(String(v))}`
      )
      .join('&')

    let res: Response
    if (action === 'upsert') {
      if (!rows) return Response.json({ error: 'rows é obrigatório' }, { status: 400, headers: CORS })
      res = await fetch(base, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(rows),
      })
    } else if (action === 'update') {
      if (!filters) return Response.json({ error: 'match é obrigatório em update' }, { status: 400, headers: CORS })
      res = await fetch(`${base}?${filters}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(patch || {}),
      })
    } else if (action === 'delete') {
      if (!filters) return Response.json({ error: 'match é obrigatório em delete' }, { status: 400, headers: CORS })
      res = await fetch(`${base}?${filters}`, {
        method: 'DELETE',
        headers: { ...headers, Prefer: 'return=minimal' },
      })
    } else {
      return Response.json({ error: `Ação inválida: ${action}` }, { status: 400, headers: CORS })
    }

    const text = await res.text()
    if (!res.ok) {
      return Response.json({ error: text.slice(0, 400) }, { status: res.status, headers: CORS })
    }

    return Response.json({ data: text ? JSON.parse(text) : null }, { headers: CORS })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500, headers: CORS }
    )
  }
})
