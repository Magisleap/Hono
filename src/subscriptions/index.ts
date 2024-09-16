import { HTTPMethod } from '@/enums/method'
import { basicAuth } from '@/middlewares/basic_auth.middleware'
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
    description: '価格詳細を取得します',
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
    const stripe: Stripe = new Stripe(c.env.STRIPE_API_KEY_SECRET, {
      apiVersion: '2024-06-20'
    })
    if (api_key !== c.env.API_KEY) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }
    const subscriptions = await stripe.subscriptions.list()
    return c.json(subscriptions)
  }
)
