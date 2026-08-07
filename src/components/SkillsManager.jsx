import { useEffect, useState } from 'react'
import { getAdminToken, setAdminToken, adminHeaders } from '../lib/adminData'

const SB_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const SB_KEY = (import.meta.env.VITE_SUPABASE_KEY || '').trim()
const FN = `${SB_URL}/functions/v1/agent-skills`

async function callFn(method, { body, query } = {}) {
  const res = await fetch(`${FN}${query || ""}`, {
    method,
    headers: await adminHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json
}

const input = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors'

function SkillEditor({ agentId, skill, token, onDone, onCancel }) {
  const [form, setForm] = useState({
    name: skill?.name || '',
    description: skill?.description || '',
    content: skill?.content || '',
    active: skill?.active !== false,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function save() {
    if (!form.name.trim() || !form.content.trim()) return setErr('Nome e conteúdo são obrigatórios.')
    setBusy(true); setErr(null)
    try {
      await callFn('POST', { body: { kind: 'skill', id: skill?.id, agent_id: agentId, ...form } })
      onDone()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="border border-accent-purple/40 bg-accent-purple/5 rounded-xl p-4 mb-3">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input className={input} placeholder="Nome da habilidade" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className={input} placeholder="Descrição curta (opcional)" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <textarea rows={8} spellCheck={false} placeholder="Instruções desta habilidade…"
        className={`${input} font-mono text-[13px] leading-relaxed resize-y`}
        value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
      {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={busy}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 disabled:opacity-40">
          {busy ? 'A gravar…' : 'Gravar habilidade'}
        </button>
        <button onClick={onCancel} className="px-3 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
        <label className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" checked={form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          ativa
        </label>
      </div>
    </div>
  )
}

export default function SkillsManager() {
  const [agents, setAgents] = useState([])
  const [selected, setSelected] = useState(null)
  const [base, setBase] = useState('')
  const [token, setToken] = useState(getAdminToken)
  const [editingSkill, setEditingSkill] = useState(undefined) // undefined = none, null = new
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { load() }, [])

  async function load(keepId) {
    setLoading(true)
    try {
      const { agents } = await callFn('GET')
      setAgents(agents)
      const id = keepId || selected?.agent_id
      const next = id ? agents.find(a => a.agent_id === id) : null
      if (next) { setSelected(next); setBase(next.base_prompt || next.default_prompt || '') }
    } catch (e) { setMsg({ type: 'error', text: e.message }) } finally { setLoading(false) }
  }

  function pick(a) {
    setSelected(a)
    setBase(a.base_prompt || a.default_prompt || '')
    setEditingSkill(undefined)
    setMsg(null)
  }

  // The signed-in session authorises writes. The token is only a fallback, so
  // it is stored when present but never required.
  function requireToken() {
    setAdminToken(token.trim())
    return true
  }

  async function saveBase() {
    if (!requireToken()) return
    setBusy(true); setMsg(null)
    try {
      await callFn('POST', { body: { kind: 'agent', agent_id: selected.agent_id, base_prompt: base } })
      setMsg({ type: 'ok', text: 'Identidade do agente gravada.' })
      await load(selected.agent_id)
    } catch (e) { setMsg({ type: 'error', text: e.message }) } finally { setBusy(false) }
  }

  async function removeSkill(skill) {
    if (!requireToken()) return
    if (!confirm(`Apagar a habilidade "${skill.name}"?`)) return
    setBusy(true); setMsg(null)
    try {
      await callFn('DELETE', { query: `?skill_id=${encodeURIComponent(skill.id)}` })
      await load(selected.agent_id)
    } catch (e) { setMsg({ type: 'error', text: e.message }) } finally { setBusy(false) }
  }

  const produto = agents.filter(a => a.kind === 'produto')
  const funcional = agents.filter(a => a.kind !== 'produto')

  return (
    <div className="p-6 max-w-3xl">
      <p className="text-gray-500 text-sm mb-1">
        Cada agente tem uma identidade e várias habilidades. Ao conversar, escolhe quais aplicar.
      </p>
      <p className="text-gray-600 text-xs mb-5">
        Agentes de produto são criados automaticamente quando adiciona uma app.
      </p>

      <details className="mb-5">
        <summary className="text-gray-600 text-xs cursor-pointer hover:text-gray-400">
          Token de emergência (não é necessário)
        </summary>
        <div className="mt-2">
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN" className={input} />
          <p className="text-gray-600 text-[11px] mt-1.5">
            A sua sessão de login já autoriza tudo. Use este campo apenas se a autenticação falhar.
          </p>
        </div>
      </details>

      {loading ? <p className="text-gray-500 text-sm">A carregar…</p> : (
        <>
          {[['Agentes de produto', produto], ['Agentes funcionais', funcional]].map(([label, list]) => (
            <div key={label} className="mb-5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
              <div className="grid grid-cols-2 gap-2">
                {list.map(a => (
                  <button key={a.agent_id} onClick={() => pick(a)}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                      selected?.agent_id === a.agent_id
                        ? 'border-accent-purple/60 bg-accent-purple/10'
                        : 'border-border bg-surface/40 hover:border-accent-purple/30'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-sm font-medium truncate">{a.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue whitespace-nowrap">
                        {a.skills.length} skill{a.skills.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px] mt-0.5 truncate">{a.agent_id}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!selected && (
            <div className="border-t border-border pt-5 text-center py-8">
              <p className="text-gray-400 text-sm">Selecione um agente acima</p>
              <p className="text-gray-600 text-xs mt-1">
                para editar a identidade dele e criar habilidades
              </p>
            </div>
          )}

          {selected && (
            <div className="border-t border-border pt-5">
              <h3 className="text-white font-semibold mb-3">{selected.name}</h3>

              <label className="block text-gray-400 text-xs font-medium mb-1.5">
                Identidade do agente — quem é, o que sabe, o que nunca deve fazer
              </label>
              <textarea rows={10} spellCheck={false} value={base} onChange={e => setBase(e.target.value)}
                className={`${input} font-mono text-[13px] leading-relaxed resize-y`} />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={saveBase} disabled={busy || base === (selected.base_prompt || '')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                  Gravar identidade
                </button>
                <span className="text-gray-600 text-xs">{base.length.toLocaleString('pt-BR')} caracteres</span>
              </div>

              <div className="flex items-center justify-between mt-6 mb-2">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Habilidades</p>
                {editingSkill === undefined && (
                  <button onClick={() => setEditingSkill(null)}
                    className="text-accent-purple text-xs hover:text-accent-blue">+ nova habilidade</button>
                )}
              </div>

              {editingSkill !== undefined && (
                <SkillEditor agentId={selected.agent_id} skill={editingSkill} token={token}
                  onCancel={() => setEditingSkill(undefined)}
                  onDone={() => { setEditingSkill(undefined); load(selected.agent_id) }} />
              )}

              {selected.skills.length === 0 && editingSkill === undefined && (
                <p className="text-gray-600 text-xs">Sem habilidades. O agente usa apenas a identidade acima.</p>
              )}

              <div className="flex flex-col gap-2">
                {selected.skills.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {s.name}{!s.active && <span className="text-gray-600 text-xs ml-2">(inativa)</span>}
                      </p>
                      <p className="text-gray-600 text-[11px] truncate">{s.description || `${s.content.slice(0, 70)}…`}</p>
                    </div>
                    <button onClick={() => setEditingSkill(s)} className="text-gray-500 hover:text-white text-xs">editar</button>
                    <button onClick={() => removeSkill(s)} className="text-gray-500 hover:text-red-400 text-xs">apagar</button>
                  </div>
                ))}
              </div>

              {msg && (
                <p className={`text-xs mt-4 rounded-lg py-2 px-3 border ${
                  msg.type === 'ok' ? 'text-green-400 bg-green-400/10 border-green-400/20'
                                    : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                  {msg.text}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
