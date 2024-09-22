import { Buffer } from 'node:buffer'
import { HTTPMethod } from '@/enums/method'
import { Webhook } from '@/models/webhook'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import dayjs from 'dayjs'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { decode, sign, verify } from 'hono/jwt'
import { AlgorithmTypes } from 'hono/utils/jwt/jwa'
import type { JWTPayload } from 'hono/utils/jwt/types'
import { type extend, fromPairs, merge, omit, sortBy, toPairs } from 'lodash'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

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
      return handle_session(c, Webhook.CheckoutSession.parse(event))
    case 'customer.subscription.created':
      break
    case 'customer.subscription.updated':
      break
    case 'invoice.payment_succeeded':
      return await handle_invoice_payment(c, Webhook.InvoicePayment.parse(event))
    default:
      break
  }
}

const handle_session = async (c: Context<{ Bindings: Bindings }>, event: Webhook.CheckoutSession) => {
  console.log('[CHECKOUT SESSION COMPLETED]', JSON.stringify(event, null, 2))
  if (event.client_reference_id === undefined) {
    throw new HTTPException(400, { message: 'Bad Request.' })
  }
  // 確実に書き込み完了するまで待つ
  await c.env.STRIPE_INVOICE_PAYMENT.put(event.customer, JSON.stringify(event))
}

const handle_invoice_payment = async (c: Context<{ Bindings: Bindings }>, event: Webhook.InvoicePayment) => {
  console.log('[INVOICE PAYMENT SUCCEEDED]', JSON.stringify(event, null, 2))
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const customer: any | null = await c.env.STRIPE_INVOICE_PAYMENT.get(event.customer, { type: 'json' })
  if (customer === null) {
    throw new HTTPException(404, { message: 'Not Found.' })
  }
  // 支払い情報をマージする
  // このカスみたいな方法を利用しないと正しくマージされない
  const payload = merge({}, customer, event.toJSON())
  await c.env.STRIPE_INVOICE_PAYMENT.put(event.customer, JSON.stringify(payload))
  return handle_token(c, payload)
}

const handle_token = async <T extends Webhook.InvoicePayment>(c: Context<{ Bindings: Bindings }>, event: T) => {
  const payload: JWTPayload = fromPairs(
    sortBy(
      toPairs({
        ...omit(event, [
          'period',
          'subscription',
          'invoice',
          'product',
          'client_reference_id',
          'status',
          'payment_status',
          'customer'
        ]),
        iss: new URL(c.req.url).hostname,
        sub: event.customer,
        typ: 'access_token',
        nbf: dayjs(event.period.start).unix(),
        iat: dayjs().unix(),
        exp: dayjs(event.period.end).unix()
      })
    )
  )
  const access_token: string = await sign(payload, c.env.JWT_SECRET_KEY, AlgorithmTypes.HS256)
  console.log(access_token)
  return c.json({ access_token: access_token })
}
