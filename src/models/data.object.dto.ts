import { z } from '@hono/zod-openapi'

export const DataObject = <T extends z.AnyZodObject>(S: T) =>
  z.object({
    data: z.object({
      object: S
    }),
    type: z.enum([
      'invoice.payment_succeeded',
      'customer.subscription.updated',
      'customer.subscription.created',
      'checkout.session.completed'
    ])
  })
