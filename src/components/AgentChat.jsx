import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
}

export default function AgentChat({ agentId, agentLogo, onClose }) {
  const agent = AGENTS[agentId]
  const [messages, setMessages] = useState([{ role: 'assistant', content: agent.intro }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [planTitle, setPlanTitle] = useState(`Plano — ${agent.name}`)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: { agentId, message: text, history: messages },
      })
      if (error) throw error
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Agente indisponível. Verifique se a edge function "agent-chat" está publicada no Supabase e o secret ANTHROPIC_API_KEY está configurado.',
      }])
    } finally {
      setLoading(false)
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-[88vh] bg-surface border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden">

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

        <div className="px-4 py-2 bg-background border-b border-border flex-shrink-0">
          <input value={planTitle} onChange={e => setPlanTitle(e.target.value)}
            className="w-full bg-transparent text-gray-500 text-xs focus:outline-none focus:text-white transition-colors"
            placeholder="Título do plano (editável)..." />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 mt-1`}>
                  <span className="text-white text-[10px] font-bold">{agent.name.charAt(0)}</span>
                </div>
              )}
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-accent-purple text-white rounded-br-sm'
                  : 'bg-background border border-border text-gray-300 rounded-bl-sm'
              }`}>
                {msg.content}
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
                  <span key={d} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-border flex gap-2 flex-shrink-0">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Pergunte sobre ${agent.name}...`} disabled={loading}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors disabled:opacity-50" />
          <button onClick={send} disabled={loading || !input.trim()}
            className="p-2.5 bg-gradient-to-r from-accent-purple to-accent-blue rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
