import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { duplicateQuote, KIND_LABEL, STATUS_LABEL } from '../../lib/gestao/data'
import { date, money, quoteCode, totals } from '../../lib/gestao/format'
import { Badge, Button, Card, Empty, Input, Select, Spinner } from './ui'

export default function QuotesListView({ currency, onOpenEditor, onOpenDocument }) {
  const [rows, setRows] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients(name), quote_items(hours, amount)')
      .order('number', { ascending: false })
    if (error) setError(error.message)
    setRows(data ?? [])
  }

  useEffect(() => { load() }, [])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (rows ?? [])
      .filter((r) => !status || r.status === status)
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          (r.clients?.name ?? '').toLowerCase().includes(q) ||
          quoteCode(r.kind, r.number, r.issue_date).toLowerCase().includes(q),
      )
      .map((r) => ({ ...r, sum: totals(r.quote_items.map((i, idx) => ({ ...i, position: idx, title: '', description: '' })), Number(r.discount)) }))
  }, [rows, search, status])

  const summary = useMemo(() => {
    const all = (rows ?? []).map((r) => ({ status: r.status, total: totals(r.quote_items.map((i, idx) => ({ ...i, position: idx, title: '', description: '' })), Number(r.discount)).total }))
    const sumBy = (s) => all.filter((a) => a.status === s).reduce((t, a) => t + a.total, 0)
    return { open: sumBy('enviado'), approved: sumBy('aprovado'), count: all.length }
  }, [rows])

  async function duplicate(id) {
    try {
      const newId = await duplicateQuote(id)
      onOpenEditor(newId)
    } catch (e) {
      setError(e.message)
    }
  }

  async function remove(r) {
    if (!window.confirm(`Excluir ${quoteCode(r.kind, r.number, r.issue_date)}? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('quotes').delete().eq('id', r.id)
    if (error) return setError(error.message)
    load()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">Crie, edite e baixe seus documentos comerciais.</p>
        <Button onClick={() => onOpenEditor(null)}>Novo orçamento</Button>
      </div>

      {error && <p className="rounded-xl bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Documentos</p>
          <p className="mt-2 text-white text-2xl font-semibold">{summary.count}</p>
        </Card>
        <Card className="p-5">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Em negociação</p>
          <p className="mt-2 text-white text-2xl font-semibold">{money(summary.open, currency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Aprovado</p>
          <p className="mt-2 text-green-400 text-2xl font-semibold">{money(summary.approved, currency)}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <Input placeholder="Buscar por número, título ou cliente" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>

        {rows === null ? (
          <Spinner />
        ) : list.length === 0 ? (
          <Empty
            title={rows.length ? 'Nenhum resultado' : 'Nenhum orçamento ainda'}
            text={rows.length ? 'Ajuste a busca ou o filtro.' : 'Crie o primeiro orçamento. Antes, vale preencher o perfil da empresa e cadastrar um cliente.'}
            action={!rows.length && <Button onClick={() => onOpenEditor(null)}>Criar orçamento</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente / título</th>
                  <th className="px-4 py-3 font-medium">Emissão</th>
                  <th className="px-4 py-3 text-right font-medium">Horas</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((r) => (
                  <tr key={r.id} className="hover:bg-background/60">
                    <td className="px-4 py-3">
                      <button onClick={() => onOpenEditor(r.id)} className="font-mono text-xs font-medium text-white hover:underline">
                        {quoteCode(r.kind, r.number, r.issue_date)}
                      </button>
                      <span className="block text-gray-500 text-xs">{KIND_LABEL[r.kind]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{r.clients?.name ?? 'Sem cliente'}</span>
                      {r.title && <span className="block text-gray-500 text-xs">{r.title}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{date(r.issue_date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">{r.sum.totalHours.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-white">{money(r.sum.total, currency)}</td>
                    <td className="px-4 py-3"><Badge status={r.status}>{STATUS_LABEL[r.status]}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => onOpenDocument(r.id)}>Documento</Button>
                      <Button size="sm" variant="ghost" onClick={() => onOpenEditor(r.id)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicate(r.id)}>Duplicar</Button>
                      <Button size="sm" variant="danger" onClick={() => remove(r)}>Excluir</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
