import { Buffer } from 'node:buffer'
import type { Context, Next } from 'hono'
import { createMiddleware } from 'hono/factory'
import iconv from 'iconv-lite'

export const notFound = createMiddleware(async (c: Context, next: Next) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    if (response.status === 200) {
      const body: Buffer = Buffer.from(await response.arrayBuffer())
      // const message: string = iconv.decode(body.slice(5), 'shift-jis')
      // console.log(body.length, message)
      // メッセージ内容でもチェックできるが、簡易的に40バイトで判定する
      if (body.length === 40) {
        return new Response(body, {
          status: 404,
          statusText: 'Not Found',
          headers: response.headers
        })
      }
      // console.log('Found', Buffer.from(iconv.decode(body, 'shift-jis')))
      return new Response(body, {
        status: 200,
        statusText: 'OK',
        headers: response.headers
      })
    }
    return response
  }
  await next()
})
