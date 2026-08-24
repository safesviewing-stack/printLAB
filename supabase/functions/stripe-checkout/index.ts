import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@11.16.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planId, userId, successUrl, cancelUrl } = await req.json()

    let priceInCents = 0
    let planName = ''
    let credits = 0

    if (planId === 'single') {
      priceInCents = 250 // 2.50€
      planName = 'Análisis Único'
      credits = 1
    } else if (planId === 'pro') {
      priceInCents = 1800 // 18.00€
      planName = 'Pack Profesional'
      credits = 10
    } else if (planId === 'industrial') {
      priceInCents = 6500 // 65.00€
      planName = 'Pack Industrial'
      credits = 50
    } else {
      throw new Error('Plan inválido')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${planName} (${credits} Créditos)`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: userId,
      metadata: {
        plan_name: planName,
        credits_acquired: credits.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
