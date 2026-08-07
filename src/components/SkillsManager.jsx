import { useEffect, useState } from 'react'

const TOKEN_KEY = 'bitzen_admin_token'

// Same .trim() as src/lib/supabase.js — these env vars are stored with a BOM.
const SB_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const SB_KEY = (import.meta.env.VITE_SUPABASE_KEY || '').trim()
const FN_URL = `${SB_URL}/functions/v1/agent-skills`

// Writes go through the agent-skills edge function, which validates this token
// against a secret stored in Supabase. The panel's own password lives in the
// public bundle and cannot protect anything.
async function callFn(method, token, { body, query } = {}) {
  const res = await fetch(`${FN_URL}${query || ''}`, {
    method,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      ...(token ? { 'x-admin-token': token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json
}

export default function SkillsManager() {
  const [agents, setAgents] = useState([])
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState({ system_prompt: '', model: '', max_tokens: '' })
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { agents } = await callFn('GET')
      setAgents(agents)
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  function pick(agent) {
    setSelected(agent)
    setDraft({
      system_prompt: agent.system_prompt,
      model: agent.model || '',
      max_tokens: agent.max_tokens || '',
    })
    setMsg(null)
  }

  async function save() {
    if (!token.trim()) return setMsg({ type: 'error', text: 'Informe o token de administração.' })
    if (!draft.system_prompt.trim()) return setMsg({ type: 'error', text: 'A skill não pode ficar vazia.' })
    setBusy(true)
    setMsg(null)
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
      await callFn('POST', token, {
        body: {
          agent_id: selected.agent_id,
          name: selected.name,
          system_prompt: draft.system_prompt,
          model: draft.model || null,
          max_tokens: draft.max_tokens ? Number(draft.max_tokens) : null,
        },
      })
      setMsg({ type: 'ok', text: 'Skill gravada. Já está a ser usada pelos agentes.' })
      await load()
      setSelected(s => ({ ...s, customized: true }))
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  async function revert() {
    if (!token.trim()) return setMsg({ type: 'error', text: 'Informe o token de administração.' })
    if (!confirm(`Reverter "${selected.name}" para a skill padrão do código? A versão personalizada será apagada.`)) return
    setBusy(true)
    setMsg(null)
    try {
      await callFn('DELETE', token, { query: `?agent_id=${encodeURIComponent(selected.agent_id)}` })
      const { agents } = await callFn('GET')
      setAgents(agents)
      const fresh = agents.find(a => a.agent_id === selected.agent_id)
      if (fresh) pick(fresh)
      setMsg({ type: 'ok', text: 'Revertido para a skill padrão.' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  const dirty = selected && draft.system_prompt !== selected.system_prompt

  return (
    <div className="p-6 max-w-3xl">
      <p className="text-gray-500 text-sm mb-1">
        Cada especialista tem uma skill — o texto que define o que ele sabe, para quem escreve e em que tom.
      </p>
      <p className="text-gray-600 text-xs mb-5">
        Sem personalização, vale a skill padrão do código. Ao gravar, a sua versão passa a valer imediatamente.
      </p>

      <div className="mb-5">
        <label className="block text-gray-400 text-xs font-medium mb-1.5">Token de administração</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Necessário apenas para gravar"
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
        />
        <p className="text-gray-600 text-[11px] mt-1.5">
          Guardado apenas nesta sessão do navegador. Definido no secret <code className="text-gray-500">ADMIN_TOKEN</code> do Supabase.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">A carregar especialistas…</p>
      ) : (
        <>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Especialistas</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {agents.map(a => (
              <button
                key={a.agent_id}
                onClick={() => pick(a)}
                className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected?.agent_id === a.agent_id
                    ? 'border-accent-purple/60 bg-accent-purple/10'
                    : 'border-border bg-surface/40 hover:border-accent-purple/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white text-sm font-medium truncate">{a.name}</span>
                  {a.customized && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue whitespace-nowrap">
                      personalizada
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-[11px] mt-0.5 truncate">{a.agent_id}</p>
              </button>
            ))}
          </div>

          {selected && (
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{selected.name}</h3>
                <span className="text-gray-600 text-xs">
                  {draft.system_prompt.length.toLocaleString('pt-BR')} caracteres
                </span>
              </div>

              <textarea
                value={draft.system_prompt}
                onChange={(e) => setDraft(d => ({ ...d, system_prompt: e.target.value }))}
                rows={18}
                spellCheck={false}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-[13px] leading-relaxed font-mono placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors resize-y"
              />

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Modelo (opcional)</label>
                  <input
                    value={draft.model}
                    onChange={(e) => setDraft(d => ({ ...d, model: e.target.value }))}
                    placeholder="padrão: claude-haiku-4-5-20251001"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Máx. tokens (opcional)</label>
                  <input
                    type="number"
                    value={draft.max_tokens}
                    onChange={(e) => setDraft(d => ({ ...d, max_tokens: e.target.value }))}
                    placeholder="padrão: 1024"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
                  />
                </div>
              </div>

              {msg && (
                <p className={`text-xs mt-3 rounded-lg py-2 px-3 border ${
                  msg.type === 'ok'
                    ? 'text-green-400 bg-green-400/10 border-green-400/20'
                    : 'text-red-400 bg-red-400/10 border-red-400/20'
                }`}>
                  {msg.text}
                </p>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={save}
                  disabled={busy || !dirty}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy ? 'A gravar…' : 'Gravar skill'}
                </button>

                {selected.customized && (
                  <button
                    onClick={revert}
                    disabled={busy}
                    className="px-4 py-2.5 rounded-xl text-sm text-gray-400 border border-border hover:border-red-400/50 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    Reverter ao padrão
                  </button>
                )}

                {dirty && <span className="text-amber-400/80 text-xs">alterações por gravar</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
