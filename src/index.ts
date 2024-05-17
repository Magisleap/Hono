import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'
import { cache } from 'hono/cache'

const app = new Hono()

app.use(logger())
app.use(csrf())
app.use('*', cors())
app.onError((err, c) => {
  console.error(err)
  return c.text('Internal Server Error', 500)
})

export default {
  port: 3000,
  fetch: app.fetch
}
