import { HTTPMethod } from '@/enums/method'
import { jwtAuth } from '@/middlewares/jwt_auth'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()
app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{discord_user_id}/subscriptions',
    tags: ['ユーザー'],
    summary: '購読',
    description: 'ユーザーが購読しているプラン一覧を返します',
    responses: {
      200: {
        type: 'application/json',
        description: '購読データ'
      },
      ...BadRequestResponse({
        message: '不正なリクエストです'
      })
    }
  }),
  async (c) => {
    const keys: string[] = (await c.env.STRIPE_INVOICE_PAYMENT.list({ limit: 25 })).keys.map((key) => key.name)
    const payments = await Promise.all(keys.map((key) => c.env.STRIPE_INVOICE_PAYMENT.get(key, { type: 'json' })))
    return c.json(payments)
  }
)
