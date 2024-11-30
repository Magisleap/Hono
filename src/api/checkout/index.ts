import { HTTPMethod } from '@/enums/method'
import { Payment } from '@/enums/payment'
import { StripeDTO } from '@/models/checkout.dto'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import dayjs from 'dayjs'
import { HTTPException } from 'hono/http-exception'
import Stripe from 'stripe'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/',
    tags: ['決済'],
    summary: '詳細取得',
    description: '決済用のURLを取得します',
    request: {
      body: {
        content: {
          'application/json': {
            schema: StripeDTO.Checkout.Request
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
      typescript: true
    })
    const checkout = await stripe.checkout.sessions.create({
      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: true
        }
      },
      // custom_fields: parameters.custom_fields,
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
      locale: parameters.locale,
      metadata: parameters.metadata,
      mode: parameters.mode
    })
    if (checkout.url === null) {
      throw new HTTPException(404, { message: 'Not Found.' })
    }
    return c.json({ url: checkout.url })
    // return c.redirect(checkout.url)
  }
)
