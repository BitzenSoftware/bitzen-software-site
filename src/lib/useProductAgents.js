import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Gradients are cosmetic and not worth a column; known agents keep the colour
// they have always had, and anything new cycles through the rest.
const KNOWN = {
  agendafacil: 'from-blue-500 to-cyan-400',
  clockly: 'from-indigo-500 to-purple-600',
  ritmowork: 'from-violet-500 to-purple-500',
  vinculo: 'from-teal-500 to-emerald-400',
}
const FALLBACK = [
  'from-sky-500 to-blue-500',
  'from-fuchsia-500 to-pink-500',
  'from-emerald-500 to-lime-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-red-500',
]

// The product list used to be hardcoded in two components, so an app added in
// the panel got an agent but never showed up here. Read it from the source of
// truth instead.
export function useProductAgents() {
  const [systems, setSystems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('agents')
      .select('agent_id,name,sort_order')
      .eq('kind', 'produto')
      .eq('active', true)
      .order('sort_order')
      .order('name')
      .then(({ data }) => {
        if (cancelled) return
        let n = 0
        setSystems(
          (data || []).map((a) => ({
            id: a.agent_id,
            name: a.name,
            color: KNOWN[a.agent_id] || FALLBACK[n++ % FALLBACK.length],
          }))
        )
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { systems, loading }
}
