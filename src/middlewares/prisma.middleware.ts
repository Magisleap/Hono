import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'
import type { Context, Next } from 'hono'
import { createMiddleware } from 'hono/factory'

export const prisma = createMiddleware(async (c: Context, next: Next) => {
  const adapter: PrismaD1 = new PrismaD1(c.env.DB)
  const prisma: PrismaClient = new PrismaClient({ adapter })
  c.prisma = prisma
  await next()
})
