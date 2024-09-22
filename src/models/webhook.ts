import { z } from '@hono/zod-openapi'
import { fromPairs } from 'lodash'
import { DataObject } from './data.object.dto'

export namespace Webhook {
  const Line = z
    .object({
      data: z.array(
        z.object({
          amount: z.number().int().min(0),
          amount_excluding_tax: z.number().int().min(0),
          id: z.string().regex(/^il_[\w].*$/),
          invoice: z.string().regex(/^in_[\w].*$/),
          livemode: z.boolean(),
          period: z.object({
            start: z
              .number()
              .int()
              .transform((v) => v * 1000)
              .pipe(z.coerce.date()),
            end: z
              .number()
              .int()
              .transform((v) => v * 1000)
              .pipe(z.coerce.date())
          }),
          plan: z.object({
            active: z.boolean(),
            amount: z.number().int().min(0),
            interval: z.enum(['day', 'month', 'week', 'year']),
            id: z.string().regex(/^price_[\w].*$/),
            interval_count: z.number().int().min(0),
            livemode: z.boolean(),
            billing_scheme: z.enum(['per_unit', 'tiered']),
            product: z.string().regex(/^prod_[\w].*$/),
            usage_type: z.enum(['licensed', 'metered'])
          }),
          price: z.object({
            active: z.boolean(),
            billing_scheme: z.enum(['per_unit', 'tiered']),
            id: z.string().regex(/^price_[\w].*$/),
            livemode: z.boolean(),
            product: z.string().regex(/^prod_[\w].*$/),
            unit_amount: z.number().int().min(0)
          }),
          quantity: z.number().int().min(0),
          subscription: z.string().regex(/^sub_[\w].*$/),
          subscription_item: z.string().regex(/^si_[\w].*$/)
        })
      )
    })
    .transform((v) => {
      return v.data
    })

  export const InvoicePayment = DataObject(
    z.object({
      id: z.string().regex(/^in_[\w].*$/),
      collection_method: z.enum(['charge_automatically', 'send_invoice']),
      customer: z.string().regex(/^cus_[\w].*$/),
      status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']),
      subscription: z.string().regex(/^sub_[\w].*$/),
      subtotal: z.number().int().min(0),
      total: z.number().int().min(0),
      subtotal_excluding_tax: z.number().int().min(0),
      lines: Line
    })
  ).transform((v) => {
    return {
      ...v.data.object,
      type: v.type,
      toJSON() {
        return {
          customer: v.data.object.customer,
          subscription: v.data.object.subscription,
          invoice: v.data.object.lines[0].invoice,
          status: v.data.object.status,
          product: v.data.object.lines[0].plan.product,
          period: v.data.object.lines[0].period
        }
      }
    }
  })

  export const CustomerSubscription = DataObject(
    z.object({
      id: z.string(),
      customer: z.string().regex(/^cus_[\w].*$/),
      latest_invoice: z.string().regex(/^in_[\w].*$/),
      livemode: z.boolean(),
      quantity: z.number().int().min(0),
      status: z.enum(['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'])
    })
  ).transform((v) => {
    return {
      ...v.data.object,
      type: v.type
    }
  })

  export const CheckoutSession = DataObject(
    z.object({
      id: z.string(),
      client_reference_id: z.string().optional(),
      livemode: z.boolean(),
      mode: z.enum(['payment', 'setup', 'subscription']),
      payment_status: z.enum(['paid', 'unpaid', 'no_payment_required']),
      status: z.enum(['complete', 'expired', 'open']),
      amount_subtotal: z.number().int().min(0),
      amount_total: z.number().int().min(0),
      customer: z.string().regex(/^cus_[\w].*$/),
      invoice: z.string().regex(/^in_[\w].*$/),
      subscription: z.string().regex(/^sub_[\w].*$/),
      ui_mode: z.enum(['embedded', 'hosted']).nullable()
    })
  ).transform((v) => {
    return {
      ...v.data.object,
      type: v.type,
      toJSON() {
        return {
          customer: v.data.object.customer,
          subscription: v.data.object.subscription,
          invoice: v.data.object.invoice,
          status: v.data.object.status,
          client_reference_id: v.data.object.client_reference_id,
          payment_status: v.data.object.payment_status
        }
      }
    }
  })

  export type CheckoutSession = z.infer<typeof CheckoutSession>
  export type CustomerSubscription = z.infer<typeof CustomerSubscription>
  export type InvoicePayment = z.infer<typeof InvoicePayment>
}
