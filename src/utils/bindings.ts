import type { PrismaClient } from '@prisma/client/extension'
import type { Context } from 'hono'

export type Bindings = {
  STRIPE_API_KEY_SECRET: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_INVOICE_PAYMENT: KVNamespace
  JWT_SECRET_KEY: string
  API_KEY: string
  DB: D1Database
}

declare module 'hono' {
  interface ContextVariableMap {
    prisma: PrismaClient
  }

  interface Context {
    prisma: PrismaClient
  }
}
