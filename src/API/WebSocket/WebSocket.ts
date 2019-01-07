import { Handler } from '../../Handler'
import { EventTarget, defineEventAttribute } from 'event-target-shim'
import { getClient } from '../../Client'
import { WebSocketData, IClientTopics } from '../../types'

let lastId = 0
const createId = () => ++lastId

export class WebSocket extends EventTarget {
  private client = getClient()
  private server = this.client.server

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

    this.server &&
      this.server.emit('websocketInfo', {
        id: this.id,
        info: { binaryType }
      })
  }

  constructor(public url: string, protocols?: string | string[]) {
    super()

    if (this.server) {
      this.server.emit('newWebsocket', { id: this.id, url, protocols })

      this.server.on('disconnect', () =>
        this.handleWebsocketEvent({ id: this.id, type: 'close' })
      )
      this.server.on('websocketEvent', this.handleWebsocketEvent)
      this.server.on('websocketInfo', this.handleWebsocketInfo)

      this.addEventListener('close', () => {
        this.readyState = WebSocket.CLOSED
        this.server.off('websocketEvent', this.handleWebsocketEvent)
        this.server.off('websocketInfo', this.handleWebsocketInfo)
      })
      this.addEventListener('open', () => {
        this.readyState = WebSocket.OPEN
      })
    } else {
      this.handleWebsocketEvent({ id: this.id, type: 'error' })
    }
  }

  public send(data: WebSocketData) {
    if (!this.server || this.readyState !== WebSocket.OPEN) throw new Error()

    this.server.emit('websocketSend', { id: this.id, data })
  }

  public close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSING

    this.server &&
      this.server.emit('websocketClose', { id: this.id, code, reason })
  }

  private handleWebsocketEvent = ({
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

  private handleWebsocketInfo = ({
    id,
    info
  }: IClientTopics['websocketInfo']) => {
    if (id !== this.id) return

    Object.keys(info).forEach(key => (this[key] = info[key]))
  }
}

defineEventAttribute(WebSocket.prototype, 'close')
defineEventAttribute(WebSocket.prototype, 'error')
defineEventAttribute(WebSocket.prototype, 'message')
defineEventAttribute(WebSocket.prototype, 'open')
