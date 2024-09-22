import { HTTPMethod } from '@/enums/method'
import { Payment } from '@/enums/payment'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import dayjs from 'dayjs'
import Stripe from 'stripe'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/{price_id}',
    tags: ['決済'],
    summary: '詳細取得',
    description: '決済用のURLを取得します',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              client_reference_id: z.string().openapi({
                default: '383683302801932289',
                example: '383683302801932289',
                description: 'クライアントID'
              }),
              price_id: z.string().openapi({
                default: 'price_1PzOLFFHNegLdPHwOa5QLDJP',
                example: 'price_1PzOLFFHNegLdPHwOa5QLDJP',
                description: '価格ID'
              }),
              mode: z.nativeEnum(Payment).openapi({
                default: Payment.SUBSCRIPTION,
                example: Payment.SUBSCRIPTION,
                description: '購入モード'
              }),
              quantity: z.number().openapi({
                default: 1,
                example: 1,
                description: '数量'
              }),
              return_url: z.string().url().openapi({
                default: 'https://example.com/return',
                example: 'https://example.com/return',
                description: 'リダイレクトURL'
              }),
              success_url: z.string().url().openapi({
                default: 'https://example.com/success',
                example: 'https://example.com/success',
                description: '成功時のリダイレクトURL'
              }),
              cancel_url: z.string().url().openapi({
                default: 'https://example.com/cancel',
                example: 'https://example.com/cancel',
                description: 'キャンセル時のリダイレクトURL'
              })
            })
          }
        }
      }
    },
    responses: {
      200: {
        type: 'application/json',
        description: '商品データ'
      },
      ...BadRequestResponse({
        message: '不正なリクエストです'
      })
    }
  }),
  async (c) => {
    const parameters = c.req.valid('json')
    const stripe: Stripe = new Stripe(c.env.STRIPE_API_KEY_SECRET, {
      apiVersion: '2024-06-20'
    })
    const checkout = await stripe.checkout.sessions.create({
      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: true
        }
      },
      success_url: parameters.success_url,
      cancel_url: parameters.cancel_url,
      client_reference_id: parameters.client_reference_id,
      expires_at: dayjs().tz().add(30, 'minute').unix(),
      line_items: [
        {
          price: parameters.price_id,
          quantity: parameters.quantity
        }
      ],
      locale: 'ja',
      metadata: {},
      mode: parameters.mode
    })
    return c.json(checkout)
  }
)
