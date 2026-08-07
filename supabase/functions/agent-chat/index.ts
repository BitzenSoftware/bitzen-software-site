import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { AGENT_DEFAULTS } from "../_shared/agent-defaults.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_MAX_TOKENS = 1024

const SB_URL = () => Deno.env.get('SUPABASE_URL')
const SB_KEY = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

type Agent = { agent_id: string; name: string; base_prompt: string; model?: string | null; max_tokens?: number | null }
type Skill = { id: string; agent_id: string; name: string; content: string; sort_order: number; active: boolean }

async function sbGet<T>(path: string): Promise<T[]> {
  const url = SB_URL(), key = SB_KEY()
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    return res.ok ? await res.json() : []
  } catch {
    return []
  }
}

// An agent's prompt is its base identity plus the skills selected for this
// conversation. With no selection, every active skill is applied.
function compose(base: string, skills: Skill[]): string {
  if (!skills.length) return base
  const blocks = skills
    .map((s) => `### ${s.name}\n${s.content}`)
    .join('\n\n')
  return `${base}\n\n===== HABILIDADES ATIVAS NESTA CONVERSA =====\nAplique todas as habilidades abaixo. Se duas derem instruções conflituantes de tom ou formato, a que aparecer primeiro prevalece.\n\n${blocks}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const body = await req.json()
    // Frontend sends { product, role?, messages, skillIds? }.
    // Older callers send { agentId, message, history }.
    const { product, role, messages, agentId, message, history, skillIds } = body

    const primary = role || agentId || product
    if (!primary) {
      return Response.json({ error: 'Informe product, role ou agentId' }, { status: 400, headers: CORS })
    }

    const [agentRows, skillRows] = await Promise.all([
      sbGet<Agent>('agents?select=*&active=eq.true'),
      sbGet<Skill>('agent_skills?select=*&active=eq.true&order=sort_order'),
    ])
    const agents = Object.fromEntries(agentRows.map((a) => [a.agent_id, a]))
    const skillsByAgent: Record<string, Skill[]> = {}
    for (const s of skillRows) (skillsByAgent[s.agent_id] ||= []).push(s)

    function promptFor(id: string, applySelection: boolean): string | null {
      const agent = agents[id]
      const base = agent?.base_prompt?.trim() || AGENT_DEFAULTS[id]?.prompt
      if (!base) return null

      let skills = skillsByAgent[id] || []
      if (applySelection && Array.isArray(skillIds)) {
        skills = skills.filter((s) => skillIds.includes(s.id))
      }
      return compose(base, skills)
    }

    const mainPrompt = promptFor(primary, true)
    if (!mainPrompt) {
      return Response.json(
        { error: `Agente desconhecido: "${primary}"`, known: [...new Set([...Object.keys(agents), ...Object.keys(AGENT_DEFAULTS)])] },
        { status: 400, headers: CORS }
      )
    }

    // A functional agent working on a product inherits that product's facts and
    // tone. Its skills are not filtered by the caller's selection.
    let systemPrompt = mainPrompt
    if (role && product && product !== role) {
      const ctx = promptFor(product, false)
      if (ctx) systemPrompt += `\n\n===== CONTEXTO DO PRODUTO EM CAUSA =====\n${ctx}`
    }

    const chatMessages = Array.isArray(messages) && messages.length
      ? messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
      : [
          ...(history || []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
          ...(message ? [{ role: 'user', content: message }] : []),
        ]

    if (!chatMessages.length) {
      return Response.json({ error: 'Nenhuma mensagem enviada' }, { status: 400, headers: CORS })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurado')

    const agent = agents[primary]
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: agent?.model || DEFAULT_MODEL,
        max_tokens: agent?.max_tokens || DEFAULT_MAX_TOKENS,
        system: systemPrompt,
        messages: chatMessages,
      }),
    })

    if (!res.ok) throw new Error(`Anthropic API error: ${await res.text()}`)

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''

    return Response.json(
      {
        content: text,
        response: text,
        agent: primary,
        skills_applied: (skillsByAgent[primary] || [])
          .filter((s) => !Array.isArray(skillIds) || skillIds.includes(s.id))
          .map((s) => s.name),
      },
      { headers: CORS }
    )
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500, headers: CORS }
    )
  }
})
