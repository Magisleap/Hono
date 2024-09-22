import { Buffer } from 'node:buffer'
import { HTTPMethod } from '@/enums/method'
import { Webhook } from '@/models/webhook'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { merge } from 'lodash'
import Stripe from 'stripe'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/',
    tags: ['Webhook'],
    summary: '処理',
    description: 'StripeのWebhookを受け取って処理します',
    request: {
      headers: z.object({
        'stripe-signature': z.string()
      })
    },
    responses: {
      200: {
        type: 'application/json',
        description: '処理結果'
      },
      ...BadRequestResponse({
        message: 'リクエストが不正です'
      })
    }
  }),
  async (c) => {
    const { 'stripe-signature': signature } = c.req.valid('header')
    const buffer: Buffer = Buffer.from(await c.req.arrayBuffer())
    const stripe: Stripe = new Stripe(c.env.STRIPE_API_KEY_SECRET, {
      typescript: true,
      apiVersion: '2024-06-20'
    })
    const event: Stripe.Event = await stripe.webhooks.constructEventAsync(
      buffer,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    )
    await handle_webhook(c, event)
    return c.json({})
  }
)

const handle_webhook = async (c: Context<{ Bindings: Bindings }>, event: Stripe.Event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handle_session(c, event)
      break
    case 'customer.subscription.created':
      break
    case 'customer.subscription.updated':
      break
    case 'invoice.payment_succeeded':
      await handle_invoice_payment(c, event)
      break
    default:
      break
  }
}

const handle_session = async (c: Context<{ Bindings: Bindings }>, event: Stripe.Event) => {
  const session: Webhook.CheckoutSession = Webhook.CheckoutSession.parse(event)
  console.log('[CHECKOUT SESSION COMPLETED]', JSON.stringify(session, null, 2))
  if (session.client_reference_id === undefined) {
    throw new HTTPException(400, { message: 'Bad Request.' })
  }
  // 確実に書き込み完了するまで待つ
  await c.env.STRIPE_INVOICE_PAYMENT.put(session.customer, JSON.stringify(session))
}

const handle_invoice_payment = async (c: Context<{ Bindings: Bindings }>, event: Stripe.Event) => {
  const payment: Webhook.InvoicePayment = Webhook.InvoicePayment.parse(event)
  console.log('[INVOICE PAYMENT SUCCEEDED]', JSON.stringify(payment, null, 2))
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const customer: any | null = await c.env.STRIPE_INVOICE_PAYMENT.get(payment.customer, { type: 'json' })
  if (customer === null) {
    throw new HTTPException(404, { message: 'Not Found.' })
  }
  // 支払い情報をマージする
  // このカスみたいな方法を利用しないと正しくマージされない
  const merged = merge({}, customer, payment.toJSON())
  await c.env.STRIPE_INVOICE_PAYMENT.put(payment.customer, JSON.stringify(merged))
}
