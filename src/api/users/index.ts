import { HTTPMethod } from '@/enums/method'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/',
    tags: ['ユーザー'],
    summary: '一覧',
    description: 'ユーザー情報一覧を返します',
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
    const users = await c.prisma.user.findMany()
    return c.json(users)
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{discord_user_id}',
    tags: ['ユーザー'],
    summary: '取得',
    description: 'ユーザー情報を返します',
    request: {
      params: z.object({
        discord_user_id: z.bigint().openapi({})
      })
    },
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
    const { discord_user_id } = c.req.valid('param')
    const users = await c.prisma.user.findUnique({
      where: {
        userId: discord_user_id
      }
    })
    return c.json(users)
  }
)
