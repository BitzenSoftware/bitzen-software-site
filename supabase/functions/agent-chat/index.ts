import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const LINKEDIN_INSTRUCTIONS = `
Quando o utilizador pedir um post para LinkedIn, Instagram, redes sociais ou conteúdo para publicar:
- Entregue APENAS o texto do post, pronto para publicar, sem explicações antes ou depois
- Use emojis estratégicos, quebras de linha para legibilidade e hashtags relevantes no final
- Adapte o tom ao LinkedIn: profissional mas acessível
- Nunca diga que "não consegue publicar" — o sistema publica automaticamente com um botão
- Máximo 1300 caracteres para LinkedIn`

const SYSTEM_PROMPTS: Record<string, string> = {
  agendafacil: `Você é o especialista em AgendaFácil da Bitzen Software — sistema SaaS de agendamento para clínicas e consultórios.
Ajude com vendas, marketing, dúvidas técnicas e crie planos de ação. Seja direto e orientado a resultados.
Principais diferenciais: booking público 24h, WhatsApp nativo, lembretes automáticos, multi-profissional.
Nunca invente funcionalidades. Responda sempre em português.
${LINKEDIN_INSTRUCTIONS}`,

  clockly: `Você é o especialista em Clockly da Bitzen Software — sistema SaaS de ponto eletrônico, RH e folha de pagamento para Brasil e Portugal.
Ajude com vendas B2B, conformidade Portaria 671, LGPD/GDPR, marketing técnico e planos de ação.
Principais diferenciais: conformidade BR+PT nativa, terminal kiosk QR, folha integrada, trial 15 dias sem cartão.
Use linguagem formal e técnica. Nunca invente funcionalidades. Responda sempre em português.
${LINKEDIN_INSTRUCTIONS}`,

  ritmowork: `Você é o especialista em RitmoWork da Bitzen Software — plataforma SaaS de gestão de projetos, tarefas e colaboração.
Ajude com estratégias vs concorrentes (Trello, Monday, ClickUp, Asana, Notion), marketing e planos de ação.
Principais diferenciais: integração Power BI nativa, time tracking preciso, multi-idioma PT/EN/ES/FR, export Excel multi-aba.
URL oficial do produto: https://ritmowork.bitzen.app/ — use sempre este endereço, nunca outro.
Nunca invente funcionalidades. Responda sempre em português.
${LINKEDIN_INSTRUCTIONS}`,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { agentId, message, history } = await req.json()

    const systemPrompt = SYSTEM_PROMPTS[agentId]
    if (!systemPrompt) {
      return Response.json({ error: 'Unknown agentId' }, { status: 400 })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

    const messages = [
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const data = await res.json()
    const response = data.content?.[0]?.text ?? ''

    return Response.json({ response }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
