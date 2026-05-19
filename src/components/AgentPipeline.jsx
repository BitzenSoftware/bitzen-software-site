import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SYSTEMS = [
  { id: 'agendafacil', name: 'Agenda Fácil', color: 'from-blue-500 to-cyan-400' },
  { id: 'clockly', name: 'Clockly', color: 'from-indigo-500 to-purple-600' },
  { id: 'ritmowork', name: 'RitmoWork', color: 'from-violet-500 to-purple-500' },
  { id: 'vinculo', name: 'Vínculo', color: 'from-teal-500 to-emerald-400' },
]

const STAGES = [
  { id: 'pesquisador', name: 'Pesquisador', color: 'from-amber-500 to-orange-500' },
  { id: 'copywriter',  name: 'Copywriter',  color: 'from-pink-500 to-rose-500' },
  { id: 'revisor',     name: 'Revisor',     color: 'from-green-500 to-teal-500' },
  { id: 'gerente',     name: 'Gerente',     color: 'from-red-500 to-orange-600' },
]

const MAX_ITERATIONS = 3
const RITMO_API = 'https://xpywdkjpcsfepfvhtstb.supabase.co/functions/v1/ritmowork-api/v1'
const RITMO_KEY = 'rw_live_b374b822aeee6136f97b225c11cb9e7412d10fc310d3b69c'
const RITMO_LIST_ID = '03cf2e40-5f2f-4c4f-8117-680929cc36a3'
const RITMO_AREA_ID = '3177f1f6-a5c2-4593-b9cd-918deda75361'

