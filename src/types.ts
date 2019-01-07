import { handlers, Events } from './Handler'

export type ClientID = string
export type ServerID = string
export type WebSocketID = string | number

export type WebSocketData = string | ArrayBufferLike | Blob | ArrayBufferView

export interface IClientTopics {
  websocketEvent: {
    id: WebSocketID
    type: string
    rest?: {
      [key: string]: any
    }
  }
  websocketInfo: {
    id: WebSocketID
    info: {
      [key: string]: any
    }
  }
  pong: {
    url: string
  }
}

type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never

export type IServerTopics = Events<
  UnionToIntersection<(typeof handlers[number])['prototype']>
>

export interface IServerEvent<
  Topic extends keyof IServerTopics = keyof IServerTopics
> {
  topic: Topic
  data: IServerTopics[Topic]
  from: ClientID
  to?: ServerID
}

export interface IClientEvent<
  Topic extends keyof IClientTopics = keyof IClientTopics
> {
  topic: Topic
  data: IClientTopics[Topic]
  from: ServerID
  to?: ClientID
}
