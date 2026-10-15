import { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import QuoteDocument from './QuoteDocument'
import { loadQuote } from '../../lib/gestao/data'
import { quoteCode } from '../../lib/gestao/format'
import { Button, Spinner } from './ui'

function slug(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export default function QuotePreviewView({ id, companyProfile, onBack, onEdit }) {
  const [url, setUrl] = useState(null)
  const [fileName, setFileName] = useState('documento.pdf')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id || !companyProfile) return
    let objectUrl = null
    let cancelled = false
    ;(async () => {
      try {
        const data = await loadQuote(id)
        const blob = await pdf(<QuoteDocument profile={companyProfile} {...data} />).toBlob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        const code = quoteCode(data.quote.kind, data.quote.number, data.quote.issue_date)
        const who = data.client?.trade_name || data.client?.name || ''
        setFileName(`${[code, slug(who)].filter(Boolean).join('_')}.pdf`)
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, companyProfile])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-gray-400 text-sm hover:text-white">← Orçamentos</button>
          <h2 className="mt-2 text-white text-2xl font-semibold tracking-tight">Documento</h2>
          <p className="mt-1 text-gray-500 text-sm">{fileName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onEdit}>Editar</Button>
          {url ? (
            <a href={url} download={fileName} className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue px-4 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              Baixar PDF
            </a>
          ) : (
            <Button disabled>Gerando…</Button>
          )}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm">
          Não foi possível gerar o PDF: {error}
        </p>
      ) : url ? (
        <iframe src={url} title="Pré-visualização" className="h-[80vh] w-full rounded-2xl border border-border bg-white" />
      ) : (
        <Spinner />
      )}
    </div>
  )
}