const LI_ICON = (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const LIGHTNING = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/\*(.*?)\*/gs, '$1')
    .replace(/_(.*?)_/gs, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function LinkedInPreview({ content, isLoading, approved }) {
  const clean = stripMarkdown(content)
  return (
    <div className="bg-[#f3f2ef] flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#0077B5] flex items-center justify-center">
            {LI_ICON}
          </div>
          <span className="text-[#0077B5] font-semibold text-sm hidden sm:block">LinkedIn</span>
        </div>
        <div className="flex-1" />
        {approved && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            ✅ Aprovado pelo Gerente
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-sm">Bitzen Software</p>
                <p className="text-gray-500 text-xs">Software · Agora</p>
                <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                  Partilhado com todos
                </p>
              </div>
              <button className="text-[#0077B5] text-xs font-semibold border border-[#0077B5] rounded-full px-3 py-1 hover:bg-[#0077B5]/5 flex-shrink-0">+ Seguir</button>
            </div>
            <div className="px-4 pb-3 min-h-[120px]">
              {isLoading && !clean ? (
                <div className="flex flex-col gap-2 animate-pulse">
                  {[1, 0.8, 1, 0.6, 1, 0.7].map((w, i) => (
                    <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: `${w * 100}%` }} />
                  ))}
                </div>
              ) : clean ? (
                <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{clean}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">O conteúdo aparecerá aqui após o Copywriter gerar o post...</p>
              )}
            </div>
            <div className="px-4 py-1 border-t border-gray-100 flex items-center justify-between text-gray-500 text-xs">
              <span className="flex items-center gap-1"><span>👍</span><span>❤️</span><span>💡</span><span className="ml-1">24 reações</span></span>
              <span>3 comentários</span>
            </div>
            <div className="px-2 py-1 border-t border-gray-100 flex items-center">
              {[{ icon: '👍', label: 'Gosto' }, { icon: '💬', label: 'Comentar' }, { icon: '🔁', label: 'Partilhar' }, { icon: '✉️', label: 'Enviar' }].map(btn => (
                <button key={btn.label} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-gray-500 font-medium hover:bg-gray-100 transition-colors">
                  <span>{btn.icon}</span><span className="hidden sm:inline">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
          {clean && (
            <p className="text-center text-xs text-gray-400 mt-3">
              {clean.length} caracteres · {clean.length > 1300
                ? <span className="text-red-500 font-medium">excede o limite do LinkedIn (1300)</span>
                : <span className="text-green-600">dentro do limite</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 150, 300].map(d => (
        <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  )
}

export default function AgentPipeline({ onClose }) {
  const [task, setTask] = useState('')
  const [product, setProduct] = useState(null)
  const [stage, setStage] = useState('input') // input | clarifying | running | done
  const [results, setResults] = useState({})
  const [currentAgent, setCurrentAgent] = useState(null)
  const [previewContent, setPreviewContent] = useState('')
  const [finalContent, setFinalContent] = useState('')
  const [approved, setApproved] = useState(false)
  const [iteration, setIteration] = useState(0)
  const [savedToRitmo, setSavedToRitmo] = useState(false)
  const [savingRitmo, setSavingRitmo] = useState(false)
  const [publishModal, setPublishModal] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [groups, setGroups] = useState([])
  const [selectedDests, setSelectedDests] = useState(['feed'])

  // Clarification phase
  const [clarifyMessages, setClarifyMessages] = useState([]) // [{role:'user'|'assistant', content}]
  const [clarifyInput, setClarifyInput] = useState('')

  // Post-pipeline adjustments
  const [adjustInput, setAdjustInput] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)

  const clarifyEndRef = useRef(null)

  useEffect(() => {
    clarifyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [clarifyMessages, currentAgent])

  function buildClarifyPrompt() {
    const productName = product ? (SYSTEMS.find(s => s.id === product)?.name ?? product) : 'Genérico'
    return `Produto já selecionado pelo utilizador: ${productName}. NÃO questiones o produto — está definido.

Tarefa solicitada: "${task}"

Avalia APENAS se o objetivo ou ângulo da tarefa está suficientemente claro para criar conteúdo de qualidade. Se está claro, confirma em 1-2 frases o que vais trabalhar. Se há genuína ambiguidade no OBJETIVO (ex: para que público, que ângulo, que tom), faz NO MÁXIMO 1 pergunta directa e objectiva. NUNCA perguntes sobre o produto — já está definido.`
  }

  async function callAgent(role, userMsg, history = []) {
    const messages = history.length > 0
      ? [...history, { role: 'user', content: userMsg }]
      : [{ role: 'user', content: userMsg }]
    const { data, error } = await supabase.functions.invoke('agent-chat', {
      body: { role, product, messages },
    })
    if (error) throw error
    return data?.content ?? 'Sem resposta'
  }

  // ── Clarification phase ─────────────────────────────────────────────────────

  async function startClarification() {
    if (!task.trim() || !product) return
    setStage('clarifying')
    setClarifyMessages([])
    setClarifyInput('')
    setCurrentAgent('pesquisador')
    try {
      const response = await callAgent('pesquisador', buildClarifyPrompt())
      setClarifyMessages([{ role: 'assistant', content: response }])
    } catch {
      setClarifyMessages([{ role: 'assistant', content: 'Não foi possível contactar o Pesquisador. Podes avançar directamente.' }])
    }
    setCurrentAgent(null)
  }

  async function sendClarifyMessage() {
    const msg = clarifyInput.trim()
    if (!msg || currentAgent) return
    setClarifyInput('')
    const prev = clarifyMessages
    const updated = [...prev, { role: 'user', content: msg }]
    setClarifyMessages(updated)
    setCurrentAgent('pesquisador')
    try {
      // history = initial prompt + all previous turns; callAgent appends new user msg
      const history = [{ role: 'user', content: buildClarifyPrompt() }, ...prev]
      const response = await callAgent('pesquisador', msg, history)
      setClarifyMessages([...updated, { role: 'assistant', content: response }])
    } catch {
      setClarifyMessages([...updated, { role: 'assistant', content: 'Erro ao responder.' }])
    }
    setCurrentAgent(null)
  }

  // ── Pipeline execution ──────────────────────────────────────────────────────

  async function proceedToPipeline() {
    if (currentAgent) return
    setStage('running')
    setResults({})
    setPreviewContent('')
    setFinalContent('')
    setApproved(false)
    setIteration(0)
    setSavedToRitmo(false)
    setPublished(false)

    setCurrentAgent('pesquisador')
    let research = ''
    try {
      let res
      if (clarifyMessages.length > 0) {
        const history = [{ role: 'user', content: buildClarifyPrompt() }, ...clarifyMessages]
        res = await callAgent('pesquisador', 'Com base na conversa anterior, realiza agora a pesquisa completa e detalhada para cumprir a tarefa.', history)
      } else {
        res = await callAgent('pesquisador', task)
      }
      research = res
      setResults(prev => ({ ...prev, pesquisador: research }))
    } catch (e) {
      research = `Erro: ${e.message}`
      setResults(prev => ({ ...prev, pesquisador: research }))
    }

    await runPipelineLoop(research)
  }

  async function runPipelineLoop(research) {
    let gerenteFeedback = ''
    let revisedContent = ''
    let isApproved = false

    for (let iter = 1; iter <= MAX_ITERATIONS && !isApproved; iter++) {
      setIteration(iter)

      // Copywriter
      setCurrentAgent('copywriter')
      let copywriterResult = ''
      try {
        const msg = iter === 1
          ? `Pesquisa realizada:\n\n${research}\n\nCom base nesta pesquisa, cria AGORA um post completo e pronto para publicar no LinkedIn sobre: ${task}\n\nIMPORTANTE: Entrega directamente o texto do post, sem perguntas, sem pedidos de clarificação, sem introduções. Apenas o post.`
          : `Post anterior:\n\n${revisedContent}\n\nFeedback do Gerente (tentativa ${iter - 1}):\n\n${gerenteFeedback}\n\nMelhora o post de LinkedIn corrigindo exactamente o que o Gerente apontou. Entrega apenas o post melhorado.`
        copywriterResult = await callAgent('copywriter', msg)
        setResults(prev => ({ ...prev, copywriter: copywriterResult }))
        setPreviewContent(copywriterResult)
      } catch (e) {
        copywriterResult = `Erro: ${e.message}`
        setResults(prev => ({ ...prev, copywriter: copywriterResult }))
      }

      // Revisor
      setCurrentAgent('revisor')
      try {
        revisedContent = await callAgent('revisor', `Revê este post e devolve APENAS o texto final corrigido e melhorado, pronto para publicar no LinkedIn. Não incluas análises, cabeçalhos, avaliações ou comentários — somente o post revisto.\n\nPost do Copywriter:\n\n${copywriterResult}`)
        setResults(prev => ({ ...prev, revisor: revisedContent }))
        setPreviewContent(revisedContent)
      } catch (e) {
        revisedContent = copywriterResult
        setResults(prev => ({ ...prev, revisor: `Erro: ${e.message}` }))
      }

      // Gerente
      setCurrentAgent('gerente')
      try {
        const isFinal = iter === MAX_ITERATIONS
        const gerenteMsg = isFinal
          ? `Esta é a versão final após ${MAX_ITERATIONS} rondas de revisão. O teu trabalho agora é aprovar com ✅ APROVADO. Podes sugerir pequenas melhorias, mas OBRIGATORIAMENTE declara APROVADO.\n\nConteúdo:\n\n${revisedContent}`
          : `Avalia este conteúdo para publicação (tentativa ${iter} de ${MAX_ITERATIONS}):\n\n${revisedContent}`
        gerenteFeedback = await callAgent('gerente', gerenteMsg)
        setResults(prev => ({ ...prev, gerente: gerenteFeedback }))
        isApproved = gerenteFeedback.includes('APROVADO') || isFinal
      } catch (e) {
        gerenteFeedback = `Erro: ${e.message}`
        setResults(prev => ({ ...prev, gerente: gerenteFeedback }))
        if (iter === MAX_ITERATIONS) isApproved = true
      }
    }

    setFinalContent(revisedContent)
    setApproved(isApproved)
    setPreviewContent(revisedContent)
    setCurrentAgent(null)
    setStage('done')
  }

  // ── Post-pipeline adjustments ───────────────────────────────────────────────

  async function sendAdjustment() {
    if (!adjustInput.trim() || isAdjusting) return
    const msg = adjustInput.trim()
    setAdjustInput('')
    setIsAdjusting(true)
    try {
      const adjustMsg = `Pesquisa de base:\n\n${results.pesquisador ?? ''}\n\nPost actual:\n\n${finalContent}\n\nO utilizador pediu este ajuste: "${msg}"\n\nFaz APENAS os ajustes pedidos e devolve o post completo, melhorado, pronto para publicar no LinkedIn. Sem análises, sem comentários — apenas o post.`
      const adjusted = await callAgent('copywriter', adjustMsg)
      setFinalContent(adjusted)
      setPreviewContent(adjusted)
    } catch (e) {
      alert('Erro ao ajustar: ' + e.message)
    } finally {
      setIsAdjusting(false)
    }
  }

  // ── RitmoWork + LinkedIn ────────────────────────────────────────────────────

  async function saveToRitmoWork() {
    setSavingRitmo(true)
    try {
      const sysName = SYSTEMS.find(s => s.id === product)?.name ?? product
      const title = task.slice(0, 80) || `Pipeline — ${sysName}`
      const description = `TAREFA: ${task}\n\n--- PESQUISA ---\n${results.pesquisador ?? ''}\n\n--- CONTEÚDO FINAL ---\n${stripMarkdown(finalContent)}`
      const res = await fetch(`${RITMO_API}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RITMO_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, list_id: RITMO_LIST_ID, area_id: RITMO_AREA_ID, labels: ['pipeline', product] }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedToRitmo(true)
    } catch (e) {
      alert('Erro ao guardar: ' + e.message)
    } finally {
      setSavingRitmo(false)
    }
  }

  async function openPublish() {
    setSelectedDests(['feed'])
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'linkedin_groups').maybeSingle()
      setGroups(data?.value ? JSON.parse(data.value) : [])
    } catch { setGroups([]) }
    setPublishModal(true)
  }

  async function doPublish() {
    setPublishing(true)
    const text = stripMarkdown(finalContent)
    for (const dest of selectedDests) {
      const groupId = dest.startsWith('group:') ? dest.slice(6) : null
      try { await supabase.functions.invoke('linkedin-post', { body: { text, groupId, agentId: 'pipeline' } }) } catch {}
    }
    setPublishing(false)
    setPublished(true)
    setPublishModal(false)
  }

  const selectedSystem = SYSTEMS.find(s => s.id === product)
  const isRunning = stage === 'running'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 z-[70] flex flex-col bg-background">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            {LIGHTNING}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Pipeline Completo</p>
            <p className="text-white/70 text-xs">Pesquisador → Copywriter → Revisor → Gerente</p>
          </div>
          {(stage === 'running' || stage === 'done') && selectedSystem && (
            <div className="hidden sm:flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
              <span className="text-white/80 text-xs">{selectedSystem.name}</span>
              {iteration > 0 && (
                <span className="text-white/60 text-xs">· Tentativa {Math.min(iteration, MAX_ITERATIONS)}/{MAX_ITERATIONS}</span>
              )}
            </div>
          )}
          <button onClick={onClose} className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0">

          {/* ── Input stage ── */}
          {stage === 'input' && (
            <>
              <div className="w-full md:w-[420px] flex-shrink-0 overflow-y-auto p-6 flex flex-col gap-6 border-r border-border">
                <div>
                  <p className="text-white text-sm font-semibold mb-3">Qual o produto?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SYSTEMS.map(sys => (
                      <button key={sys.id} onClick={() => setProduct(sys.id)}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
                          product === sys.id
                            ? `bg-gradient-to-r ${sys.color} text-white border-transparent shadow-lg`
                            : 'bg-surface border-border text-gray-400 hover:text-white hover:border-accent-purple/40'
                        }`}>
                        {sys.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold mb-2">Qual a tarefa?</p>
                  <p className="text-gray-500 text-xs mb-3">Ex: "Cria um post sobre os benefícios do produto para pequenas empresas"</p>
                  <textarea
                    value={task}
                    onChange={e => setTask(e.target.value)}
                    rows={5}
                    placeholder="Descreve o que queres que os agentes produzam..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={startClarification}
                  disabled={!task.trim() || !product}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {LIGHTNING}
                  Iniciar Pipeline
                </button>
              </div>
              <LinkedInPreview content="" isLoading={false} approved={false} />
            </>
          )}

          {/* ── Clarifying stage ── */}
          {stage === 'clarifying' && (
            <>
              <div className="w-full md:w-[420px] flex-shrink-0 flex flex-col border-r border-border">
                {/* Clarify header */}
                <div className="px-4 py-3 border-b border-border flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Pesquisador</p>
                      <p className="text-gray-400 text-xs">A verificar a clareza da tarefa</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {/* Task bubble */}
                  <div className="flex justify-end">
                    <div className="bg-accent-purple/20 border border-accent-purple/20 rounded-xl rounded-tr-none px-3 py-2.5 text-white text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed">
                      {task}
                    </div>
                  </div>

                  {clarifyMessages.map((msg, i) =>
                    msg.role === 'assistant' ? (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-[10px] font-bold">P</span>
                        </div>
                        <div className="bg-surface rounded-xl rounded-tl-none px-3 py-2.5 text-gray-300 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap">
                          {stripMarkdown(msg.content)}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-end">
                        <div className="bg-accent-purple/20 border border-accent-purple/20 rounded-xl rounded-tr-none px-3 py-2.5 text-white text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    )
                  )}

                  {currentAgent === 'pesquisador' && (
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-[10px] font-bold">P</span>
                      </div>
                      <div className="bg-surface rounded-xl rounded-tl-none px-3 py-2.5">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                  <div ref={clarifyEndRef} />
                </div>

                {/* Clarify input */}
                <div className="px-4 py-3 border-t border-border flex-shrink-0 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={clarifyInput}
                      onChange={e => setClarifyInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendClarifyMessage() } }}
                      placeholder="Responder ao Pesquisador..."
                      disabled={!!currentAgent}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 disabled:opacity-50 transition-colors"
                    />
                    <button
                      onClick={sendClarifyMessage}
                      disabled={!clarifyInput.trim() || !!currentAgent}
                      className="px-3 py-2 bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple rounded-lg text-sm font-bold disabled:opacity-40 transition-colors"
                    >
                      →
                    </button>
                  </div>
                  <button
                    onClick={proceedToPipeline}
                    disabled={!!currentAgent}
                    className="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                  >
                    {LIGHTNING}
                    Avançar para Pipeline →
                  </button>
                  <button
                    onClick={() => setStage('input')}
                    disabled={!!currentAgent}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-center disabled:opacity-40"
                  >
                    ← Voltar e editar tarefa
                  </button>
                </div>
              </div>
              <LinkedInPreview content="" isLoading={false} approved={false} />
            </>
          )}

          {/* ── Running / Done stage ── */}
          {(stage === 'running' || stage === 'done') && (
            <>
              <div className="w-full md:w-[400px] lg:w-[440px] flex-shrink-0 overflow-y-auto p-4 flex flex-col gap-3 border-r border-border">

                {STAGES.map((s, idx) => {
                  const result = results[s.id]
                  const isCurrent = currentAgent === s.id
                  const isPending = !result && !isCurrent
                  return (
                    <div key={s.id} className={`rounded-xl border transition-all ${
                      isCurrent ? 'border-accent-purple/40 bg-accent-purple/5' :
                      result ? 'border-border bg-background' :
                      'border-border/30 bg-background/30 opacity-40'
                    }`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-bold">{idx + 1}</span>
                        </div>
                        <p className="text-white text-sm font-medium flex-1">{s.name}</p>
                        {isCurrent && (
                          <div className="flex gap-1 items-center">
                            {[0, 150, 300].map(d => (
                              <span key={d} className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                          </div>
                        )}
                        {result && !isCurrent && (
                          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isPending && <div className="w-4 h-4 rounded-full border border-border/60 flex-shrink-0" />}
                      </div>
                      {result && (
                        <div className="px-4 pb-3">
                          <div className="bg-surface rounded-lg p-3 text-gray-300 text-xs leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {stripMarkdown(result)}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {stage === 'done' && (
                  <div className={`rounded-xl border p-4 ${approved ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                    <p className={`text-sm font-semibold mb-3 ${approved ? 'text-green-400' : 'text-yellow-400'}`}>
                      {approved ? '✅ Aprovado — pronto para publicar' : '⚠️ Devolvido para revisão'}
                    </p>

                    {approved ? (
                      <>
                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <button onClick={openPublish} disabled={published}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              published
                                ? 'bg-green-500/15 text-green-400 border border-green-500/20 cursor-default'
                                : 'bg-[#0077B5]/15 hover:bg-[#0077B5]/25 text-[#0ea5e9] border border-[#0077B5]/20'
                            }`}>
                            {published
                              ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              : LI_ICON}
                            {published ? 'Publicado!' : 'Publicar no LinkedIn'}
                          </button>
                          <button onClick={saveToRitmoWork} disabled={savingRitmo || savedToRitmo}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              savedToRitmo
                                ? 'bg-green-500/15 text-green-400 border border-green-500/20 cursor-default'
                                : 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/20'
                            } disabled:opacity-50`}>
                            {savedToRitmo
                              ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              : savingRitmo
                                ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            }
                            {savedToRitmo ? 'Guardado!' : savingRitmo ? 'A guardar...' : 'Guardar no RitmoWork'}
                          </button>
                          <button onClick={() => { setStage('input'); setResults({}); setTask(''); setProduct(null); setPreviewContent(''); setClarifyMessages([]) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 border border-border hover:text-white transition-colors">
                            Nova tarefa
                          </button>
                        </div>

                        {/* Adjustment chat */}
                        <div className="border-t border-border/40 pt-3">
                          <p className="text-gray-400 text-xs font-medium mb-2">Pedir ajustes ao post</p>
                          <p className="text-gray-600 text-xs mb-2">Ex: "Torna o início mais impactante" ou "Adiciona urgência no CTA"</p>
                          <div className="flex gap-2">
                            <input
                              value={adjustInput}
                              onChange={e => setAdjustInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdjustment() } }}
                              placeholder="Descreve o ajuste que queres..."
                              disabled={isAdjusting}
                              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 disabled:opacity-50 transition-colors"
                            />
                            <button
                              onClick={sendAdjustment}
                              disabled={!adjustInput.trim() || isAdjusting}
                              className="px-3 py-2 bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              {isAdjusting
                                ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                : '✏️'}
                              {isAdjusting ? 'A ajustar...' : 'Ajustar'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => { setStage('input'); setResults({}) }}
                        className="text-xs text-accent-purple hover:underline">
                        Ajustar tarefa e tentar novamente →
                      </button>
                    )}
                  </div>
                )}
              </div>

              <LinkedInPreview content={previewContent} isLoading={isRunning} approved={approved} />
            </>
          )}
        </div>
      </div>

      {/* LinkedIn publish modal */}
      {publishModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !publishing && setPublishModal(false)} />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-[#0077B5] flex items-center justify-center text-white">{LI_ICON}</div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">Publicar no LinkedIn</p>
                <p className="text-gray-500 text-xs">Conteúdo aprovado pelo Gerente</p>
              </div>
              <button onClick={() => setPublishModal(false)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-3 border-b border-border">
              <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{stripMarkdown(finalContent)}</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2">
              <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${selectedDests.includes('feed') ? 'bg-[#0077B5]/10 border-[#0077B5]/30' : 'bg-background border-border'}`}>
                <input type="checkbox" checked={selectedDests.includes('feed')}
                  onChange={() => setSelectedDests(p => p.includes('feed') ? p.filter(d => d !== 'feed') : [...p, 'feed'])}
                  className="w-4 h-4 accent-[#0077B5]" />
                <span className="text-white text-sm font-medium">Meu feed</span>
              </label>
              {groups.map(g => {
                const dest = `group:${g.id}`
                return (
                  <label key={g.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${selectedDests.includes(dest) ? 'bg-[#0077B5]/10 border-[#0077B5]/30' : 'bg-background border-border'}`}>
                    <input type="checkbox" checked={selectedDests.includes(dest)}
                      onChange={() => setSelectedDests(p => p.includes(dest) ? p.filter(d => d !== dest) : [...p, dest])}
                      className="w-4 h-4 accent-[#0077B5]" />
                    <span className="text-white text-sm font-medium truncate">{g.name}</span>
                  </label>
                )
              })}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setPublishModal(false)} disabled={publishing}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-background border border-border disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={doPublish} disabled={publishing || selectedDests.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0077B5] hover:bg-[#006097] disabled:opacity-40 flex items-center justify-center gap-2">
                {publishing && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                {publishing ? 'Publicando...' : `Publicar (${selectedDests.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
