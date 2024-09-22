import { HTTPMethod } from '@/enums/method'
import { Status } from '@/enums/status'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import Stripe from 'stripe'

export const app = new Hono<{ Bindings: Bindings }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'AuthorizationApiKey', {
  type: 'apiKey',
  name: 'X-API-KEY',
  in: 'header'
})
app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    security: [{ AuthorizationApiKey: [] }],
    path: '/',
    tags: ['購読'],
    summary: '一覧取得',
    description: '購読一覧を取得します',
    request: {
      headers: z.object({
        'x-api-key': z.string().optional().openapi({
          description: 'APIキー'
        })
      })
    },
    responses: {
      200: {
        type: 'application/json',
        description: '購読データ'
      },
      401: {
        description: '認証エラー'
      },
      403: {
        description: 'アクセス権限がありません'
      },
      ...BadRequestResponse({
        message: '不正なリクエストです'
      })
    }
  }),
  async (c) => {
    const { 'x-api-key': api_key } = c.req.valid('header')
    // 開発環境ではAPIキーをチェックしない
    if (
      api_key !== c.env.API_KEY &&
      new URL(c.req.url).hostname !== 'localhost' &&
      new URL(c.req.url).hostname !== '0.0.0.0'
    ) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }
    // const subscriptions = await stripe.subscriptions.list({
    //   limit: 10,
    //   status: status
    // })
    const keys: string[] = (await c.env.STRIPE_INVOICE_PAYMENT.list({ limit: 25 })).keys.map((key) => key.name)
    const payments = await Promise.all(keys.map((key) => c.env.STRIPE_INVOICE_PAYMENT.get(key, { type: 'json' })))
    return c.json(payments)
  }
)
