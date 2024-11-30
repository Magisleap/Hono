import { HTTPMethod } from '@/enums/method'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{discord_user_id}',
    tags: [''],
    summary: '詳細取得',
    description: '顧客情報を取得します',
    request: {
      params: z.object({
        price_id: z.string().openapi({
          default: 'price_1PzOLFFHNegLdPHwOa5QLDJP',
          example: 'price_1PzOLFFHNegLdPHwOa5QLDJP',
          description: '価格ID'
        })
      })
    },
    responses: {
      200: {
        type: 'application/json',
        description: '価格データ'
      },
      ...BadRequestResponse({
        message: '不正なリクエストです'
      })
    }
  }),
  async (c) => {
    const { customer_id } = c.req.valid('param')

    const adapter: PrismaD1 = new PrismaD1(c.env.DB)
    const prisma: PrismaClient = new PrismaClient({ adapter })

    return c.json({ customer_id })
  }
)
