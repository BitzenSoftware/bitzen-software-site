import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { loadQuote, saveQuote, KIND_LABEL, STATUS_LABEL } from '../../lib/gestao/data'
import { addDays, date, hours as fmtHours, joinAddress, money, quoteCode, today, totals } from '../../lib/gestao/format'
import { Button, Card, Field, Input, Select, Spinner, Textarea } from './ui'

const blankItem = (position) => ({ position, title: '', description: '', hours: 0, amount: 0 })

export default function QuoteEditorView({ id, companyProfile, onBack, onSaved, onOpenDocument }) {
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(null)
  const [items, setItems] = useState([])
  const [number, setNumber] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  useEffect(() => {
    setMsg(null)
    if (id) {
      loadQuote(id)
        .then(({ quote, items }) => {
          const { id: _i, number, created_at: _c, updated_at: _u, ...f } = quote
          setForm(f)
          setNumber(number)
          setItems(items.length ? items : [blankItem(0)])
          setDirty(false)
        })
        .catch((e) => setMsg({ ok: false, text: e.message }))
    } else if (companyProfile) {
      const issue = today()
      setForm({
        kind: 'orcamento',
        status: 'rascunho',
        client_id: null,
        title: '',
        introduction: '',
        terms: companyProfile.default_terms,
        discount: 0,
        issue_date: issue,
        valid_until: addDays(issue, companyProfile.default_validity_days || 15),
      })
      setNumber(null)
      setItems([blankItem(0)])
      setDirty(false)
    }
  }, [id, !!companyProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  const client = useMemo(() => clients.find((c) => c.id === form?.client_id) ?? null, [clients, form?.client_id])
  const sum = useMemo(() => totals(items, form?.discount), [items, form?.discount])
  // A moeda do documento segue a do cliente selecionado — cada cliente pode
  // ser orçado numa moeda diferente (BRL/EUR/USD).
  const currency = client?.currency || companyProfile?.currency || 'BRL'
  const hourlyRate = Number(client?.hourly_rate) || 0

  if (!form) return msg ? <p className="text-red-400 text-sm">{msg.text}</p> : <Spinner />

  const setF = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true) }
  const setItem = (idx, patch) => { setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it))); setDirty(true) }

  // Preenche o valor do tópico com horas × valor/hora do cliente. O campo
  // continua editável para quem quiser ajustar manualmente depois.
  const setItemHours = (idx, hoursValue) => {
    setItem(idx, hourlyRate ? { hours: hoursValue, amount: Math.round(hoursValue * hourlyRate * 100) / 100 } : { hours: hoursValue })
  }

  const move = (idx, dir) => {
    setItems((list) => {
      const j = idx + dir
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
    setDirty(true)
  }

  const removeItem = (idx) => {
    setItems((list) => (list.length === 1 ? [blankItem(0)] : list.filter((_, i) => i !== idx)))
    setDirty(true)
  }

  async function save(openDocument = false) {
    setSaving(true)
    setMsg(null)
    try {
      const newId = await saveQuote(id, form, items)
      setDirty(false)
      if (openDocument) onOpenDocument(newId)
      else onSaved(newId)
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const code = number ? quoteCode(form.kind, number, form.issue_date) : 'Novo documento'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-gray-400 text-sm hover:text-white">← Orçamentos</button>
          <h2 className="mt-2 text-white text-2xl font-semibold tracking-tight">{code}</h2>
          <p className="mt-1 text-gray-500 text-sm">{KIND_LABEL[form.kind]}{dirty && ' · alterações não salvas'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save(true)} disabled={saving}>Salvar e ver documento</Button>
          <Button onClick={() => save(false)} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
        </div>
      </div>

      {msg && (
        <p className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
          {msg.text}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {/* Cabeçalho */}
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo de documento">
                <Select value={form.kind} onChange={(e) => setF('kind', e.target.value)}>
                  <option value="orcamento">Orçamento</option>
                  <option value="proposta">Proposta comercial</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setF('status', e.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Título do documento" className="sm:col-span-2">
                <Input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="Ex.: Desenvolvimento do aplicativo de agendamentos" />
              </Field>
              <Field label="Data de emissão">
                <Input type="date" value={form.issue_date} onChange={(e) => setF('issue_date', e.target.value)} />
              </Field>
              <Field label="Válido até">
                <Input type="date" value={form.valid_until ?? ''} onChange={(e) => setF('valid_until', e.target.value || null)} />
              </Field>
            </div>
          </Card>

          {/* Cliente */}
          <Card className="p-5">
            <h3 className="text-white text-sm font-semibold mb-3">Cliente</h3>
            <Select value={form.client_id ?? ''} onChange={(e) => setF('client_id', e.target.value || null)}>
              <option value="">Selecione a empresa…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.trade_name ? ` (${c.trade_name})` : ''}</option>
              ))}
            </Select>
            {clients.length === 0 && (
              <p className="mt-2 text-gray-500 text-sm">Nenhum cliente cadastrado. Cadastre na aba Clientes.</p>
            )}
            {client && (
              <dl className="mt-4 grid gap-x-6 gap-y-3 rounded-xl bg-background p-4 text-sm sm:grid-cols-2">
                <Info label="Razão social" value={client.name} />
                <Info label="CNPJ / CPF" value={client.document} />
                <Info label="Contato" value={client.contact_name} />
                <Info label="E-mail" value={client.email} />
                <Info label="Telefone" value={client.phone} />
                <Info label="Endereço" value={joinAddress(client)} />
                <Info label="Moeda do orçamento" value={client.currency} />
                <Info label="Valor por hora" value={client.hourly_rate ? `${money(client.hourly_rate, client.currency)}/h` : '—'} />
              </dl>
            )}
          </Card>

          {/* Introdução */}
          <Card className="p-5">
            <h3 className="text-white text-sm font-semibold mb-1">Introdução</h3>
            <p className="mb-3 text-gray-500 text-sm">Apresente o contexto e os serviços. Deixe uma linha em branco para separar parágrafos.</p>
            <Textarea
              rows={6}
              value={form.introduction}
              onChange={(e) => setF('introduction', e.target.value)}
              placeholder="Prezados, conforme conversado, apresentamos a seguir o escopo e o investimento para…"
            />
          </Card>

          {/* Tópicos */}
          <Card className="p-5">
            <h3 className="text-white text-sm font-semibold mb-1">Tópicos do serviço</h3>
            <p className="mb-4 text-gray-500 text-sm">Cada tópico tem descrição, horas estimadas e valor.</p>

            <div className="flex flex-col gap-3">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Tópico {idx + 1}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</Button>
                      <Button size="sm" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>↓</Button>
                      <Button size="sm" variant="danger" onClick={() => removeItem(idx)}>Remover</Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_110px_150px]">
                    <Field label="Serviço">
                      <Input value={it.title} onChange={(e) => setItem(idx, { title: e.target.value })} placeholder="Ex.: Desenvolvimento do app" />
                    </Field>
                    <Field label="Horas">
                      <Input type="number" min={0} step="0.5" value={it.hours || ''} onChange={(e) => setItemHours(idx, Number(e.target.value))} className="text-right tabular-nums" />
                    </Field>
                    <Field label="Valor" hint={hourlyRate ? `Auto: ${money(hourlyRate, currency)}/h` : undefined}>
                      <Input type="number" min={0} step="0.01" value={it.amount || ''} onChange={(e) => setItem(idx, { amount: Number(e.target.value) })} className="text-right tabular-nums" />
                    </Field>
                    <Field label="Descrição (opcional)" className="sm:col-span-3">
                      <Textarea rows={2} value={it.description} onChange={(e) => setItem(idx, { description: e.target.value })} placeholder="O que está incluído neste tópico" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button variant="secondary" onClick={() => { setItems((l) => [...l, blankItem(l.length)]); setDirty(true) }}>+ Adicionar tópico</Button>
            </div>
          </Card>

          {/* Condições */}
          <Card className="p-5">
            <h3 className="text-white text-sm font-semibold mb-1">Condições comerciais</h3>
            <p className="mb-3 text-gray-500 text-sm">Forma de pagamento, prazos e observações.</p>
            <Textarea rows={5} value={form.terms} onChange={(e) => setF('terms', e.target.value)} />
          </Card>
        </div>

        {/* Resumo */}
        <aside>
          <Card className="sticky top-6 p-5">
            <h3 className="text-white text-sm font-semibold mb-4">Resumo</h3>
            <div className="flex flex-col gap-2.5 text-sm">
              <Row label="Tópicos" value={String(items.filter((i) => i.title || i.amount).length)} />
              <Row label="Total de horas" value={fmtHours(sum.totalHours)} />
              <Row label="Subtotal" value={money(sum.subtotal, currency)} />
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Desconto</span>
                <Input type="number" min={0} step="0.01" value={form.discount || ''} onChange={(e) => setF('discount', Number(e.target.value))} className="h-8 w-32 text-right tabular-nums" />
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-5">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total</p>
              <p className="mt-1 text-white text-3xl font-semibold tabular-nums">{money(sum.total, currency)}</p>
              {sum.totalHours > 0 && (
                <p className="mt-1 text-gray-500 text-xs">Média de {money(sum.total / sum.totalHours, currency)} por hora</p>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-1 text-gray-500 text-xs">
              <p>Emissão {date(form.issue_date)}</p>
              <p>Validade {date(form.valid_until)}</p>
            </div>
            <Button className="mt-6 w-full" onClick={() => save(true)} disabled={saving}>Gerar documento</Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-gray-500 text-xs">{label}</dt>
      <dd className="text-gray-200">{value || '—'}</dd>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium tabular-nums text-white">{value}</span>
    </div>
  )
}
