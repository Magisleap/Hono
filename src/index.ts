import { OpenAPIHono as Hono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import Stripe from 'stripe'
import { app as checkout } from './checkout'
import { app as prices } from './prices'
import { app as products } from './products'
import { app as subscriptions } from './subscriptions'
import type { Bindings } from './utils/bindings'
import { reference, specification } from './utils/docs'
import { scheduled } from './utils/handler'
import { app as webhook } from './webhook'

const app = new Hono<{ Bindings: Bindings }>()

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Tokyo')

app.use(logger())
app.use(csrf())
app.use('*', cors())
app.doc('/specification', specification)
app.get('/docs', apiReference(reference))
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status)
  }
  console.error(err)
  return c.text('Internal Server Error', 500)
})
app.notFound((c) => c.redirect('/docs'))
app.route('webhook', webhook)
app.route('products', products)
app.route('prices', prices)
app.route('checkout', checkout)
app.route('subscriptions', subscriptions)

export default {
  port: 3000,
  fetch: app.fetch,
  scheduled
}
