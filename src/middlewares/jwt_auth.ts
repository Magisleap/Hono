import type { Bindings } from '@/utils/bindings'
import type { Context, Next } from 'hono'
import { createMiddleware } from 'hono/factory'
import { decode, jwt, sign, verify } from 'hono/jwt'

export const jwtAuth = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  return jwt({ secret: c.env.JWT_SECRET_KEY, alg: 'RS256', cookie: '_gtoken' })(c, next)
}
