import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { AGENT_DEFAULTS } from "../_shared/agent-defaults.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_MAX_TOKENS = 1024

type Skill = { agent_id: string; system_prompt: string; model: string | null; max_tokens: number | null; active: boolean }

// agent_skills rows override AGENT_DEFAULTS for the same agent_id. A missing
// row (or an unreachable table) falls back to the compiled-in default, so the
// agents keep working even if the table is empty.
async function loadOverrides(): Promise<Record<string, Skill>> {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return {}
  try {
    const res = await fetch(`${url}/rest/v1/agent_skills?select=*&active=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return {}
    const rows: Skill[] = await res.json()
    return Object.fromEntries(rows.map((r) => [r.agent_id, r]))
  } catch {
    return {}
  }
}

function resolve(id: string, overrides: Record<string, Skill>) {
  const row = overrides[id]
  if (row?.system_prompt) {
    return { prompt: row.system_prompt, model: row.model || DEFAULT_MODEL, maxTokens: row.max_tokens || DEFAULT_MAX_TOKENS, source: 'db' }
  }
  const def = AGENT_DEFAULTS[id]
  if (def) return { prompt: def.prompt, model: DEFAULT_MODEL, maxTokens: DEFAULT_MAX_TOKENS, source: 'default' }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const body = await req.json()

    // The frontend sends { product, role?, messages }. Older callers and manual
    // tests send { agentId, message, history }. Accept both.
    const { product, role, messages, agentId, message, history } = body

    const primary = role || agentId || product
    if (!primary) {
      return Response.json({ error: 'Missing agent: send product, role or agentId' }, { status: 400, headers: CORS })
    }

    const overrides = await loadOverrides()

    const main = resolve(primary, overrides)
    if (!main) {
      return Response.json(
        { error: `Unknown agent "${primary}"`, known: Object.keys({ ...AGENT_DEFAULTS, ...overrides }) },
        { status: 400, headers: CORS }
      )
    }

    // Functional agents (pesquisador, copywriter, ...) work on a given product:
    // append that product's prompt so they inherit its facts and tone rules.
    let systemPrompt = main.prompt
    if (role && product && product !== role) {
      const ctx = resolve(product, overrides)
      if (ctx) systemPrompt += `\n\n--- CONTEXTO DO PRODUTO EM CAUSA ---\n${ctx.prompt}`
    }

    const chatMessages = Array.isArray(messages) && messages.length
      ? messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
      : [
          ...(history || []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
          ...(message ? [{ role: 'user', content: message }] : []),
        ]

    if (!chatMessages.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400, headers: CORS })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: main.model,
        max_tokens: main.maxTokens,
        system: systemPrompt,
        messages: chatMessages,
      }),
    })

    if (!res.ok) throw new Error(`Anthropic API error: ${await res.text()}`)

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''

    // Both frontends read `content`; `response` kept for older callers.
    return Response.json(
      { content: text, response: text, agent: primary, prompt_source: main.source },
      { headers: CORS }
    )
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500, headers: CORS }
    )
  }
})
