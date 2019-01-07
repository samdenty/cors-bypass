import { Handler } from '../../Handler'
import { EventTarget, defineEventAttribute } from 'event-target-shim'
import { getClient } from '../../Client'
import { WebSocketData, IClientTopics } from '../../types'

let lastId = 0
const createId = () => ++lastId

export class WebSocket extends EventTarget {
  private client = getClient()
  private id = createId()
  private _binaryType: BinaryType = 'blob'

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null
  public onerror: ((this: WebSocket, ev: Event) => any) | null
  public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null
  public onopen: ((this: WebSocket, ev: Event) => any) | null

  public CONNECTING = WebSocket.CONNECTING
  public OPEN = WebSocket.OPEN
  public CLOSING = WebSocket.CLOSING
  public CLOSED = WebSocket.CLOSED

  public readyState = WebSocket.CONNECTING
  public bufferedAmount = 0
  public extensions = ''
  public protocol = ''

  public get binaryType() {
    return this._binaryType
  }

  public set binaryType(binaryType: BinaryType) {
    this._binaryType = binaryType

    this.client.server.emit('websocketInfo', {
      id: this.id,
      info: { binaryType }
    })
  }

  constructor(public url: string, protocols?: string | string[]) {
    super()
    this.client.server.emit('newWebsocket', { id: this.id, url, protocols })

    const handleWebsocketEvent = ({
      id,
      type,
      rest
    }: IClientTopics['websocketEvent']) => {
      if (id !== this.id) return

      const event =
        type === 'close'
          ? new CloseEvent('close', rest)
          : type === 'message'
          ? new MessageEvent('message', rest)
          : new Event(type, rest)

      this.dispatchEvent(event)
    }

    const handleWebsocketInfo = ({
      id,
      info
    }: IClientTopics['websocketInfo']) => {
      if (id !== this.id) return

      Object.keys(info).forEach(key => (this[key] = info[key]))
    }

    this.client.server.on('websocketEvent', handleWebsocketEvent)
    this.client.server.on('websocketInfo', handleWebsocketInfo)

    this.addEventListener('close', () => {
      this.readyState = WebSocket.CLOSED
      this.client.server.off('websocketEvent', handleWebsocketEvent)
      this.client.server.off('websocketInfo', handleWebsocketInfo)
    })
    this.addEventListener('open', () => {
      this.readyState = WebSocket.OPEN
    })
  }

  public send(data: WebSocketData) {
    if (this.readyState !== WebSocket.OPEN) throw new Error()

    this.client.server.emit('websocketSend', { id: this.id, data })
  }

  public close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSING
    this.client.server.emit('websocketClose', { id: this.id, code, reason })
  }
}

defineEventAttribute(WebSocket.prototype, 'close')
defineEventAttribute(WebSocket.prototype, 'error')
defineEventAttribute(WebSocket.prototype, 'message')
defineEventAttribute(WebSocket.prototype, 'open')
