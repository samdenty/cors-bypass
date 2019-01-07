import { Handler } from '../../Handler'
import { WebSocketData, WebSocketID } from '../../types'
import { Server, ConnectedClient } from '../../Server'

export class WebSocketHandler implements Handler {
  private websockets = new Map<WebSocketID, WebSocket>()

  constructor(private server: Server, private client: ConnectedClient) {}

  public newWebsocket({
    url,
    protocols,
    id
  }: {
    id: WebSocketID
    url: string
    protocols?: string | string[]
  }) {
    const ws = new WebSocket(url, protocols)

    const dispatchEvent = (event: Event) => {
      const rest = {}
      ;[
        'data',
        'bubbles',
        'cancelBubble',
        'cancelable',
        'composed',
        'path',
        'timestamp'
      ].forEach(key => {
        const value = event[key]

        if (value !== undefined) rest[key] = value
      })

      this.server.emit('websocketEvent', { type: event.type, id, rest })

      if (event.type === 'open') {
        this.server.emit('websocketInfo', {
          id,
          info: {
            extensions: ws.extensions,
            binaryType: ws.binaryType,
            protocol: ws.protocol
          }
        })
      }
    }

    ws.onerror = dispatchEvent
    ws.onopen = dispatchEvent
    ws.onclose = dispatchEvent
    ws.onmessage = dispatchEvent

    this.websockets.set(id, ws)
  }

  public websocketInfo({
    info,
    id
  }: {
    id: WebSocketID
    info: {
      [key: string]: any
    }
  }) {
    const ws = this.websockets.get(id)

    if (ws)
      Object.keys(info).forEach(key => {
        ws[key] = info[key]
      })
  }

  public websocketSend({ id, data }: { id: WebSocketID; data: WebSocketData }) {
    const ws = this.websockets.get(id)

    if (ws) ws.send(data)
  }

  public websocketClose({
    code,
    reason,
    id
  }: {
    id: WebSocketID
    code?: number
    reason?: string
  }) {
    const ws = this.websockets.get(id)

    if (ws) ws.close(code, reason)
  }

  public dispose() {
    this.websockets.forEach(ws => ws.close())
  }
}
