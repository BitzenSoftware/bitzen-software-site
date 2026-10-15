import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { date, hours, joinAddress, money, quoteCode, totals } from '../../lib/gestao/format'

// Sem hifenização automática: em português ela quebra palavras de forma estranha.
Font.registerHyphenationCallback((word) => [word])

const INK = '#0f172a'
const MUTED = '#64748b'
const LINE = '#e2e8f0'
const SOFT = '#f8fafc'

const s = StyleSheet.create({
  page: { paddingTop: 118, paddingBottom: 72, paddingHorizontal: 48, fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
  body: {},

  // Timbre (repete em todas as páginas)
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  header: { position: 'absolute', top: 34, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 0.75, borderBottomColor: LINE },
  logo: { maxHeight: 44, maxWidth: 170, objectFit: 'contain' },
  brandName: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  headerInfo: { alignItems: 'flex-end', fontSize: 7.5, color: MUTED, lineHeight: 1.45 },
  headerCompany: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 1 },

  footerLine: { position: 'absolute', bottom: 46, left: 48, right: 48, height: 0.75, backgroundColor: LINE },
  footerLeft: { position: 'absolute', bottom: 28, left: 48, width: 300, fontSize: 7, color: MUTED },
  footerRight: { position: 'absolute', bottom: 28, left: 48, right: 48, fontSize: 7, color: MUTED, textAlign: 'right' },

  // Título
  eyebrow: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 1.6, marginBottom: 6 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  title: { fontSize: 19, fontFamily: 'Helvetica-Bold', lineHeight: 1.25, maxWidth: 330 },
  meta: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 7, color: MUTED, letterSpacing: 0.8, marginBottom: 2 },
  metaValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 9 },

  // Cliente
  clientBox: { backgroundColor: SOFT, borderRadius: 4, padding: 14, marginBottom: 24, flexDirection: 'row' },
  clientCol: { flex: 1 },
  label: { fontSize: 7, color: MUTED, letterSpacing: 0.8, marginBottom: 5 },
  clientName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  small: { fontSize: 8.5, color: '#334155', lineHeight: 1.5 },

  // Seções
  section: { marginBottom: 22 },
  h2: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1.4, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 0.75, borderBottomColor: LINE },
  para: { fontSize: 9.5, marginBottom: 7, textAlign: 'justify', lineHeight: 1.5 },

  // Tabela
  th: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 0.8 },
  tr: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 8, borderBottomWidth: 0.75, borderBottomColor: LINE },
  cNum: { width: 22, color: MUTED },
  cDesc: { flex: 1, paddingRight: 10 },
  cHours: { width: 60, textAlign: 'right' },
  cAmount: { width: 92, textAlign: 'right' },
  itemTitle: { fontFamily: 'Helvetica-Bold' },
  itemDesc: { fontSize: 8.5, color: MUTED, marginTop: 2, lineHeight: 1.45 },

  // Resumo
  summaryWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  summary: { width: 230 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 10 },
  sumTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, marginTop: 6, borderRadius: 3 },
  sumTotalLabel: { color: '#ffffff', fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  sumTotalValue: { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold' },

  // Aceite
  signRow: { flexDirection: 'row', gap: 40, marginTop: 46 },
  signCol: { flex: 1, borderTopWidth: 0.75, borderTopColor: '#94a3b8', paddingTop: 6, fontSize: 8, color: MUTED, textAlign: 'center' },
})

function paragraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export default function QuoteDocument({ profile, quote, items, client }) {
  const brand = /^#[0-9a-f]{6}$/i.test(profile.brand_color) ? profile.brand_color : INK
  const cur = profile.currency || 'BRL'
  const sum = totals(items, quote.discount)
  const code = quoteCode(quote.kind, quote.number, quote.issue_date)
  const kindLabel = quote.kind === 'proposta' ? 'PROPOSTA COMERCIAL' : 'ORÇAMENTO'
  const companyName = profile.company_name || profile.legal_name || 'Sua empresa'
  const addr = joinAddress(profile)
  const contactLine = [profile.phone, profile.email, profile.website].filter(Boolean).join('  ·  ')
  const footerLeft = [profile.legal_name || profile.company_name, profile.document && `CNPJ ${profile.document}`].filter(Boolean).join('  ·  ')
  const visibleItems = items.filter((i) => i.title || i.description || i.amount || i.hours)

  return (
    <Document title={`${code} ${quote.title}`.trim()} author={companyName} creator={companyName} producer={companyName}>
      <Page size="A4" style={s.page}>
        {/* ---------- Timbre ---------- */}
        <View style={[s.topBar, { backgroundColor: brand }]} fixed />
        <View style={s.header} fixed>
          {profile.logo_url ? <Image src={profile.logo_url} style={s.logo} /> : <Text style={[s.brandName, { color: brand }]}>{companyName}</Text>}
          <View style={s.headerInfo}>
            {profile.logo_url ? <Text style={s.headerCompany}>{companyName}</Text> : null}
            {!profile.logo_url && profile.legal_name && profile.legal_name !== companyName ? <Text>{profile.legal_name}</Text> : null}
            {profile.document ? <Text>CNPJ {profile.document}</Text> : null}
            {addr ? <Text>{addr}</Text> : null}
            {contactLine ? <Text>{contactLine}</Text> : null}
          </View>
        </View>
        <View style={s.footerLine} fixed />
        <Text style={s.footerLeft} fixed>{footerLeft}</Text>
        <Text style={s.footerRight} fixed render={({ pageNumber, totalPages }) => `${code}  ·  Página ${pageNumber} de ${totalPages}`} />

        <View style={s.body}>
        {/* ---------- Título ---------- */}
        <View style={s.titleRow}>
          <View>
            <Text style={[s.eyebrow, { color: brand }]}>{kindLabel}</Text>
            <Text style={s.title}>{quote.title || kindLabel.charAt(0) + kindLabel.slice(1).toLowerCase()}</Text>
          </View>
          <View style={s.meta}>
            <Text style={s.metaLabel}>NÚMERO</Text>
            <Text style={s.metaValue}>{code}</Text>
            <Text style={s.metaLabel}>EMISSÃO</Text>
            <Text style={s.metaValue}>{date(quote.issue_date)}</Text>
            {quote.valid_until ? (
              <>
                <Text style={s.metaLabel}>VÁLIDO ATÉ</Text>
                <Text style={s.metaValue}>{date(quote.valid_until)}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* ---------- Cliente ---------- */}
        {client ? (
          <View style={s.clientBox} wrap={false}>
            <View style={s.clientCol}>
              <Text style={s.label}>PREPARADO PARA</Text>
              <Text style={s.clientName}>{client.name}</Text>
              {client.trade_name ? <Text style={s.small}>{client.trade_name}</Text> : null}
              {client.document ? <Text style={s.small}>CNPJ/CPF {client.document}</Text> : null}
              {joinAddress(client) ? <Text style={s.small}>{joinAddress(client)}</Text> : null}
            </View>
            {client.contact_name || client.email || client.phone ? (
              <View style={[s.clientCol, { maxWidth: 190 }]}>
                <Text style={s.label}>CONTATO</Text>
                {client.contact_name ? <Text style={[s.small, { fontFamily: 'Helvetica-Bold', color: INK }]}>{client.contact_name}</Text> : null}
                {client.email ? <Text style={s.small}>{client.email}</Text> : null}
                {client.phone ? <Text style={s.small}>{client.phone}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ---------- Introdução ---------- */}
        {quote.introduction.trim() ? (
          <View style={s.section}>
            <Text style={[s.h2, { color: brand }]}>APRESENTAÇÃO</Text>
            {paragraphs(quote.introduction).map((p, i) => (
              <Text key={i} style={s.para}>{p}</Text>
            ))}
          </View>
        ) : null}

        {/* ---------- Escopo e investimento ---------- */}
        <View style={s.section}>
          <Text style={[s.h2, { color: brand }]} minPresenceAhead={60}>ESCOPO E INVESTIMENTO</Text>
          <View style={[s.th, { backgroundColor: brand }]} fixed={false}>
            <Text style={[s.cNum, { color: '#ffffff' }]}>#</Text>
            <Text style={s.cDesc}>SERVIÇO</Text>
            <Text style={s.cHours}>HORAS</Text>
            <Text style={s.cAmount}>VALOR</Text>
          </View>
          {visibleItems.map((it, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Text style={s.cNum}>{String(i + 1).padStart(2, '0')}</Text>
              <View style={s.cDesc}>
                <Text style={s.itemTitle}>{it.title || 'Serviço'}</Text>
                {it.description ? <Text style={s.itemDesc}>{it.description}</Text> : null}
              </View>
              <Text style={s.cHours}>{it.hours ? hours(it.hours) : '—'}</Text>
              <Text style={s.cAmount}>{money(it.amount, cur)}</Text>
            </View>
          ))}

          <View style={s.summaryWrap} wrap={false}>
            <View style={s.summary}>
              <View style={s.sumRow}>
                <Text style={{ color: MUTED }}>Total de horas</Text>
                <Text>{hours(sum.totalHours)}</Text>
              </View>
              <View style={s.sumRow}>
                <Text style={{ color: MUTED }}>Subtotal</Text>
                <Text>{money(sum.subtotal, cur)}</Text>
              </View>
              {quote.discount > 0 ? (
                <View style={s.sumRow}>
                  <Text style={{ color: MUTED }}>Desconto</Text>
                  <Text>- {money(quote.discount, cur)}</Text>
                </View>
              ) : null}
              <View style={[s.sumTotal, { backgroundColor: brand }]}>
                <Text style={s.sumTotalLabel}>INVESTIMENTO TOTAL</Text>
                <Text style={s.sumTotalValue}>{money(sum.total, cur)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ---------- Condições ---------- */}
        {quote.terms.trim() ? (
          <View style={s.section} wrap={false}>
            <Text style={[s.h2, { color: brand }]}>CONDIÇÕES COMERCIAIS</Text>
            {paragraphs(quote.terms).map((p, i) => (
              <Text key={i} style={s.para}>{p}</Text>
            ))}
          </View>
        ) : null}

        {profile.bank_info.trim() ? (
          <View style={s.section} wrap={false}>
            <Text style={[s.h2, { color: brand }]}>DADOS PARA PAGAMENTO</Text>
            <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{profile.bank_info.trim()}</Text>
          </View>
        ) : null}

        {/* ---------- Aceite ---------- */}
        <View wrap={false}>
          <View style={s.signRow}>
            <Text style={s.signCol}>{companyName}</Text>
            <Text style={s.signCol}>{client ? `De acordo: ${client.name}` : 'De acordo (cliente)'}</Text>
          </View>
          <Text style={{ fontSize: 7.5, color: MUTED, textAlign: 'center', marginTop: 14 }}>
            {[profile.city, date(quote.issue_date)].filter(Boolean).join(', ')}
          </Text>
        </View>
        </View>
      </Page>
    </Document>
  )
}
