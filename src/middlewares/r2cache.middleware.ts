import type { Context, MiddlewareHandler, Next } from 'hono'
import { createMiddleware } from 'hono/factory'

/**
 * R2にキャッシュがあればそれを優先的に利用する
 */
export const r2cache = createMiddleware(async (c: Context, next: Next) => {
  if (new URL(c.req.url).pathname === 'ip.jsamobile.jp') {
    const credential: string = btoa(`${c.env.JSAMOBILE_USERNAME}:${c.env.JSAMOBILE_PASSWORD}`)
    c.header('Authorization', `Basic ${credential}`)
    c.header('User-Agent', 'JsaLive/1 CFNetwork/1474.1 Darwin/23.0.0')
  }
  await next()
})
