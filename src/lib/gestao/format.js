export function money(value, currency = 'BRL') {
  const locale = currency === 'EUR' ? 'pt-PT' : currency === 'USD' ? 'en-US' : 'pt-BR'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value || 0)
}

export function hours(value) {
  const n = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value || 0)
  return `${n} h`
}

export function date(value) {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function quoteCode(kind, number, issueDate) {
  const prefix = kind === 'proposta' ? 'PC' : 'ORC'
  return `${prefix}-${issueDate.slice(0, 4)}-${String(number).padStart(4, '0')}`
}

export function totals(items, discount = 0) {
  const totalHours = items.reduce((s, i) => s + (Number(i.hours) || 0), 0)
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const total = Math.max(0, subtotal - (Number(discount) || 0))
  return { totalHours, subtotal, total }
}

export function addDays(iso, days) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function today() {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

export function joinAddress(p) {
  const cityState = [p.city, p.state].filter(Boolean).join(' / ')
  return [p.address, cityState, p.zip].filter(Boolean).join(' · ')
}
