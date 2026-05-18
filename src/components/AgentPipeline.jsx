import { useState } from 'react'
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
      {/* LinkedIn top bar mock */}
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
          {/* Post card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Author */}
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
              <button className="text-[#0077B5] text-xs font-semibold border border-[#0077B5] rounded-full px-3 py-1 hover:bg-[#0077B5]/5 flex-shrink-0">
                + Seguir
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3 min-h-[120px]">
              {isLoading && !clean ? (
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-3/5" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ) : clean ? (
                <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{clean}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">O conteúdo aparecerá aqui após o Copywriter gerar o post...</p>
              )}
            </div>

            {/* Reactions bar */}
            <div className="px-4 py-1 border-t border-gray-100 flex items-center justify-between text-gray-500 text-xs">
              <span className="flex items-center gap-1">
                <span>👍</span><span>❤️</span><span>💡</span>
                <span className="ml-1">24 reações</span>
              </span>
              <span>3 comentários</span>
            </div>

            {/* Action buttons */}
            <div className="px-2 py-1 border-t border-gray-100 flex items-center">
              {[
                { icon: '👍', label: 'Gosto' },
                { icon: '💬', label: 'Comentar' },
                { icon: '🔁', label: 'Partilhar' },
                { icon: '✉️', label: 'Enviar' },
              ].map(btn => (
                <button key={btn.label} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-gray-500 font-medium hover:bg-gray-100 transition-colors">
                  <span>{btn.icon}</span>
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Character count */}
          {clean && (
            <p className="text-center text-xs text-gray-400 mt-3">
              {clean.length} caracteres · {clean.length > 1300 ? <span className="text-red-500 font-medium">excede o limite do LinkedIn (1300)</span> : <span className="text-green-600">dentro do limite</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgentPipeline({ onClose }) {
  const [task, setTask] = useState('')
  const [product, setProduct] = useState(null)
  const [stage, setStage] = useState('input')
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

  async function callAgent(role, userMsg) {
    const { data, error } = await supabase.functions.invoke('agent-chat', {
      body: { role, product, messages: [{ role: 'user', content: userMsg }] },
    })
    if (error) throw error
    return data?.content ?? 'Sem resposta'
  }

  async function runPipeline() {
    if (!task.trim() || !product) return
    setStage('running')
    setResults({})
    setPreviewContent('')
    setFinalContent('')
    setApproved(false)
    setIteration(0)
    setSavedToRitmo(false)
    setPublished(false)

    // Fase 1 — Pesquisador (uma vez)
    setCurrentAgent('pesquisador')
    let research = ''
    try {
      research = await callAgent('pesquisador', task)
      setResults(prev => ({ ...prev, pesquisador: research }))
    } catch (e) {
      research = `Erro: ${e.message}`
      setResults(prev => ({ ...prev, pesquisador: research }))
    }

    // Fase 2 — Loop Copywriter → Revisor → Gerente
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
          ? `Pesquisa realizada:\n\n${research}\n\nCom base nesta pesquisa, cria conteúdo para: ${task}`
          : `Conteúdo anterior:\n\n${revisedContent}\n\nFeedback do Gerente (tentativa ${iter - 1}):\n\n${gerenteFeedback}\n\nRevê e melhora o conteúdo corrigindo exactamente o que o Gerente apontou.`
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

  return (
    <>
      <div className="fixed inset-0 z-[70] flex flex-col bg-background">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
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
              {/* Left: form */}
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
                  onClick={runPipeline}
                  disabled={!task.trim() || !product}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Iniciar Pipeline
                </button>
              </div>

              {/* Right: empty preview */}
              <LinkedInPreview content="" isLoading={false} approved={false} />
            </>
          )}

          {/* ── Running / Done stage ── */}
          {(stage === 'running' || stage === 'done') && (
            <>
              {/* Left: pipeline steps */}
              <div className="w-full md:w-[400px] lg:w-[440px] flex-shrink-0 overflow-y-auto p-4 flex flex-col gap-3 border-r border-border">

                {/* Stage cards */}
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

                {/* Final decision */}
                {stage === 'done' && (
                  <div className={`rounded-xl border p-4 ${approved ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                    <p className={`text-sm font-semibold mb-3 ${approved ? 'text-green-400' : 'text-yellow-400'}`}>
                      {approved ? '✅ Aprovado — pronto para publicar' : '⚠️ Devolvido para revisão'}
                    </p>
                    {approved ? (
                      <div className="flex flex-wrap gap-2">
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
                        <button onClick={() => { setStage('input'); setResults({}); setTask(''); setProduct(null); setPreviewContent('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 border border-border hover:text-white transition-colors">
                          Nova tarefa
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setStage('input'); setResults({}) }}
                        className="text-xs text-accent-purple hover:underline">
                        Ajustar tarefa e tentar novamente →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: LinkedIn preview */}
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
