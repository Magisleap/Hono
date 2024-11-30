import { Locale } from '@/enums/locale'
import { Payment } from '@/enums/payment'
import { z } from '@hono/zod-openapi'
import Stripe from 'stripe'

export namespace StripeDTO {
  export namespace Checkout {
    export const Request = z.object({
      client_reference_id: z.string().openapi({
        default: '383683302801932289',
        example: '383683302801932289',
        description: 'クライアントID'
      }),
      price_id: z.string().openapi({
        default: 'price_1PzOLFFHNegLdPHwOa5QLDJP',
        example: 'price_1PzOLFFHNegLdPHwOa5QLDJP',
        description: '価格ID'
      }),
      mode: z.nativeEnum(Payment).openapi({
        default: Payment.SUBSCRIPTION,
        example: Payment.SUBSCRIPTION,
        description: '購入モード'
      }),
      quantity: z.number().openapi({
        default: 1,
        example: 1,
        description: '数量'
      }),
      return_url: z.string().url().openapi({
        default: 'https://example.com/return',
        example: 'https://example.com/return',
        description: 'リダイレクトURL'
      }),
      success_url: z.string().url().openapi({
        default: 'https://example.com/success',
        example: 'https://example.com/success',
        description: '成功時のリダイレクトURL'
      }),
      cancel_url: z.string().url().openapi({
        default: 'https://example.com/cancel',
        example: 'https://example.com/cancel',
        description: 'キャンセル時のリダイレクトURL'
      }),
      locale: z.nativeEnum(Locale).optional().openapi({
        default: Locale.Ja,
        example: Locale.Ja,
        description: 'ロケール'
      }),
      // custom_fields: z
      //   .array(
      //     z.object({
      //       key: z.string(),
      //       label: z.object({
      //         type: z.enum(['custom']),
      //         custom: z.string()
      //       }),
      //       text: z
      //         .object({
      //           minimum_length: z.number().optional(),
      //           maximum_length: z.number().optional(),
      //           default_value: z.string().optional()
      //         })
      //         .optional(),
      //       type: z.enum(['text'])
      //     })
      //   )
      //   .optional(),
      metadata: z.record(z.string().or(z.number())).optional()
    })
  }
}
