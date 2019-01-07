import { handlers, Handler } from '../../Handler'
import { ClientID, IServerTopics, IClientTopics } from '../../types'
import { Server } from '../Server'

export class ConnectedClient {
  private handlers: Handler[] = handlers.map(
    (Handler: any) => new Handler(this.server, this)
  )

  constructor(private server: Server, public id: ClientID) {}

  public handleEvent<Topic extends keyof IServerTopics>(
    topic: Topic,
    payload: IServerTopics[Topic]
  ) {
    if (/constructor|dispose|prototype/.test(String(topic))) return null

    for (const handler of this.handlers) {
      if (topic in handler) {
        const method = handler[topic as string]

        if (typeof method === 'function') {
          const returnValue = method.bind(handler)(payload)

          return { handler, method, returnValue }
        }
      }
    }

    return null
  }

  public emit<Topic extends keyof IClientTopics>(
    topic: Topic,
    data: IClientTopics[Topic]
  ) {
    return this.server.emit(topic, data, this.id)
  }

  public dispose() {
    this.handlers.forEach(handler => handler.dispose && handler.dispose())
    this.server.clients.delete(this.id)
  }
}
