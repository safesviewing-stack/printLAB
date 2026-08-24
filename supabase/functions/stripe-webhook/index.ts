import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.16.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const userId = session.client_reference_id
      const stripeSessionId = session.id
      const planName = session.metadata.plan_name
      const creditsAcquired = parseInt(session.metadata.credits_acquired, 10)

      // Crear cliente Supabase usando la Service Role Key para ignorar RLS temporalmente y realizar la actualización segura de créditos
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // 1. Guardar compra completada en el historial
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          stripe_session_id: stripeSessionId,
          plan_name: planName,
          credits_acquired: creditsAcquired,
          status: 'completado'
        })

      if (purchaseError) throw purchaseError

      // 2. Obtener créditos actuales e incrementarlos
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      const newCredits = (profile?.credits || 0) + creditsAcquired

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newCredits, plan: planName })
        .eq('id', userId)

      if (updateError) throw updateError
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
