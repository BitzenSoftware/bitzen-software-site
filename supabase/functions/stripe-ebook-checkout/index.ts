import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const priceId   = Deno.env.get('STRIPE_EBOOK_PRICE_ID')

    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurado')
    if (!priceId)   throw new Error('STRIPE_EBOOK_PRICE_ID não configurado')

    const { success_url, cancel_url } = await req.json()

    const params = new URLSearchParams({
      'mode': 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': success_url || 'https://bitzen.bitzen.app/ebook-tcc-sucesso.html',
      'cancel_url':  cancel_url  || 'https://bitzen.bitzen.app/ebook-tcc-vendas.html',
      'payment_method_types[0]': 'card',
      'locale': 'pt-BR',
      'customer_creation': 'always',
    })

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err?.error?.message || 'Erro ao criar sessão Stripe')
    }

    const session = await res.json()

    return Response.json({ url: session.url }, { headers: CORS })

  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500, headers: CORS }
    )
  }
})
