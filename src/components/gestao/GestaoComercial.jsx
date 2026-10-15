import { useState } from 'react'
import { useCompanyProfile } from '../../lib/gestao/data'
import ClientsView from './ClientsView'
import ProfileView from './ProfileView'
import QuotesListView from './QuotesListView'
import QuoteEditorView from './QuoteEditorView'
import QuotePreviewView from './QuotePreviewView'
import { Tabs } from './ui'

const TABS = [
  { id: 'orcamentos', label: 'Orçamentos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'perfil', label: 'Perfil da empresa' },
]

export default function GestaoComercial() {
  const { profile: companyProfile } = useCompanyProfile()
  const [tab, setTab] = useState('orcamentos')
  // drill-down dentro da aba Orçamentos: lista -> editor -> documento
  const [quoteView, setQuoteView] = useState({ mode: 'list', id: null })

  if (quoteView.mode === 'editor') {
    return (
      <QuoteEditorView
        id={quoteView.id}
        companyProfile={companyProfile}
        onBack={() => setQuoteView({ mode: 'list', id: null })}
        onSaved={() => setQuoteView({ mode: 'list', id: null })}
        onOpenDocument={(id) => setQuoteView({ mode: 'preview', id })}
      />
    )
  }

  if (quoteView.mode === 'preview') {
    return (
      <QuotePreviewView
        id={quoteView.id}
        companyProfile={companyProfile}
        onBack={() => setQuoteView({ mode: 'list', id: null })}
        onEdit={() => setQuoteView({ mode: 'editor', id: quoteView.id })}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Tabs items={TABS} value={tab} onChange={setTab} />

      {tab === 'orcamentos' && (
        <QuotesListView
          currency={companyProfile?.currency ?? 'BRL'}
          onOpenEditor={(id) => setQuoteView({ mode: 'editor', id })}
          onOpenDocument={(id) => setQuoteView({ mode: 'preview', id })}
        />
      )}
      {tab === 'clientes' && <ClientsView />}
      {tab === 'perfil' && <ProfileView />}
    </div>
  )
}
