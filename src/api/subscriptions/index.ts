import { HTTPMethod } from '@/enums/method'
import { jwtAuth } from '@/middlewares/jwt_auth'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()
app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/',
    middleware: [jwtAuth],
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
    const keys: string[] = (await c.env.STRIPE_INVOICE_PAYMENT.list({ limit: 25 })).keys.map((key) => key.name)
    const payments = await Promise.all(keys.map((key) => c.env.STRIPE_INVOICE_PAYMENT.get(key, { type: 'json' })))
    return c.json(payments)
  }
)
