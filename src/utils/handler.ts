import type { Bindings } from './bindings'

export const scheduled = async (event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> => {
  switch (event.cron) {
    default:
      break
  }
}
