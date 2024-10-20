import { OpenAPIHono as Hono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'
import type { Bindings } from './utils/bindings'
import { reference, specification } from './utils/docs'
import { scheduled } from './utils/handler'

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())
app.use(csrf())
app.use('*', cors())
app.doc('/specification', specification)
app.get('/docs', apiReference(reference))
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status)
  }
  if (err instanceof ZodError) {
    return c.json({ message: JSON.parse(err.message), description: err.cause }, 400)
  }
  console.error(err)
  return c.json({ message: err.message }, 500)
})
app.notFound((c) => c.redirect('/docs'))

export default {
  port: 3000,
  fetch: app.fetch,
  scheduled
}
