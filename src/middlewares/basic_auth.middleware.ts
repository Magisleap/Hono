import type { Context, MiddlewareHandler, Next } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

/**
 * 日本将棋連盟にアクセスした場合に自動でBasic認証をつける
 */
export const basicAuth = createMiddleware(async (c: Context, next: Next) => {
  const authorization: string | undefined = c.req.header('Authorization')
  if (!authorization) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  const pattern: RegExp = /Basic\s(.*)/
  const match: RegExpMatchArray | null = authorization.match(pattern)
  if (!match) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }
  if (match[1] !== c.env.BASIC_AUTH) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  await next()
})

// export const apiAuth = createMiddleware(async (c: Context, next: Next) => {
//   const { 'x-api-key': api_key } = c.req.valid('header')
//   await next()
// })
