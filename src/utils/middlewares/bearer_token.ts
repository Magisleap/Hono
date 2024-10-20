import type { Bindings } from '@/utils/bindings'
import type { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'
import { AlgorithmTypes } from 'hono/utils/jwt/jwa'

/**
 * @param c
 * @param next
 * @returns
 */
export const bearerToken = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  return jwt({
    secret: c.env.JWT_PRIVATE_KEY,
    alg: AlgorithmTypes.HS256
  })(c, next)
}
