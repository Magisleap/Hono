import { HTTPMethod } from '@/enums/method'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/',
    tags: ['Webhook'],
    summary: '処理',
    description: 'StripeのWebhookを受け取って処理します',
    request: {},
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
    return c.json({})
  }
)
