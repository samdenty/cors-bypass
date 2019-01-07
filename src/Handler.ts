import { WebSocketHandler } from './API'
import { ServerHandler } from './Server/Server/ServerHandler'
import { ConnectedClientHandler } from './Server/ConnectedClient'
import { IServerTopics } from './types'

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never

export interface Handler {
  dispose?(): void
}

export type Events<Handlee extends Handler> = {
  [Topic in Exclude<
    keyof Handlee,
    keyof Handler
  >]: Handlee[Topic] extends Function
    ? ArgumentTypes<Handlee[Topic]>[0]
    : Handlee[Topic]
}

export const handlers: (
  | typeof ServerHandler
  | typeof WebSocketHandler
  | typeof ConnectedClientHandler)[] = [
  ServerHandler,
  WebSocketHandler,
  ConnectedClientHandler
]
