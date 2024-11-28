import { HTTPMethod } from '@/enums/method'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import Stripe from 'stripe'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{customer_id}',
    tags: ['顧客'],
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
    const stripe: Stripe = new Stripe(c.env.STRIPE_API_KEY_SECRET, {
      typescript: true
    })
    const { price_id } = c.req.valid('param')
    const price = await stripe.prices.retrieve(price_id)
    const product = await stripe.products.retrieve(price.product as string)
    return c.json({ ...price, ...product })
  }
)
