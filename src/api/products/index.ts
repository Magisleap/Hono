import { HTTPMethod } from '@/enums/method'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import { zip } from 'lodash'
import Stripe from 'stripe'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/',
    tags: ['商品'],
    summary: '一覧取得',
    description: '商品一覧を取得し、価格情報と紐つけた上で返します',
    request: {},
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
    const stripe: Stripe = new Stripe(c.env.STRIPE_API_KEY_SECRET, {
      typescript: true
    })
    // Stripe CLIに勝手に商品サンプルを追加されるのでフィルターを掛ける
    // 現在は商品数が少ないことを見越して全商品を取得しているが、将来的にはページネーションを実装する予定
    const products: Stripe.Product[] = (await stripe.products.list()).data.filter(
      (product) => product.default_price !== null
    )
    // 価格情報を取得
    const prices: Stripe.Price[] = await Promise.all(
      products.map((product) => stripe.prices.retrieve(product.default_price as string))
    )
    // マージして返す
    return c.json(zip(products, prices).map(([product, price]) => ({ ...product, price })))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{product_id}',
    tags: ['商品'],
    summary: '詳細取得',
    description: '商品詳細を取得します',
    request: {
      params: z.object({
        product_id: z.string().openapi({
          default: 'prod_Qr6YjenkMYJht7',
          example: 'prod_Qr6YjenkMYJht7',
          description: '商品ID'
        })
      })
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
    const stripe: Stripe = new Stripe(c.env.STRIPE_API_KEY_SECRET, {
      typescript: true
    })
    const { product_id } = c.req.valid('param')
    const product: Stripe.Product = await stripe.products.retrieve(product_id)
    const price: Stripe.Price = await stripe.prices.retrieve(product.default_price as string)
    return c.json({ ...product, price })
  }
)
