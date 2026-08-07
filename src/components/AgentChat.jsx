import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Products come from the agents table via useProductAgents — a hardcoded list
// here meant an app added in the panel never appeared as a target.

const AGENTS = {
  agendafacil: {
    name: 'Agenda Fácil',
    description: 'Especialista em agendamento para clínicas e consultórios',
    color: 'from-blue-500 to-cyan-400',
    intro: 'Olá! Sou o especialista em AgendaFácil. Posso ajudar com estratégias de venda, marketing, dúvidas técnicas e criar planos de ação. O que precisa?',
  },
  clockly: {
    name: 'Clockly',
    description: 'Especialista em ponto eletrônico, RH e folha de pagamento',
    color: 'from-indigo-500 to-purple-600',
    intro: 'Olá! Sou o especialista em Clockly. Posso ajudar com estratégias B2B, conformidade Portaria 671, LGPD/GDPR, marketing e planos de ação. Como posso ajudar?',
  },
  ritmowork: {
    name: 'RitmoWork',
    description: 'Especialista em gestão de projetos e produtividade',
    color: 'from-violet-500 to-purple-500',
    intro: 'Olá! Sou o especialista em RitmoWork. Posso ajudar com estratégias vs concorrentes, conteúdo, marketing e planos de ação. O que precisa?',
  },
  vinculo: {
    name: 'Vínculo',
    description: 'Gestão clínica TCC para psicólogos — prontuário, agenda e financeiro',
    color: 'from-teal-500 to-emerald-400',
    intro: 'Olá! Sou o especialista em Vínculo — o prontuário que fala a língua da TCC. Posso ajudar com vendas, marketing para psicólogos, estratégias de captação, conteúdo e planos de ação. O que precisa?',
  },
  pesquisador: {
    name: 'Pesquisador',
    description: 'Analisa mercado, concorrentes e tendências de qualquer produto',
    color: 'from-amber-500 to-orange-500',
    intro: null,
    isMultiSystem: true,
  },
  copywriter: {
    name: 'Copywriter',
    description: 'Cria posts, textos de venda e conteúdo de marketing',
    color: 'from-pink-500 to-rose-500',
    intro: null,
    isMultiSystem: true,
  },
  revisor: {
    name: 'Revisor',
    description: 'Revê e melhora conteúdos criados para qualquer produto',
    color: 'from-green-500 to-teal-500',
    intro: null,
    isMultiSystem: true,
  },
  gerente: {
    name: 'Gerente',
    description: 'Aprova ou devolve conteúdos para revisão',
    color: 'from-red-500 to-orange-600',
    intro: null,
    isMultiSystem: true,
  },
}

