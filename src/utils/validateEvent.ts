import { CORS_PROXY_ID } from '../constants'

export const makeValidEvent = <Event = { [key: string]: any }>(
  event: Event
) => ({
  ...event,
  [CORS_PROXY_ID]: true,
})

export const isValidEvent = (event: { [key: string]: any }) =>
  event && event[CORS_PROXY_ID]
