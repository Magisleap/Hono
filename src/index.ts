import { OpenAPIHono as Hono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { type JwtVariables as Variables, jwt } from 'hono/jwt'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'
import { app as checkout } from './api/checkout'
import { app as prices } from './api/prices'
import { app as products } from './api/products'
import { app as users } from './api/users'
import { app as webhook } from './api/webhook'
import { prisma } from './middlewares/prisma.middleware'
import type { Bindings } from './utils/bindings'
import { reference, specification } from './utils/docs'
import { scheduled } from './utils/handler'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  in: 'header',
  description: 'Bearer Token'
})

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Tokyo')

app.use(logger())
app.use(csrf())
app.use('*', cors())
app.use('*', prisma)
// app.use('*', jwtAuth)
app.notFound((c) => c.redirect('/docs'))
app.doc('/specification', specification)
app.get('/docs', apiReference(reference))
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status)
  }
  if (err instanceof ZodError) {
    return c.json({ message: JSON.parse(err.message) }, 400)
  }
  console.error(err)
  return c.text('Internal Server Error', 500)
})
app.notFound((c) => c.redirect('/docs'))
app.route('webhook', webhook)
app.route('products', products)
app.route('prices', prices)
app.route('checkout', checkout)
app.route('users', users)

export default {
  port: 3000,
  fetch: app.fetch,
  scheduled
}
