import { CHANNEL_RX, CHANNEL_TX, Params } from '../constants'
import {
  IClientTopics,
  IServerTopics,
  ServerID,
  IServerEvent,
  IClientEvent
} from '../types'
import { ConnectedServer } from './ConnectedServer'
import EventEmitter from 'event-emitter'

export type IClientEventHandler = <Topic extends keyof IClientTopics>(
  topic: Topic,
  callback: IClientHandlerCallback<Topic>
) => void

export type IClientHandlerCallback<
  Topic extends keyof IClientTopics = keyof IClientTopics
> = (data: IClientTopics[Topic], event: IClientEvent<Topic>) => void

let client: Client

export const PING_INTERVAL = 1000

export class Client {
  private id = `${location.href}${Math.random()
    .toString(16)
    .substr(2, 8)}`
  private pingTimer = setInterval(() => this.emit('ping'), PING_INTERVAL)

  private rxEvents = EventEmitter()

  private rx = new BroadcastChannel(CHANNEL_RX)
  private tx = new BroadcastChannel(CHANNEL_TX)

  public servers = new Map<ServerID, ConnectedServer>()

  public once: IClientEventHandler = (...args) => this.rxEvents.once(...args)
  public off: IClientEventHandler = (...args) => this.rxEvents.off(...args)
  public on: IClientEventHandler = (...args) => {
    this.rxEvents.on(...args)
    return args[1]
  }

  constructor() {
    setClient(this)

    this.rx.addEventListener('message', ({ data }: MessageEvent) => {
      const event: IServerEvent = data
      if (event.to && event.to !== this.id) return

      this.rxEvents.emit(event.topic, event.data, event)
    })

    this.on('pong', (_, { from: serverId, data: { url } }) => {
      if (!this.servers.has(serverId)) {
        const server = new ConnectedServer(this, serverId, url)
        this.servers.set(serverId, server)
      }
    })
  }

  public get server() {
    // @TODO: Get the correct server
    const servers = Array.from(this.servers.values()).sort((a, b) =>
      a.lastPing === b.lastPing ? 0 : a.lastPing > b.lastPing ? -1 : 1
    )

    const bestServer = servers[0]
    if (!bestServer) throw new Error(`Couldn't find a server!`)

    return bestServer
  }

  public dispose() {
    clearInterval(this.pingTimer)

    this.emit('disposeClient')

    this.rx.close()
    this.tx.close()
  }

  public emit<Topic extends keyof IServerTopics>(
    topic: Topic,
    data: IServerTopics[Topic] = null,
    serverId?: ServerID
  ) {
    const event: IServerEvent<Topic> = {
      topic,
      to: serverId,
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
