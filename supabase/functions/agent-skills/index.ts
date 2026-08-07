import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { AGENT_DEFAULTS } from "../_shared/agent-defaults.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

const SB_URL = () => Deno.env.get('SUPABASE_URL')!
const SB_KEY = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function sbHeaders(extra: Record<string, string> = {}) {
  return { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`, 'Content-Type': 'application/json', ...extra }
}

// Writes are gated on a secret held in Supabase, never shipped to the browser.
// The panel's ADMIN_USER/ADMIN_PASS are compiled into the public bundle and are
// not a security boundary, so they cannot be used for this.
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

  try {
    // ── list: defaults merged with overrides ───────────────────────────────
    if (req.method === 'GET') {
      const res = await fetch(`${SB_URL()}/rest/v1/agent_skills?select=*`, { headers: sbHeaders() })
      const rows: Array<Record<string, unknown>> = res.ok ? await res.json() : []
      const byId = Object.fromEntries(rows.map((r) => [r.agent_id as string, r]))

      const ids = [...new Set([...Object.keys(AGENT_DEFAULTS), ...Object.keys(byId)])]
      const agents = ids.map((id) => {
        const row = byId[id]
        const def = AGENT_DEFAULTS[id]
        return {
          agent_id: id,
          name: (row?.name as string) || def?.name || id,
          system_prompt: (row?.system_prompt as string) ?? def?.prompt ?? '',
          default_prompt: def?.prompt ?? null,
          model: (row?.model as string) ?? null,
          max_tokens: (row?.max_tokens as number) ?? null,
          active: row ? (row.active as boolean) : true,
          customized: Boolean(row),
          updated_at: (row?.updated_at as string) ?? null,
        }
      }).sort((a, b) => a.agent_id.localeCompare(b.agent_id))

      return Response.json({ agents }, { headers: CORS })
    }

    if (!authorized(req)) {
      return Response.json({ error: 'Não autorizado' }, { status: 401, headers: CORS })
    }

    // ── upsert an override ─────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { agent_id, name, system_prompt, model, max_tokens, active } = await req.json()
      if (!agent_id || typeof system_prompt !== 'string' || !system_prompt.trim()) {
        return Response.json({ error: 'agent_id e system_prompt são obrigatórios' }, { status: 400, headers: CORS })
      }

      const payload = {
        agent_id,
        name: name ?? AGENT_DEFAULTS[agent_id]?.name ?? agent_id,
        system_prompt,
        model: model || null,
        max_tokens: max_tokens || null,
        active: active !== false,
        updated_at: new Date().toISOString(),
      }

      const res = await fetch(`${SB_URL()}/rest/v1/agent_skills?on_conflict=agent_id`, {
        method: 'POST',
        headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Falha ao gravar: ${await res.text()}`)
      return Response.json({ saved: (await res.json())[0] }, { headers: CORS })
    }

    // ── delete an override: agent reverts to the built-in default ──────────
    if (req.method === 'DELETE') {
      const agentId = new URL(req.url).searchParams.get('agent_id')
      if (!agentId) return Response.json({ error: 'agent_id é obrigatório' }, { status: 400, headers: CORS })

      const res = await fetch(`${SB_URL()}/rest/v1/agent_skills?agent_id=eq.${encodeURIComponent(agentId)}`, {
        method: 'DELETE',
        headers: sbHeaders({ Prefer: 'return=minimal' }),
      })
      if (!res.ok) throw new Error(`Falha ao remover: ${await res.text()}`)
      return Response.json({ reverted: agentId }, { headers: CORS })
    }

    return Response.json({ error: 'Método não suportado' }, { status: 405, headers: CORS })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500, headers: CORS }
    )
  }
})
