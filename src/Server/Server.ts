import {
  IServerTopics,
  IClientTopics,
  WebSocketID,
  IServerEvent,
  IClientEvent
} from '../types'
import { Params } from '../constants'
import { makeValidEvent, isValidEvent } from '../utils'

export type IServerOptions = {
  adapterUrl?: string
}

export class Server {
  private websockets = new Map<WebSocketID, WebSocket>()
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

      this.handleEvent(data.topic, data.data)
    })
  }

  private handleEvent = <Topic extends keyof IServerTopics>(
    topic: Topic,
    payload: IServerTopics[Topic]
  ) => {
    switch (topic) {
      case 'newWebsocket': {
        const { url, protocols, id } = payload as IServerTopics['newWebsocket']
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

          this.emit('websocketEvent', { type: event.type, id, rest })

          if (event.type === 'open') {
            this.emit('websocketInfo', {
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
        break
      }

      case 'websocketInfo': {
        const { info, id } = payload as IServerTopics['websocketInfo']
        const ws = this.websockets.get(id)

        if (ws)
          Object.keys(info).forEach(key => {
            ws[key] = info[key]
          })

        break
      }

      case 'websocketSend': {
        const { data, id } = payload as IServerTopics['websocketSend']
        const ws = this.websockets.get(id)

        if (ws) ws.send(data)

        break
      }

      case 'websocketClose': {
        const { code, reason, id } = payload as IServerTopics['websocketClose']
        const ws = this.websockets.get(id)

        if (ws) ws.close(code, reason)
        break
      }

      case 'pingServers': {
        this.emit('serverPing', {
          id: this.id,
          url: location.href
        })
        break
      }
    }
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
