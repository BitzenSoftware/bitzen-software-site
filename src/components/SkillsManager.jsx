import { useEffect, useState } from 'react'
import { getAdminToken, setAdminToken, adminHeaders } from '../lib/adminData'

const SB_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const FN = `${SB_URL}/functions/v1/agent-skills`

async function callFn(method, { body, query } = {}) {
  const res = await fetch(`${FN}${query || ''}`, {
    method,
    headers: await adminHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json
}

const input = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors'

function SkillEditor({ agentId, skill, onDone, onCancel }) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input className={input} placeholder="Nome da habilidade" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className={input} placeholder="Descrição curta (opcional)" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <textarea rows={10} spellCheck={false} placeholder="Instruções desta habilidade…"
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

function AgentCard({ agent, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
        selected ? 'border-accent-purple/60 bg-accent-purple/10' : 'border-border bg-surface/40 hover:border-accent-purple/30'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-white text-sm font-medium truncate">{agent.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue whitespace-nowrap">
          {agent.skills.length}
        </span>
      </div>
      <p className="text-gray-600 text-[11px] mt-0.5 truncate">{agent.agent_id}</p>
    </button>
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

  // The signed-in session authorises writes; the token is only a fallback.
  function persistToken() { setAdminToken(token.trim()) }

  async function saveBase() {
    persistToken()
    setBusy(true); setMsg(null)
    try {
      await callFn('POST', { body: { kind: 'agent', agent_id: selected.agent_id, base_prompt: base } })
      setMsg({ type: 'ok', text: 'Identidade gravada.' })
      await load(selected.agent_id)
    } catch (e) { setMsg({ type: 'error', text: e.message }) } finally { setBusy(false) }
  }

  async function removeSkill(skill) {
    persistToken()
    if (!confirm(`Apagar a habilidade "${skill.name}"?`)) return
    setBusy(true); setMsg(null)
    try {
      await callFn('DELETE', { query: `?skill_id=${encodeURIComponent(skill.id)}` })
      await load(selected.agent_id)
    } catch (e) { setMsg({ type: 'error', text: e.message }) } finally { setBusy(false) }
  }

  const produto = agents.filter(a => a.kind === 'produto')
  const funcional = agents.filter(a => a.kind !== 'produto')
  const dirty = selected && base !== (selected.base_prompt || '')

  return (
    <div className="flex h-full min-h-0">
      {/* Agent list */}
      <aside className="w-64 flex-shrink-0 border-r border-border overflow-y-auto p-4">
        {loading ? (
          <p className="text-gray-500 text-sm">A carregar…</p>
        ) : (
          [['Produto', produto], ['Funcionais', funcional]].map(([label, list]) => (
            <div key={label} className="mb-5">
              <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">{label}</p>
              <div className="flex flex-col gap-1.5">
                {list.map(a => (
                  <AgentCard key={a.agent_id} agent={a}
                    selected={selected?.agent_id === a.agent_id} onClick={() => pick(a)} />
                ))}
              </div>
            </div>
          ))
        )}

        <details className="mt-2">
          <summary className="text-gray-600 text-[11px] cursor-pointer hover:text-gray-400">
            Token de emergência
          </summary>
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN" className={`${input} mt-2 text-xs`} />
          <p className="text-gray-600 text-[10px] mt-1.5">
            A sua sessão já autoriza tudo. Use apenas se a autenticação falhar.
          </p>
        </details>
      </aside>

      {/* Editor */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-gray-400 text-sm">Selecione um agente à esquerda</p>
            <p className="text-gray-600 text-xs mt-1">para editar a identidade e criar habilidades</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Header: name left, new-skill action right */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">{selected.name}</h3>
                <p className="text-gray-600 text-xs mt-0.5">
                  {selected.agent_id} · {selected.skills.length} habilidade{selected.skills.length === 1 ? '' : 's'}
                </p>
              </div>
              <button onClick={() => setEditingSkill(null)} disabled={editingSkill !== undefined}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                + Nova habilidade
              </button>
            </div>

            {msg && (
              <p className={`text-xs mb-4 rounded-lg py-2 px-3 border ${
                msg.type === 'ok' ? 'text-green-400 bg-green-400/10 border-green-400/20'
                                  : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                {msg.text}
              </p>
            )}

            {/* Identity */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 text-xs font-medium">
                  Identidade — quem é, o que sabe, o que nunca deve fazer
                </label>
                <span className="text-gray-600 text-[11px]">{base.length.toLocaleString('pt-BR')} caracteres</span>
              </div>
              <textarea rows={14} spellCheck={false} value={base} onChange={e => setBase(e.target.value)}
                className={`${input} font-mono text-[13px] leading-relaxed resize-y`} />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={saveBase} disabled={busy || !dirty}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                  {busy ? 'A gravar…' : 'Gravar identidade'}
                </button>
                {dirty && <span className="text-amber-400/80 text-xs">alterações por gravar</span>}
              </div>
            </div>

            {/* Skills */}
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Habilidades</p>

            {editingSkill !== undefined && (
              <SkillEditor agentId={selected.agent_id} skill={editingSkill}
                onCancel={() => setEditingSkill(undefined)}
                onDone={() => { setEditingSkill(undefined); load(selected.agent_id) }} />
            )}

            {selected.skills.length === 0 && editingSkill === undefined && (
              <p className="text-gray-600 text-xs">
                Sem habilidades. O agente usa apenas a identidade acima.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {selected.skills.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {s.name}{!s.active && <span className="text-gray-600 text-xs ml-2">(inativa)</span>}
                    </p>
                    <p className="text-gray-600 text-[11px] truncate">
                      {s.description || `${s.content.slice(0, 90)}…`}
                    </p>
                  </div>
                  <button onClick={() => setEditingSkill(s)} className="text-gray-500 hover:text-white text-xs">editar</button>
                  <button onClick={() => removeSkill(s)} className="text-gray-500 hover:text-red-400 text-xs">apagar</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
