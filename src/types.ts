export type ServerID = string | number
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
  serverPing: {
    id: ServerID
    url: string
  }
}

export interface IServerTopics {
  pingServers: null

  newWebsocket: {
    id: WebSocketID
    url: string
    protocols?: string | string[]
  }

  websocketSend: {
    id: WebSocketID
    data: WebSocketData
  }

  websocketClose: {
    id: WebSocketID
    code?: number
    reason?: string
  }

  websocketInfo: {
    id: WebSocketID
    info: {
      [key: string]: any
    }
  }
}

export interface IServerEvent<
  Topic extends keyof IServerTopics = keyof IServerTopics
> {
  topic: Topic
  data: IServerTopics[Topic]
  to?: ServerID
}

export interface IClientEvent<
  Topic extends keyof IClientTopics = keyof IClientTopics
> {
  topic: Topic
  data: IClientTopics[Topic]
  from: ServerID
}