const LI_ICON = (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export default function AgentChat({ agentId, agentLogo, onClose }) {
  const { systems: SYSTEMS } = useProductAgents()
  const agent = AGENTS[agentId]
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [messages, setMessages] = useState(
    agent.isMultiSystem ? [] : [{ role: 'assistant', content: agent.intro }]
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [planTitle, setPlanTitle] = useState(`Plano — ${agent.name}`)

  // Skills the agent can apply. Selecting none means "apply all active ones",
  // which is what the edge function does when skillIds is absent.
  const [skills, setSkills] = useState([])
  const [activeSkills, setActiveSkills] = useState(null) // null = todas
  // Always the agent's own skills. For a functional agent the chosen product
  // contributes its prompt as context, but not its skill list.
  const skillOwner = agentId

  useEffect(() => {
    let cancelled = false
    supabase
      .from('agent_skills')
      .select('id,name,description,sort_order')
      .eq('agent_id', skillOwner)
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => { if (!cancelled) setSkills(data || []) })
    return () => { cancelled = true }
  }, [skillOwner])

  function toggleSkill(id) {
    setActiveSkills(prev => {
      const current = prev ?? skills.map(s => s.id)
      return current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    })
  }

  const selectedSkillIds = activeSkills ?? skills.map(s => s.id)

  useEffect(() => {
    if (selectedSystem) {
      const sysName = SYSTEMS.find(s => s.id === selectedSystem)?.name ?? selectedSystem
      setPlanTitle(`${agent.name} — ${sysName}`)
      setMessages([{
        role: 'assistant',
        content: `Olá! Sou o ${agent.name} focado em ${sysName}. Como posso ajudar?`,
      }])
    }
  }, [selectedSystem])

  // Publish modal state
  const [publishModal, setPublishModal] = useState(null) // { text, msgIndex }
  const [groups, setGroups] = useState([])
  const [selectedDests, setSelectedDests] = useState(['feed'])
  const [publishing, setPublishing] = useState(false)
  const [publishedIds, setPublishedIds] = useState(new Set())

  // RitmoWork state
  const [savedToRitmo, setSavedToRitmo] = useState(new Set())
  const [savingRitmo, setSavingRitmo] = useState(null)

  const RITMO_API = 'https://xpywdkjpcsfepfvhtstb.supabase.co/functions/v1/ritmowork-api/v1'
  const RITMO_KEY = 'rw_live_b374b822aeee6136f97b225c11cb9e7412d10fc310d3b69c'
  const RITMO_LIST_ID = '03cf2e40-5f2f-4c4f-8117-680929cc36a3' // Rascunho — Agentes IA
  const RITMO_AREA_ID = '3177f1f6-a5c2-4593-b9cd-918deda75361' // Agentes IA

  async function saveToRitmoWork(content, msgIndex) {
    setSavingRitmo(msgIndex)
    try {
      const title = content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 80) || `Conteúdo — ${agent.name}`
      const res = await fetch(`${RITMO_API}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RITMO_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: stripMarkdown(content),
          list_id: RITMO_LIST_ID,
          area_id: RITMO_AREA_ID,
          labels: [agentId],
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedToRitmo(prev => new Set([...prev, msgIndex]))
    } catch (e) {
      alert('Erro ao guardar no RitmoWork: ' + e.message)
    } finally {
      setSavingRitmo(null)
    }
  }

  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const body = agent.isMultiSystem
        ? { product: selectedSystem, role: agentId, skillIds: selectedSkillIds, messages: next.map(m => ({ role: m.role, content: m.content })) }
        : { product: agentId, skillIds: selectedSkillIds, messages: next.map(m => ({ role: m.role, content: m.content })) }

      const { data, error } = await supabase.functions.invoke('agent-chat', { body })
      if (error) throw error
      setMessages(prev => [...prev, { role: 'assistant', content: data.content ?? 'Não consegui processar. Tente novamente.' }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Agente indisponível. Verifique se a edge function "agent-chat" está publicada no Supabase e o secret ANTHROPIC_API_KEY está configurado.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function stripMarkdown(text) {
    return text
      .replace(/^#{1,6}\s+/gm, '')          // remove headings
      .replace(/\*\*(.*?)\*\*/gs, '$1')      // remove **bold**
      .replace(/\*(.*?)\*/gs, '$1')          // remove *italic*
      .replace(/_(.*?)_/gs, '$1')            // remove _italic_
      .replace(/`([^`]+)`/g, '$1')           // remove `code`
      .replace(/^[-*+]\s+/gm, '• ')         // bullet → •
      .replace(/^\d+\.\s+/gm, '')           // remove numbered list markers
      .replace(/^>\s+/gm, '')               // remove blockquotes
      .replace(/^[-*_]{3,}\s*$/gm, '')      // remove horizontal rules
      .replace(/\n{3,}/g, '\n\n')           // collapse excess blank lines
      .trim()
  }

  async function openPublishModal(text, msgIndex) {
    setPublishModal({ text: stripMarkdown(text), msgIndex })
    setSelectedDests(['feed'])
    // Load groups from settings
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'linkedin_groups').maybeSingle()
      if (data?.value) setGroups(JSON.parse(data.value))
      else setGroups([])
    } catch {
      setGroups([])
    }
  }

  function toggleDest(dest) {
    setSelectedDests(prev =>
      prev.includes(dest) ? prev.filter(d => d !== dest) : [...prev, dest]
    )
  }

  async function doPublish() {
    if (selectedDests.length === 0 || !publishModal) return
    setPublishing(true)
    const errors = []

    for (const dest of selectedDests) {
      const groupId = dest.startsWith('group:') ? dest.slice(6) : null
      try {
        const { error } = await supabase.functions.invoke('linkedin-post', {
          body: { text: publishModal.text, groupId: groupId || null, agentId },
        })
        if (error) throw new Error(error.message)
      } catch (e) {
        const name = groupId
          ? (groups.find(g => g.id === groupId)?.name || groupId)
          : 'Feed principal'
        errors.push(`${name}: ${e.message}`)
      }
    }

    setPublishing(false)

    if (errors.length === 0) {
      setPublishedIds(prev => new Set([...prev, publishModal.msgIndex]))
      setPublishModal(null)
    } else {
      alert('Erros ao publicar:\n' + errors.join('\n'))
    }
  }

  function exportPDF() {
    const date = new Date().toLocaleDateString('pt-BR')
    const rows = messages.map(m => {
      const body = m.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
      return `<div class="msg ${m.role}"><div class="label">${m.role === 'user' ? 'Você' : agent.name}</div><div class="body">${body}</div></div>`
    }).join('')

    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${planTitle}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;padding:48px;max-width:760px;margin:0 auto}
  h1{font-size:24px;color:#6d28d9;margin-bottom:4px;font-weight:800}
  .sub{color:#9ca3af;font-size:13px;margin-bottom:36px}
  .msg{margin-bottom:16px;padding:14px 18px;border-radius:10px;page-break-inside:avoid}
  .user{background:#f5f3ff;border-left:4px solid #7c3aed}
  .assistant{background:#f8fafc;border-left:4px solid #06b6d4}
  .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
  .user .label{color:#7c3aed}.assistant .label{color:#0891b2}
  .body{font-size:14px;line-height:1.75}
  footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#d1d5db;text-align:center}
  @media print{body{padding:24px}}
</style></head><body>
  <h1>${planTitle}</h1>
  <p class="sub">Bitzen Software · ${date} · Agente: ${agent.name}</p>
  ${rows}
  <footer>bitzen.app — Gerado pelo painel de agentes Bitzen</footer>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl h-[88vh] bg-surface border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden">

          {/* Header */}
          <div className={`bg-gradient-to-r ${agent.color} px-4 py-3.5 flex items-center gap-3 flex-shrink-0`}>
            {agentLogo
              ? <img src={agentLogo} alt={agent.name} className="w-9 h-9 rounded-xl object-contain bg-white/20 p-1 flex-shrink-0" />
              : <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold flex-shrink-0">{agent.name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{agent.name}</p>
              <p className="text-white/70 text-xs truncate">{agent.description}</p>
            </div>
            <button onClick={exportPDF} title="Exportar PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white text-xs font-semibold transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
            <button onClick={onClose} className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Plan title */}
          <div className="px-4 py-2 bg-background border-b border-border flex-shrink-0">
            <input value={planTitle} onChange={e => setPlanTitle(e.target.value)}
              className="w-full bg-transparent text-gray-500 text-xs focus:outline-none focus:text-white transition-colors"
              placeholder="Título do plano (editável)..." />
          </div>

          {/* Skill picker — which habilidades this conversation applies */}
          {skills.length > 0 && (
            <div className="px-4 py-2.5 bg-background border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-gray-600 text-[11px] uppercase tracking-wider">
                  Habilidades · {selectedSkillIds.length} de {skills.length}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setActiveSkills(null)}
                    disabled={selectedSkillIds.length === skills.length}
                    className="text-[11px] text-gray-500 hover:text-accent-purple disabled:opacity-30 disabled:hover:text-gray-500 transition-colors">
                    Todas
                  </button>
                  <span className="text-gray-700 text-[11px]">·</span>
                  <button onClick={() => setActiveSkills([])}
                    disabled={selectedSkillIds.length === 0}
                    className="text-[11px] text-gray-500 hover:text-accent-purple disabled:opacity-30 disabled:hover:text-gray-500 transition-colors">
                    Nenhuma
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {skills.map(s => {
                  const on = selectedSkillIds.includes(s.id)
                  return (
                    <button key={s.id} onClick={() => toggleSkill(s.id)} title={s.description || s.name}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                        on ? 'border-accent-purple/60 bg-accent-purple/20 text-white'
                           : 'border-border text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}>
                      <span className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[9px] leading-none ${
                        on ? 'bg-accent-purple border-accent-purple text-white' : 'border-gray-600'}`}>
                        {on ? '✓' : ''}
                      </span>
                      {s.name}
                    </button>
                  )
                })}
              </div>
              {selectedSkillIds.length === 0 && (
                <p className="text-amber-400/70 text-[11px] mt-1.5">
                  Sem habilidades — o agente responde só com a identidade dele.
                </p>
              )}
            </div>
          )}

          {/* System picker for multi-system agents */}
          {agent.isMultiSystem && !selectedSystem ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
              <div className="text-center">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-white text-xl font-bold">{agent.name.charAt(0)}</span>
                </div>
                <p className="text-white font-semibold text-lg mb-1">Escolhe o sistema</p>
                <p className="text-gray-500 text-sm">Para qual produto devo focar?</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                {SYSTEMS.map(sys => (
                  <button
                    key={sys.id}
                    onClick={() => setSelectedSystem(sys.id)}
                    className={`py-4 px-3 rounded-2xl bg-gradient-to-br ${sys.color} text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg`}
                  >
                    {sys.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (<>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <span className="text-white text-[10px] font-bold">{agent.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5 max-w-[80%]">
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-accent-purple text-white rounded-br-sm'
                      : 'bg-background border border-border text-gray-300 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && i > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {/* LinkedIn — só para agentes que criam conteúdo publicável */}
                      {!['pesquisador', 'revisor', 'gerente'].includes(agentId) && (
                      <button
                        onClick={() => !publishedIds.has(i) && openPublishModal(msg.content, i)}
                        className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          publishedIds.has(i)
                            ? 'bg-green-500/15 text-green-400 border border-green-500/20 cursor-default'
                            : 'bg-[#0077B5]/15 hover:bg-[#0077B5]/25 text-[#0ea5e9] border border-[#0077B5]/20'
                        }`}
                      >
                        {publishedIds.has(i) ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : LI_ICON}
                        {publishedIds.has(i) ? 'Publicado!' : 'LinkedIn'}
                      </button>
                      )}

                      {/* RitmoWork */}
                      <button
                        onClick={() => !savedToRitmo.has(i) && saveToRitmoWork(msg.content, i)}
                        disabled={savingRitmo === i}
                        className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          savedToRitmo.has(i)
                            ? 'bg-green-500/15 text-green-400 border border-green-500/20 cursor-default'
                            : 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/20'
                        } disabled:opacity-50`}
                      >
                        {savedToRitmo.has(i) ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : savingRitmo === i ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        )}
                        {savedToRitmo.has(i) ? 'Guardado!' : savingRitmo === i ? 'A guardar...' : 'RitmoWork'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-[10px] font-bold">{agent.name.charAt(0)}</span>
                </div>
                <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border flex gap-2 flex-shrink-0">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={
                agent.isMultiSystem && selectedSystem
                  ? `Pergunte ao ${agent.name} sobre ${SYSTEMS.find(s => s.id === selectedSystem)?.name}...`
                  : `Pergunte sobre ${agent.name}...`
              }
              disabled={loading}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors disabled:opacity-50" />
            <button onClick={send} disabled={loading || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-accent-purple to-accent-blue rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          </>)}
        </div>
      </div>

      {/* Publish modal */}
      {publishModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !publishing && setPublishModal(null)} />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-[#0077B5] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">Publicar no LinkedIn</p>
                <p className="text-gray-500 text-xs">Escolha onde publicar</p>
              </div>
              <button onClick={() => setPublishModal(null)} disabled={publishing}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-40">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Post preview */}
            <div className="px-5 py-3 border-b border-border">
              <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{publishModal.text}</p>
            </div>

            {/* Destinations */}
            <div className="px-5 py-4 flex flex-col gap-2">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Destinos</p>

              {/* Feed principal */}
              <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                selectedDests.includes('feed') ? 'bg-[#0077B5]/10 border border-[#0077B5]/30' : 'bg-background border border-border hover:border-border'
              }`}>
                <input type="checkbox" checked={selectedDests.includes('feed')}
                  onChange={() => toggleDest('feed')}
                  className="w-4 h-4 accent-[#0077B5] cursor-pointer" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Meu feed</p>
                  <p className="text-gray-500 text-xs">Visível para toda a rede</p>
                </div>
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </label>

              {/* Groups */}
              {groups.map(group => {
                const dest = `group:${group.id}`
                return (
                  <label key={group.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedDests.includes(dest) ? 'bg-[#0077B5]/10 border border-[#0077B5]/30' : 'bg-background border border-border hover:border-border'
                  }`}>
                    <input type="checkbox" checked={selectedDests.includes(dest)}
                      onChange={() => toggleDest(dest)}
                      className="w-4 h-4 accent-[#0077B5] cursor-pointer" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{group.name}</p>
                      <p className="text-gray-500 text-xs">Grupo · ID {group.id}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )
              })}

              {groups.length === 0 && (
                <p className="text-gray-600 text-xs px-1">
                  Nenhum grupo configurado. Adicione em <span className="text-accent-purple">Painel Admin → Configurações → LinkedIn</span>.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setPublishModal(null)} disabled={publishing}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-background border border-border hover:text-white transition-colors disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={doPublish}
                disabled={publishing || selectedDests.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0077B5] hover:bg-[#006097] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {publishing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : LI_ICON}
                {publishing ? 'Publicando...' : `Publicar (${selectedDests.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
