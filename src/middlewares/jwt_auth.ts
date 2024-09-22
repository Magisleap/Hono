import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { decode, jwt, sign, verify } from 'hono/jwt'
import {
  type JWTPayload,
  JwtAlgorithmNotImplemented,
  JwtHeaderInvalid,
  JwtTokenExpired,
  JwtTokenInvalid,
  JwtTokenIssuedAt,
  JwtTokenNotBefore,
  JwtTokenSignatureMismatched
} from 'hono/utils/jwt/types'

const Key = z.object({
  alg: z.enum(['RS256']),
  e: z.string(),
  n: z.string(),
  kid: z.string(),
  kty: z.enum(['RSA']),
  usage: z.enum(['id_token']),
  use: z.enum(['sig']),
  x5c: z.array(z.string())
})

const CertificateList = z.object({
  keys: z.array(Key)
})

const Header = z.object({
  alg: z.enum([
    'HS256',
    'HS384',
    'HS512',
    'RS256',
    'RS384',
    'RS512',
    'PS256',
    'PS384',
    'PS512',
    'ES256',
    'ES384',
    'ES512',
    'EdDSA'
  ]),
  jku: z.string().url(),
  kid: z.string(),
  typ: z.enum(['JWT'])
})

const Payload = z.object({
  iss: z.enum(['api-lp1.znc.srv.nintendo.net'])
})

const JWTToken = z.object({
  header: Header,
  payload: Payload
})

type JWTToken = z.infer<typeof JWTToken>
type Key = z.infer<typeof Key>

/**
 * 外部から提供されたJSON Web Tokenを検証します
 * 指定された機関が発行したJWT以外は通さない
 * @param c
 * @param next
 * @returns
 */
export const jwtAuth = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const auth: string | undefined = c.req.header('Authorization')
  if (auth === undefined) {
    throw new HTTPException(401, { message: 'Unauthorized.' })
  }
  const pattern: RegExp = /^Bearer (.*)$/
  const match: RegExpMatchArray | null = auth.match(pattern)
  if (match === null) {
    throw new HTTPException(401, { message: 'Unauthorized.' })
  }
  const bearer: string = match[1]
  const token: JWTToken = JWTToken.parse(decode(bearer))

  const keys: Key[] = CertificateList.parse(await (await fetch(new URL(token.header.jku).href)).json()).keys
  const key: Key | undefined = keys.find((key) => key.kid === token.header.kid) as Key
  if (key === undefined) {
    throw new HTTPException(401, { message: 'Unauthorized.' })
  }
  try {
    console.log(await verify(bearer, key, token.header.alg))
    await next()
  } catch (error) {
    if (error instanceof JwtTokenExpired) {
      throw new HTTPException(401, { message: 'Token has expired.' })
    }
    if (error instanceof JwtHeaderInvalid) {
      throw new HTTPException(401, { message: 'Invalid token header.' })
    }
    if (error instanceof JwtTokenInvalid) {
      throw new HTTPException(401, { message: 'Invalid token.' })
    }
    if (error instanceof JwtAlgorithmNotImplemented) {
      throw new HTTPException(400, { message: 'Unsupported token signing algorithm.' })
    }
    if (error instanceof JwtTokenNotBefore) {
      throw new HTTPException(401, { message: 'Token not valid yet.' })
    }
    if (error instanceof JwtTokenIssuedAt) {
      throw new HTTPException(401, { message: 'Token used before issued.' })
    }
    if (error instanceof JwtTokenSignatureMismatched) {
      throw new HTTPException(401, { message: 'Invalid token signature.' })
    }
    throw new HTTPException(400, { message: 'Bad Request.' })
  }
}
