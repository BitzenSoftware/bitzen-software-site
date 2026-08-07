import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { AGENT_DEFAULTS } from "../_shared/agent-defaults.ts"

// CRUD for agents and their skills. Reads are open (the panel needs them and
// the tables are anon-readable); writes require ADMIN_TOKEN, a Supabase secret.
// The panel's own password is compiled into the public bundle and protects
// nothing, which is why it is not used here.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

const SB_URL = () => Deno.env.get('SUPABASE_URL')!
const SB_KEY = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function h(extra: Record<string, string> = {}) {
  return { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`, 'Content-Type': 'application/json', ...extra }
}

async function sb(path: string, init?: RequestInit) {
  const res = await fetch(`${SB_URL()}/rest/v1/${path}`, { ...init, headers: { ...h(), ...(init?.headers || {}) } })
  const text = await res.text()
  if (!res.ok) throw new Error(text.slice(0, 400))
  return text ? JSON.parse(text) : null
}

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
    // ── GET: agents with their skills ──────────────────────────────────────
    if (req.method === 'GET') {
      const [agents, skills] = await Promise.all([
        sb('agents?select=*&order=kind.desc,sort_order,name'),
        sb('agent_skills?select=*&order=sort_order,name'),
      ])
      const byAgent: Record<string, unknown[]> = {}
      for (const s of skills || []) (byAgent[(s as { agent_id: string }).agent_id] ||= []).push(s)

      return Response.json(
        {
          agents: (agents || []).map((a: Record<string, unknown>) => ({
            ...a,
            // Offer the built-in text as a starting point when base_prompt is empty.
            default_prompt: AGENT_DEFAULTS[a.agent_id as string]?.prompt ?? null,
            skills: byAgent[a.agent_id as string] || [],
          })),
        },
        { headers: CORS }
      )
    }

    if (!authorized(req)) {
      return Response.json({ error: 'Não autorizado' }, { status: 401, headers: CORS })
    }

    const url = new URL(req.url)

    // ── DELETE: ?skill_id=... ──────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const skillId = url.searchParams.get('skill_id')
      if (!skillId) return Response.json({ error: 'skill_id é obrigatório' }, { status: 400, headers: CORS })
      await sb(`agent_skills?id=eq.${encodeURIComponent(skillId)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      })
      return Response.json({ deleted: skillId }, { headers: CORS })
    }

    // ── POST: { kind: 'agent' | 'skill', ... } ─────────────────────────────
    if (req.method === 'POST') {
      const payload = await req.json()

      if (payload.kind === 'agent') {
        const { agent_id, base_prompt, model, max_tokens, name, description } = payload
        if (!agent_id) return Response.json({ error: 'agent_id é obrigatório' }, { status: 400, headers: CORS })
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (base_prompt !== undefined) patch.base_prompt = base_prompt
        if (model !== undefined) patch.model = model || null
        if (max_tokens !== undefined) patch.max_tokens = max_tokens || null
        if (name !== undefined) patch.name = name
        if (description !== undefined) patch.description = description

        const rows = await sb(`agents?agent_id=eq.${encodeURIComponent(agent_id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(patch),
        })
        return Response.json({ agent: rows?.[0] ?? null }, { headers: CORS })
      }

      if (payload.kind === 'skill') {
        const { id, agent_id, name, description, content, sort_order, active } = payload
        if (!agent_id || !content?.trim() || !name?.trim()) {
          return Response.json({ error: 'agent_id, name e content são obrigatórios' }, { status: 400, headers: CORS })
        }
        const row = {
          agent_id,
          name,
          description: description || '',
          content,
          sort_order: sort_order ?? 0,
          active: active !== false,
          updated_at: new Date().toISOString(),
        }

        const rows = id
          ? await sb(`agent_skills?id=eq.${encodeURIComponent(id)}`, {
              method: 'PATCH',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify(row),
            })
          : await sb('agent_skills', {
              method: 'POST',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify(row),
            })
        return Response.json({ skill: rows?.[0] ?? null }, { headers: CORS })
      }

      return Response.json({ error: 'kind deve ser "agent" ou "skill"' }, { status: 400, headers: CORS })
    }

    return Response.json({ error: 'Método não suportado' }, { status: 405, headers: CORS })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500, headers: CORS }
    )
  }
})
