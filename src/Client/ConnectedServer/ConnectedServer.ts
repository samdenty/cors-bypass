import { ServerID, IServerTopics } from '../../types'
import { Client, IClientEventHandler, IClientHandlerCallback } from '../Client'
import { PONG_INTERVAL } from '../../Server'

export class ConnectedServer {
  private listeners = new Map<Function, { topic: string; callback: Function }>()
  private disposeTimer: any

  public lastPing: number

  constructor(private client: Client, public id: ServerID, public url: string) {
    this.handlePing()

    this.on('pong', this.handlePing)
  }

  public emit<Topic extends keyof IServerTopics>(
    topic: Topic,
    data?: IServerTopics[Topic]
  ) {
    this.client.emit(topic, data, this.id)
  }

  public on: IClientEventHandler = (topic, callback) => {
    const clientCallback = this.client.on(topic, (data, event) => {
      if (event.from === this.id) callback(data, event)
    })

    this.listeners.set(callback, { topic, callback: clientCallback as any })

    return callback
  }

  public off: IClientEventHandler = (topic, callback) => {
    const clientCallback = this.listeners.get(callback)
    if (!clientCallback) return

    return this.client.off(topic, clientCallback.callback as any)
  }

  private handlePing = () => {
    this.clearDisposeTimer()
    this.addDisposeTimer()
    this.lastPing = +new Date()
  }

  private addDisposeTimer() {
    this.disposeTimer = setTimeout(() => this.dispose(), PONG_INTERVAL + 1500)
  }

  private clearDisposeTimer() {
    clearTimeout(this.disposeTimer)
  }

  public dispose() {
    this.clearDisposeTimer()
    for (const { topic, callback } of Array.from(this.listeners.values())) {
      this.client.off(topic as any, callback as any)
    }
    this.client.servers.delete(this.id)
  }
}
