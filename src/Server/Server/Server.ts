import {
  IServerTopics,
  IClientTopics,
  IServerEvent,
  IClientEvent,
  ClientID
} from '../../types'
import { Params } from '../../constants'
import { makeValidEvent, isValidEvent } from '../../utils'
import { ConnectedClient } from '../ConnectedClient'

export type IServerOptions = {
  adapterUrl?: string
}

export class Server {
  public clients = new Map<ClientID, ConnectedClient>()
  private params = new URLSearchParams(location.search)

  public iframe = document.createElement('iframe')
  public id = `${location.href}${Math.random()
    .toString(16)
    .substr(2, 8)}`

  constructor(options: IServerOptions = {}) {
    const { adapterUrl = this.params.get(Params.adapterUrl) } = options

    this.iframe.style.display = 'none'
    this.iframe.src = adapterUrl
    document.body.appendChild(this.iframe)

    window.addEventListener('message', ({ data }: MessageEvent) => {
      if (!isValidEvent(data) || typeof data['topic'] !== 'string') return
      if (data.to && data.to !== this.id) return

      const event: IServerEvent = data

      this.handleEvent(event.topic, event.data, event.from)
    })
  }

  private handleEvent = <Topic extends keyof IServerTopics>(
    topic: Topic,
    payload: IServerTopics[Topic],
    clientId: ClientID
  ) => {
    if (!this.clients.has(clientId))
      this.clients.set(clientId, new ConnectedClient(this, clientId))

    const client = this.clients.get(clientId)

    const handled = client.handleEvent(topic, payload)
  }

  public emit = <Topic extends keyof IClientTopics>(
    topic: Topic,
    data: IClientTopics[Topic]
  ) => {
    const event = makeValidEvent<IClientEvent<Topic>>({
      topic,
      from: this.id,

      data
    })

    this.iframe.contentWindow.postMessage(event, '*')
  }
}
