import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Gradients are cosmetic and not worth a column; known agents keep the colour
// they have always had, and anything new cycles through the rest.
const KNOWN = {
  agendafacil: 'from-blue-500 to-cyan-400',
  clockly: 'from-indigo-500 to-purple-600',
  ritmowork: 'from-violet-500 to-purple-500',
  vinculo: 'from-teal-500 to-emerald-400',
  teamagents: 'from-sky-500 to-blue-500',
  pesquisador: 'from-amber-500 to-orange-500',
  copywriter: 'from-pink-500 to-rose-500',
  revisor: 'from-green-500 to-teal-500',
  gerente: 'from-red-500 to-orange-600',
}
const FALLBACK = [
  'from-fuchsia-500 to-pink-500',
  'from-emerald-500 to-lime-500',
  'from-orange-500 to-amber-500',
  'from-cyan-500 to-sky-500',
  'from-rose-500 to-red-500',
]

// The agent list used to be hardcoded in four places, so an app added in the
// panel got an agent that never appeared in any of them. Read it from the
// source of truth instead.
export function useAgents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('agents')
      .select('agent_id,name,description,kind,sort_order,app_id')
      .eq('active', true)
      .order('kind', { ascending: false }) // produto before funcional
      .order('sort_order')
      .order('name')
      .then(({ data }) => {
        if (cancelled) return
        let n = 0
        setAgents(
          (data || []).map((a) => ({
            id: a.agent_id,
            name: a.name,
            desc: a.description || '',
            group: a.kind,
            appId: a.app_id || null,
            color: KNOWN[a.agent_id] || FALLBACK[n++ % FALLBACK.length],
          }))
        )
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { agents, loading }
}

// Product agents only — the "which product should I focus on" pickers.
export function useProductAgents() {
  const { agents, loading } = useAgents()
  return { systems: agents.filter((a) => a.group === 'produto'), loading }
}
