import { CHANNEL_RX, CHANNEL_TX, Params } from '../constants'
import {
  IClientTopics,
  IServerTopics,
  ServerID,
  IServerEvent,
  IClientEvent
} from '../types'
import EventEmitter from 'event-emitter'

export type IClientEventHandler = <Topic extends keyof IClientTopics>(
  topic: Topic,
  callback: (data: IClientTopics[Topic], clientId: ServerID) => void
) => void

let client: Client

export class Client {
  private id = `${location.href}${Math.random()
    .toString(16)
    .substr(2, 8)}`

  private rxEvents = EventEmitter()

  private rx = new BroadcastChannel(CHANNEL_RX)
  private tx = new BroadcastChannel(CHANNEL_TX)

  public once: IClientEventHandler = (...args) => this.rxEvents.once(...args)
  public off: IClientEventHandler = (...args) => this.rxEvents.off(...args)
  public on: IClientEventHandler = (...args) => this.rxEvents.on(...args)

  constructor() {
    setClient(this)

    this.rx.addEventListener('message', (event: MessageEvent) => {
      const { topic, data }: IServerEvent = event.data

      this.rxEvents.emit(topic, data)
    })
  }

  private pingTimer = setInterval(() => this.emit('ping'), 1000)

  public dispose() {
    clearInterval(this.pingTimer)

    this.emit('disposeClient', null, true)

    this.rx.close()
    this.tx.close()
  }

  public getServer() {
    return new Promise<IClientTopics['serverPing']>((resolve, reject) => {
      const dispose = () => this.off('serverPing', handler)

      const timer = setTimeout(() => {
        dispose()
        reject(new Error('Failed to find a server!'))
      }, 300)

      const handler = (server: IClientTopics['serverPing']) => {
        // if (url = this.proxyurl)
        {
          clearTimeout(timer)
          resolve(server)
          dispose()
        }
      }

      this.on('serverPing', handler)
      this.emit('pingServers', null, true)
    })
  }

  public emit<Topic extends keyof IServerTopics>(
    topic: Topic,
    data?: IServerTopics[Topic],
    everyone = false
  ) {
    const server = !everyone && null /*(await this.getServer())*/

    const event: IServerEvent<Topic> = {
      topic,
      to: server ? server.id : undefined,
      from: this.id,
      data
    }

    this.tx.postMessage(event)
  }

  public async openServerInNewTab(
    {
      serverUrl,
      adapterUrl,
      reloadForFocus = false
    }: {
      serverUrl: string
      adapterUrl: string
      reloadForFocus?: boolean
    } = {} as any
  ) {
    const url = new URL(serverUrl, location.href)
    url.searchParams.set(Params.adapterUrl, adapterUrl)

    if (reloadForFocus) {
      window.open(location.href)
      location.href = url.href
    } else {
      window.open(url.href)
    }
  }
}

const setClient = (target: Client) => {
  if (client) throw new Error(`Only one client can exist!`)

  client = target
}

export const getClient = () => {
  if (!client) throw new Error(`No client has been created!`)

  return client
}
