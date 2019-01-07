import EventEmitter from 'event-emitter'
import {
  ServerID,
  IServerTopics,
  IClientTopics,
  IClientEvent
} from '../../types'
import { Client } from '../Client'
import { PONG_INTERVAL } from '../../Server'

export type IConnectedServerTopics = IClientTopics & { disconnect: null }

export type IConnectedServerEventHandler = <
  Topic extends keyof IConnectedServerTopics
>(
  topic: Topic,
  callback: (
    data: IConnectedServerTopics[Topic],
    event?: Topic extends keyof IClientTopics ? IClientEvent<Topic> : undefined
  ) => void
) => void

export class ConnectedServer {
  private events = EventEmitter()

  private disposeTimer: any
  private listeners = new Map<string, Function>()

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

  public on: IConnectedServerEventHandler = (topic, callback) => {
    this.events.on(topic, callback)

    if (!this.listeners.has(topic)) {
      const clientCallback = this.client.on(
        topic as keyof IClientTopics,
        (data, event) => {
          if (event.from === this.id) this.events.emit(topic, data, event)
        }
      )

      this.listeners.set(topic, clientCallback as any)
    }

    return callback
  }

  public off: IConnectedServerEventHandler = (topic, callback) => {
    return this.events.off(topic, callback)
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
    this.events.emit('disconnect')

    this.clearDisposeTimer()

    for (const [topic, callback] of Array.from(this.listeners.entries())) {
      this.client.off(topic as any, callback as any)
    }

    this.client.servers.delete(this.id)
  }
}
