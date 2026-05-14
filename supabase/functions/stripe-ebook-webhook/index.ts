import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// ── Verificação da assinatura Stripe ────────────────────────────────────────

async function verifyStripeSignature(
  body: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) return false

  const payload = `${timestamp}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const expected = Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return expected === signature
}

// ── Email de entrega ─────────────────────────────────────────────────────────

async function sendDeliveryEmail(
  toEmail: string,
  pdfUrl: string,
  resendKey: string,
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>O seu ebook chegou!</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1A3340;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
                    <rect width="64" height="64" rx="14" fill="#0F2027"/>
                    <path d="M14 32 C14 20, 21 13, 32 12 C32 12, 25 17, 25 32 C25 47, 32 52, 32 52 C21 51, 14 44, 14 32Z" fill="#7C9E8E"/>
                    <path d="M50 32 C50 20, 43 13, 32 12 C32 12, 39 17, 39 32 C39 47, 32 52, 32 52 C43 51, 50 44, 50 32Z" fill="#F5F0E8"/>
                    <ellipse cx="32" cy="32" rx="6" ry="6" fill="#C4956A"/>
                  </svg>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7C9E8E;">Vínculo · Bitzen Software</p>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1A3340;letter-spacing:-0.5px;">
              O seu ebook chegou! 🎉
            </h1>
            <p style="margin:0 0 24px;font-size:16px;color:#9CA3AF;font-weight:300;">
              Obrigado pela sua compra. O seu PDF está pronto para download.
            </p>

            <div style="background:#F7F2EB;border-radius:12px;padding:24px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4a7060;">Ebook adquirido</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#1A3340;font-family:Georgia,serif;">
                Prontuário TCC na Prática
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#9CA3AF;">9 capítulos · +40 páginas · Templates prontos</p>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${pdfUrl}"
                    style="display:inline-block;background:#7C9E8E;color:#ffffff;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;">
                    ⬇ Baixar o PDF agora
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;text-align:center;">
              Ou copie o link abaixo:
            </p>
            <div style="background:#F5F0E8;border:1px solid #E8E3DB;border-radius:8px;padding:12px 16px;word-break:break-all;font-size:12px;color:#4B5563;margin-bottom:28px;">
              ${pdfUrl}
            </div>

            <div style="border-top:1px solid #E8E3DB;padding-top:24px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1A3340;">Próximo passo</p>
              <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">
                Quer usar o prontuário TCC estruturado diretamente no sistema — sem papel, sem planilha, com LGPD e CFP já integrados?
              </p>
              <a href="https://vinculo.bitzen.app/"
                style="display:inline-block;background:#1A3340;color:#F5F0E8;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">
                Testar o Vínculo grátis por 14 dias →
              </a>
            </div>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="background:#F5F0E8;border-top:1px solid #E8E3DB;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;">
              Vínculo · Bitzen Software · <a href="https://vinculo.bitzen.app/" style="color:#7C9E8E;text-decoration:none;">vinculo.bitzen.app</a><br>
              Este email foi enviado porque você adquiriu o ebook <em>Prontuário TCC na Prática</em>.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Vínculo · Bitzen Software <ebook@vinculo.bitzen.app>',
      to: [toEmail],
      subject: '📥 O seu ebook chegou! Prontuário TCC na Prática',
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
      },
    })
  }

  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const resendKey     = Deno.env.get('RESEND_API_KEY')
    const pdfUrl        = Deno.env.get('EBOOK_PDF_URL')

    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET não configurado')
    if (!resendKey)     throw new Error('RESEND_API_KEY não configurado')
    if (!pdfUrl)        throw new Error('EBOOK_PDF_URL não configurado')

    const signature = req.headers.get('stripe-signature')
    if (!signature) return new Response('Signature ausente', { status: 400 })

    const rawBody = await req.text()

    const valid = await verifyStripeSignature(rawBody, signature, webhookSecret)
    if (!valid) return new Response('Assinatura inválida', { status: 401 })

    const event = JSON.parse(rawBody)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const email = session.customer_details?.email || session.customer_email

      if (email) {
        await sendDeliveryEmail(email, pdfUrl, resendKey)
        console.log(`Email enviado para: ${email}`)
      } else {
        console.warn('Email do cliente não encontrado na sessão')
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('Webhook error:', e)
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
