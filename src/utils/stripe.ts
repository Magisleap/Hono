import Stripe from 'stripe'

// export const stripe: Stripe = (() => {
//   const secret: string | undefined = process.env.STRIPE_API_KEY_SECRET
//   if (secret === undefined) {
//     throw new Error('STRIPE_API_KEY must be set in the .dev.vars.')
//   }
//   return new Stripe(secret, {
//     apiVersion: '2024-06-20'
//   })
// })()
